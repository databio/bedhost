"""Tests for safe BED upload handling (no running services needed).

Covers the three upload routes (/v1/bed/embed, /v1/bed/umap,
/v1/bed/search/bed): client filenames are never used as paths, uploads are
size-limited, and parse/validation errors map to clean 4xx responses.
"""

import gzip
import io
import os
import tempfile
import uuid
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

pytest.importorskip("gtars")
pytest.importorskip("bedboss")
pytest.importorskip("bbconf")

import numpy as np  # noqa: E402
from bbconf.models.bed_models import BedListSearchResult  # noqa: E402
from fastapi import FastAPI, HTTPException, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from gtars.models import RegionSet  # noqa: E402

from bedhost import const  # noqa: E402
from bedhost.dependencies import get_bbagent  # noqa: E402
from bedhost.routers import bed_api  # noqa: E402
from bedhost.uploads import save_upload, upload_size_guard  # noqa: E402

# Captured at import, before any test redirects tempfile.tempdir.
REAL_TMP = os.path.realpath(tempfile.gettempdir())

ROUTES = ["/v1/bed/embed", "/v1/bed/umap", "/v1/bed/search/bed"]

VALID_BED = b"chr1\t100\t200\nchr1\t300\t450\nchr2\t1000\t1500\n"
NARROW_BED = b"chr1\t100\t101\nchr1\t200\t202\nchr2\t300\t303\n"


@pytest.fixture
def fake_agent():
    bed = MagicMock()
    bed._embed_file.return_value = np.array([[0.1, 0.2]])
    bed._get_umap_file.return_value = np.array([[0.1, 0.2]])
    bed.bed_to_bed_search.return_value = BedListSearchResult(
        count=0, limit=10, offset=0, results=[]
    )
    config = SimpleNamespace(
        qdrant_file_backend=object(),
        r2v_encoder=object(),
        umap_encoder=object(),
        b2b_search_interface=object(),
    )
    return SimpleNamespace(bed=bed, config=config)


def _build_app(fake_agent) -> FastAPI:
    app = FastAPI()
    app.include_router(bed_api.router)
    # Same order as bedhost.main: guard first, then CORS (so CORS is outermost).
    app.middleware("http")(upload_size_guard)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.dependency_overrides[get_bbagent] = lambda: fake_agent
    return app


@pytest.fixture
def client(fake_agent):
    return TestClient(_build_app(fake_agent))


@pytest.fixture
def upload_tmp(tmp_path, monkeypatch):
    """Point tempfile at a dedicated, initially empty directory."""
    tt = tmp_path / "tt"
    tt.mkdir()
    monkeypatch.setattr(tempfile, "tempdir", str(tt))
    return tt


def _agent_called(fake_agent) -> bool:
    b = fake_agent.bed
    return b._embed_file.called or b._get_umap_file.called or b.bed_to_bed_search.called


# --- path traversal -------------------------------------------------------


EVIL_NAMES = [
    "../../{s}",
    "../../../../tmp/{s}",
    "{abs}",
    "..\\..\\{s}",
    "sentinel/../../{s}",
]


@pytest.mark.parametrize("route", ROUTES)
@pytest.mark.parametrize("pattern", EVIL_NAMES)
def test_client_filename_is_ignored(client, route, pattern, tmp_path, upload_tmp):
    sentinel = f"sentinel_{uuid.uuid4().hex}.bed"
    evil = pattern.format(s=sentinel, abs=str(tmp_path / sentinel))

    res = client.post(route, files={"file": (evil, VALID_BED, "text/plain")})
    assert res.status_code == 200, res.text

    cwd = os.getcwd()
    places = {
        str(tmp_path),
        str(upload_tmp),
        os.path.dirname(str(upload_tmp)),
        cwd,
        os.path.dirname(cwd),
        REAL_TMP,
        os.path.dirname(REAL_TMP),
    }
    for place in places:
        assert not os.path.exists(os.path.join(place, sentinel)), place
    # Upload temp dir was cleaned up, and nothing sentinel-like was written.
    assert list(upload_tmp.iterdir()) == []
    assert not list(tmp_path.rglob("sentinel_*"))


def test_save_upload_uses_fixed_name(tmp_path):
    f = UploadFile(file=io.BytesIO(VALID_BED), filename="/etc/passwd")
    assert save_upload(f, str(tmp_path)) == os.path.join(str(tmp_path), "upload.bed")


def test_save_upload_decompresses_gzip(tmp_path):
    plain_dir = tmp_path / "plain"
    gz_dir = tmp_path / "gz"
    plain_dir.mkdir()
    gz_dir.mkdir()

    plain = save_upload(
        UploadFile(file=io.BytesIO(VALID_BED), filename="x.bed.gz"), str(plain_dir)
    )
    gz = save_upload(
        UploadFile(file=io.BytesIO(gzip.compress(VALID_BED)), filename="x.bed"),
        str(gz_dir),
    )
    assert plain == os.path.join(str(plain_dir), "upload.bed")
    assert gz == os.path.join(str(gz_dir), "upload.bed")
    assert open(gz, "rb").read() == VALID_BED
    assert len(RegionSet(gz)) == len(RegionSet(plain)) == 3


