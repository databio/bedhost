import os

from urllib.parse import urlparse

from bbconf.bbagent import BedBaseAgent
from bbconf.exceptions import AnalysisFileNotFoundError, SnapshotNotFoundError
from bbconf.models.base_models import BedSnapshotResult, AnalysisFileResult
from bbconf.models.drs_models import AccessMethod, AccessURL, DRSModel
from fastapi import APIRouter, Depends, HTTPException, Request

from ..const import EXPORTS_URL_BASE
from ..dependencies import get_bbagent
from ..helpers import serve_file

router = APIRouter(prefix="/v1/objects", tags=["objects"])


# ---------------------------------------------------------------------------
# DRS objects for published bulk-metadata exports (the ``bed_snapshots`` table).
#
# Object-id scheme: an export's DRS object-id is its bare filename, i.e. the
# basename of the ``bed_snapshots.file_path`` S3 key
# (e.g. ``bedbase_metadata_2026_08_03.parquet``). The id round-trips: given the
# id, the matching row is the newest ``bed_snapshots`` row whose ``file_path``
# basename equals the id.
#
# These routes are declared BEFORE the generic ``/{object_id}`` route below so
# that ``/v1/objects/exports`` is matched by the static route rather than being
# swallowed by ``/{object_id}`` (which would try to parse ``exports`` as a
# ``<record_type>.<record_id>.<result_id>`` BED/bedset id).
# ---------------------------------------------------------------------------


