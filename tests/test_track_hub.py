"""The single-file UCSC trackDb must stay valid whatever text submitters wrote."""

import re

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from bedhost.dependencies import get_bbagent
from bedhost.routers import bed_api
from tests.fakes import VALID_BED_ID, FakeAgent

URL = f"/v1/bed/{VALID_BED_ID}/track_hub_trackDb_file"


@pytest.fixture
def agent():
    agent = FakeAgent()
    agent.bed.bigbed = True
    return agent


@pytest.fixture
def client(agent):
    app = FastAPI()
    app.include_router(bed_api.router)
    app.dependency_overrides[get_bbagent] = lambda: agent
    return TestClient(app)


def _settings(text: str) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for line in text.splitlines():
        if line:
            key, _, value = line.partition("\t")
            out.setdefault(key, []).append(value)
    return out


def test_free_text_cannot_break_the_stanza(agent, client):
    agent.bed.name = "total RNA at\ndiagnosis from BCP-ALL patient P1 \\"
    agent.bed.description = "x\n\nbigDataUrl\thttps://evil.example/a.bb" + "y" * 100

    res = client.get(URL)
    assert res.status_code == 200
    lines = [line for line in res.text.splitlines() if line]
    assert len(lines) == 6
    assert lines[0] == f"track\tbedbase_{VALID_BED_ID}"
    assert re.fullmatch(r"track\t[A-Za-z][A-Za-z0-9_-]*", lines[0])
    # one stanza: the only blank line is the one that ends it
    assert res.text.endswith("\n\n") and "\n\n" not in res.text[:-2]

    settings = _settings(res.text)
    assert len(settings["bigDataUrl"]) == 1
    assert "evil" not in settings["bigDataUrl"][0]
    (short,) = settings["shortLabel"]
    (long,) = settings["longLabel"]
    assert short == "total RNA at diag"
    assert len(long) <= 76
    assert not long.endswith("\\")


def test_missing_name_falls_back_to_id(agent, client):
    agent.bed.name = None
    agent.bed.description = None

    settings = _settings(client.get(URL).text)
    assert settings["shortLabel"] == [VALID_BED_ID[:17]]
    assert settings["longLabel"] == [VALID_BED_ID]


def test_trackdb_value_drops_trailing_backslash_after_cut():
    assert bed_api._trackdb_value("ab \\\\ \\", 17) == "ab"
    assert bed_api._trackdb_value("a" * 16 + "\\" + "b", 17) == "a" * 16