def test_save_upload_gzip_bomb_is_413(tmp_path):
    # ~10 KB of gzip that expands to 10 MB: under the upload cap, over the
    # (patched) decompressed cap. Must stop at the cap, not decompress it all.
    bomb = gzip.compress(b"chr1\t100\t200\n" * (10 * 1024 * 1024 // 13))
    assert len(bomb) < 64 * 1024
    with pytest.raises(HTTPException) as exc:
        save_upload(
            UploadFile(file=io.BytesIO(bomb), filename="x.bed.gz"),
            str(tmp_path),
            max_uncompressed=1024 * 1024,
        )
    assert exc.value.status_code == 413
    assert (tmp_path / "upload.bed").stat().st_size <= 1024 * 1024


def test_save_upload_corrupt_gzip_is_415(tmp_path):
    corrupt = gzip.compress(VALID_BED * 100)[:-20]
    with pytest.raises(HTTPException) as exc:
        save_upload(UploadFile(file=io.BytesIO(corrupt), filename="x"), str(tmp_path))
    assert exc.value.status_code == 415


@pytest.mark.parametrize("route", ROUTES)
def test_gzip_bomb_rejected_by_routes(
    client, fake_agent, route, monkeypatch, upload_tmp
):
    monkeypatch.setattr(const, "MAX_UNCOMPRESSED_SIZE", 1024 * 1024)
    bomb = gzip.compress(b"chr1\t100\t200\n" * (10 * 1024 * 1024 // 13))
    res = client.post(route, files={"file": ("a.bed.gz", bomb, "application/gzip")})
    assert res.status_code == 413, res.text
    assert not _agent_called(fake_agent)
    assert list(upload_tmp.iterdir()) == []


def test_save_upload_refuses_existing_file(tmp_path):
    (tmp_path / "upload.bed").write_bytes(b"keep")
    with pytest.raises(FileExistsError):
        save_upload(UploadFile(file=io.BytesIO(VALID_BED), filename="a"), str(tmp_path))
    assert (tmp_path / "upload.bed").read_bytes() == b"keep"


# --- size limits ----------------------------------------------------------


@pytest.mark.parametrize("route", ROUTES)
def test_streaming_size_limit(client, fake_agent, route, monkeypatch, upload_tmp):
    monkeypatch.setattr(const, "MAX_FILE_SIZE", 1024)
    # Large slack so the middleware lets it through and streaming is what trips.
    monkeypatch.setattr(const, "MULTIPART_OVERHEAD", 10 * 1024 * 1024)
    body = VALID_BED * (2048 // len(VALID_BED) + 1)
    res = client.post(route, files={"file": ("a.bed", body, "text/plain")})
    assert res.status_code == 413, res.text
    assert not _agent_called(fake_agent)
    assert list(upload_tmp.iterdir()) == []


@pytest.mark.parametrize("route", ROUTES)
def test_content_length_guard(client, fake_agent, route):
    claimed = const.MAX_FILE_SIZE + const.MULTIPART_OVERHEAD + 1
    res = client.post(
        route,
        content=b"x",
        headers={
            "content-type": "multipart/form-data; boundary=x",
            "content-length": str(claimed),
            "origin": "https://bedbase.org",
        },
    )
    assert res.status_code == 413, res.text
    assert not _agent_called(fake_agent)
    # Browser clients must still be able to read the error.
    assert "access-control-allow-origin" in res.headers


# --- validation -----------------------------------------------------------


@pytest.mark.parametrize("route", ROUTES)
def test_garbage_file_is_415(client, route):
    res = client.post(
        route, files={"file": ("a.bed", b"this is not a bed file\n", "text/plain")}
    )
    assert res.status_code == 415, res.text


@pytest.mark.parametrize("route", ROUTES)
def test_empty_file_is_400(client, route):
    res = client.post(route, files={"file": ("a.bed", b"", "text/plain")})
    assert res.status_code == 400, res.text


@pytest.mark.parametrize("route", ROUTES)
def test_missing_file_is_422(client, route):
    res = client.post(route, data={"other": "x"})
    assert res.status_code == 422, res.text


@pytest.mark.parametrize("route", ROUTES)
def test_too_many_regions_is_413(client, route, monkeypatch):
    monkeypatch.setattr(const, "MAX_REGION_NUMBER", 2)
    res = client.post(route, files={"file": ("a.bed", VALID_BED, "text/plain")})
    assert res.status_code == 413, res.text
    assert "2 regions" in res.json()["detail"]


def test_narrow_regions_rejected_only_for_search(client):
    res = client.post(
        "/v1/bed/search/bed", files={"file": ("a.bed", NARROW_BED, "text/plain")}
    )
    assert res.status_code == 415, res.text
    res = client.post(
        "/v1/bed/embed", files={"file": ("a.bed", NARROW_BED, "text/plain")}
    )
    assert res.status_code == 200, res.text


def test_valid_upload_returns_results(client, fake_agent):
    res = client.post("/v1/bed/embed", files={"file": ("a.bed", VALID_BED)})
    assert res.status_code == 200
    assert res.json() == [0.1, 0.2]
    res = client.post("/v1/bed/search/bed", files={"file": ("a.bed", VALID_BED)})
    assert res.status_code == 200
    assert res.json()["count"] == 0


@pytest.mark.parametrize(
    "route, attr",
    [
        ("/v1/bed/embed", "r2v_encoder"),
        ("/v1/bed/umap", "umap_encoder"),
        ("/v1/bed/search/bed", "b2b_search_interface"),
    ],
)
def test_ml_disabled_returns_503(fake_agent, route, attr):
    setattr(fake_agent.config, attr, None)
    client = TestClient(_build_app(fake_agent))
    res = client.post(route, files={"file": ("x.bed", NARROW_BED)})
    assert res.status_code == 503