@router.get(
    "/exports",
    summary="List published bulk-metadata exports as DRS objects (newest first)",
    response_model=list[DRSModel],
)
def list_export_drs_objects(
    req: Request,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> list[DRSModel]:
    """
    Enumerate every published bulk-metadata export artifact as a GA4GH DRS
    object, newest first.

    The DRS object-id of an export is its bare filename (the basename of the
    ``bed_snapshots.file_path`` S3 key), e.g.
    ``bedbase_metadata_2026_08_03.parquet``. Resolve a single object at
    ``GET /v1/objects/exports/{object_id}``.

    Declared ``def`` (not ``async def``) so the blocking database query runs in a
    threadpool instead of stalling the event loop.
    """
    base_uri = urlparse(str(req.url)).netloc
    result = bbagent.snapshot.list(limit=None)
    return [_export_drs_object(bbagent, row, base_uri) for row in result.results]


@router.get(
    "/exports/{object_id}",
    summary="Get DRS object metadata for a bulk-metadata export",
    response_model=DRSModel,
)
def get_export_drs_object_metadata(
    object_id: str,
    req: Request,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> DRSModel:
    """
    Return GA4GH DRS metadata for a single published bulk-metadata export.

    ``object_id`` is the export's bare filename (the basename of the
    ``bed_snapshots.file_path`` S3 key), e.g.
    ``bedbase_metadata_2026_08_03.parquet``. The id round-trips: the resolved
    ``bed_snapshots`` row is the newest whose ``file_path`` basename equals
    ``object_id``.

    Declared ``def`` (not ``async def``) so the blocking database query runs in a
    threadpool instead of stalling the event loop.
    """
    base_uri = urlparse(str(req.url)).netloc
    try:
        row = bbagent.snapshot.get_by_filename(object_id)
    except SnapshotNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Export DRS object {object_id} not found",
        )
    return _export_drs_object(bbagent, row, base_uri)


# ---------------------------------------------------------------------------
# DRS objects for standalone analysis files (the ``analysis_files`` table).
# Same object-id scheme as exports: the DRS object-id is the bare filename
# (basename of ``analysis_files.file_path``), resolved to the newest matching
# row. Declared BEFORE the generic ``/{object_id}`` route below.
# ---------------------------------------------------------------------------


@router.get(
    "/files",
    summary="List standalone analysis files as DRS objects (newest first)",
    response_model=list[DRSModel],
)
def list_analysis_file_drs_objects(
    req: Request,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> list[DRSModel]:
    """
    Enumerate every standalone analysis file as a GA4GH DRS object, newest
    first.

    The DRS object-id of an analysis file is its bare filename (the basename of
    the ``analysis_files.file_path`` S3 key). Resolve a single object at
    ``GET /v1/objects/files/{object_id}``.

    Declared ``def`` (not ``async def``) so the blocking database query runs in a
    threadpool instead of stalling the event loop.
    """
    base_uri = urlparse(str(req.url)).netloc
    result = bbagent.analysis_files.list(limit=None)
    return [_analysis_file_drs_object(bbagent, row, base_uri) for row in result.results]


@router.get(
    "/files/{object_id}",
    summary="Get DRS object metadata for a standalone analysis file",
    response_model=DRSModel,
)
def get_analysis_file_drs_object_metadata(
    object_id: str,
    req: Request,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> DRSModel:
    """
    Return GA4GH DRS metadata for a single standalone analysis file.

    ``object_id`` is the file's bare filename (the basename of the
    ``analysis_files.file_path`` S3 key). The id round-trips: the resolved
    ``analysis_files`` row is the newest whose ``file_path`` basename equals
    ``object_id``.

    Declared ``def`` (not ``async def``) so the blocking database query runs in a
    threadpool instead of stalling the event loop.
    """
    base_uri = urlparse(str(req.url)).netloc
    try:
        row = bbagent.analysis_files.get_by_filename(object_id)
    except AnalysisFileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis file DRS object {object_id} not found",
        )
    return _analysis_file_drs_object(bbagent, row, base_uri)


@router.get(
    "/{object_id}",
    summary="Get DRS object metadata",
    response_model=DRSModel,
)
async def get_drs_object_metadata(
    object_id: str,
    req: Request,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> DRSModel:
    """
    Returns metadata about a DrsObject.
    """
    ids = parse_bedbase_drs_object_id(object_id)
    base_uri = urlparse(str(req.url)).netloc
    return bbagent.objects.get_drs_metadata(
        ids["record_type"], ids["record_id"], ids["result_id"], base_uri
    )


@router.get(
    "/{object_id}/access/{access_id}",
    summary="Get URL where you can retrieve files",
    response_model=str,
)
async def get_object_bytes_url(
    object_id: str,
    access_id: str,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> str:
    """
    Returns a URL that can be used to fetch the bytes of a DrsObject.
    """
    ids = parse_bedbase_drs_object_id(object_id)
    return bbagent.objects.get_object_uri(
        ids["record_type"], ids["record_id"], ids["result_id"], access_id
    )


@router.head(
    "/{object_id}/access/{access_id}/bytes", include_in_schema=False
)  # Required by UCSC track hubs
@router.get(
    "/{object_id}/access/{access_id}/bytes",
    summary="Download actual file",
    response_model=bytes,
)
async def get_object_bytes(
    object_id: str,
    access_id: str,
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """
    Returns the bytes of a DrsObject.
    """
    ids = parse_bedbase_drs_object_id(object_id)
    return serve_file(
        bbagent.objects.get_object_uri(
            ids["record_type"], ids["record_id"], ids["result_id"], access_id
        )
    )


@router.get(
    "/{object_id}/access/{access_id}/thumbnail",
    summary="Download thumbnail file",
    response_model=bytes,
)
async def get_object_thumbnail(
    object_id: str,
    access_id: str,
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """
    Returns the bytes of a thumbnail of a DrsObject
    """
    ids = parse_bedbase_drs_object_id(object_id)
    return serve_file(
        bbagent.objects.get_thumbnail_uri(
            ids["record_type"], ids["record_id"], ids["result_id"], access_id
        )
    )


# DRS-compatible API.
# Requires using `object_id` which has the form: `<record_type>.<record_id>.<object_class>`
# for example: `bed.326d5d77c7decf067bd4c7b42340c9a8.bedfile`
# or: `bed.421d2128e183424fcc6a74269bae7934.bedfile`
# bed.326d5d77c7decf067bd4c7b42340c9a8.bedfile
# bed.326d5d77c7decf067bd4c7b42340c9a8.bigbed
def parse_bedbase_drs_object_id(object_id: str) -> dict[str, str]:
    """
    Parse bedbase object id into its components
    """
    try:
        record_type, record_id, result_id = object_id.split(".")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Object ID {object_id} is malformed. Should be of the form <record_type>.<record_id>.<result_id>",
        )
    if record_type not in ["bed", "bedset"]:
        raise HTTPException(
            status_code=400, detail=f"Object type {record_type} is incorrect"
        )
    return {
        "record_type": record_type,
        "record_id": record_id,
        "result_id": result_id,
    }


def _export_drs_object(
    bbagent: BedBaseAgent, row: BedSnapshotResult, base_uri: str
) -> DRSModel:
    """
    Build a GA4GH DRS object for a single ``bed_snapshots`` export row.

    Unlike BED-file DRS objects (served through the API's /v1/files/ redirect
    proxy), export artifacts live directly on the storage CDN, so the access URL
    is built from ``EXPORTS_URL_BASE`` (https://data2.bedbase.org/) rather than
    the config's http access-method prefix.
    """
    object_id = os.path.basename(row.file_path)
    access_methods = [
        AccessMethod(
            type="https",
            access_id="https",
            access_url=AccessURL(url=os.path.join(EXPORTS_URL_BASE, row.file_path)),
        )
    ]
    return DRSModel(
        id=object_id,
        name=object_id,
        self_uri=f"drs://{base_uri}/{object_id}",
        size=row.file_size,
        created_time=row.creation_date,
        updated_time=row.creation_date,
        # NOTE: the shared DRSModel types ``checksums`` as a plain ``str`` (the
        # BED-file DRS objects put the object-id here). We populate the real
        # sha256 hex digest from ``bed_snapshots.checksum`` when present, falling
        # back to the object-id, so exports validate against the same model.
        checksums=row.checksum or object_id,
        access_methods=access_methods,
        description=f"BEDbase bulk metadata export ({row.file_type})",
    )


def _analysis_file_drs_object(
    bbagent: BedBaseAgent, row: AnalysisFileResult, base_uri: str
) -> DRSModel:
    """
    Build a GA4GH DRS object for a single ``analysis_files`` row.

    Like export artifacts (and unlike BED-file DRS objects), analysis files live
    directly on the storage CDN, so the access URL is built from
    ``EXPORTS_URL_BASE`` (https://data2.bedbase.org/) rather than the config's
    http access-method prefix.
    """
    object_id = os.path.basename(row.file_path)
    access_methods = [
        AccessMethod(
            type="https",
            access_id="https",
            access_url=AccessURL(url=os.path.join(EXPORTS_URL_BASE, row.file_path)),
        )
    ]
    description = row.description or f"BEDbase analysis file ({row.name})"
    return DRSModel(
        id=object_id,
        name=object_id,
        self_uri=f"drs://{base_uri}/{object_id}",
        size=row.file_size,
        created_time=row.creation_date,
        updated_time=row.creation_date,
        # See the note in _export_drs_object: DRSModel types ``checksums`` as a
        # plain str, so we put the real sha256 here, falling back to the id.
        checksums=row.checksum or object_id,
        access_methods=access_methods,
        description=description,
    )
