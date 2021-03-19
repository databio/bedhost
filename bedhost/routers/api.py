from fastapi import HTTPException, APIRouter, Path, Query
import subprocess
import shlex
from fastapi.responses import PlainTextResponse, StreamingResponse
from typing import Optional
from ..main import bbc, _LOGGER, app
from ..const import *
from ..data_models import *
from ..helpers import *


router = APIRouter()


# misc endpoints
@router.get("/versions", response_model=Dict[str, str])
async def get_version_info():
    """
    Returns app version information
    """
    versions = ALL_VERSIONS
    versions.update({"openapi_version": get_openapi_version(app)})
    return versions


# bed endpoints
@router.get("/bed/all/data/count", response_model=int)
async def get_bedfile_count():
    """
    Returns the number of bedfiles available in the database
    """
    return int(bbc.bed.record_count)


@router.get("/bed/all/data", response_model=DBResponse)
async def get_all_bed_metadata(
    ids: Optional[List[str]] = Query(None, description="Bedfiles table column name"),
    limit: int = Query(None, description="number of rows returned by the query"),
):
    """
    Get bedfiles data for selected columns
    """
    return serve_columns_for_table(
        bbc=bbc, table_name=BED_TABLE, columns=ids, limit=limit
    )


@router.get("/bed/all/schema", response_model=Dict[str, SchemaElement])
async def get_bed_schema():
    """
    Get bedfiles pipestat schema
    """
    return serve_schema_for_table(bbc=bbc, table_name=BED_TABLE)


@router.get("/bed/{md5sum}/data", response_model=DBResponse)
async def get_bedfile_data(
    md5sum: str = Path(..., description="digest"),
    ids: Optional[List[str]] = Query(
        None, description="Column name to select from the table"
    ),
):
    """
    Returns data from selected columns for selected bedfile
    """
    return serve_columns_for_table(
        bbc=bbc, table_name=BED_TABLE, columns=ids, digest=md5sum
    )


@router.head("/bed/{md5sum}/file/{id}", include_in_schema=False)
@router.get("/bed/{md5sum}/file/{id}")
async def get_file_for_bedfile(
    md5sum: str = Path(..., description="digest"),
    id: FileColumnBed = Path(..., description="File identifier"),
):
    file = bbc.bed.select(
        condition="md5sum=%s",
        condition_val=[md5sum],
        columns=["name", file_map_bed[id.value]],
    )[0][1]
    remote = True if bbc.config[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(bbc.config[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY], file["path"])
    return serve_file(path, remote)


@router.get("/bed/{md5sum}/img/{id}")
async def get_image_for_bedfile(
    md5sum: str = Path(..., description="digest"),
    id: str = Path(..., description="Figure identifier"),
    format: FigFormat = Query("pdf", description="Figure file format"),
):
    """
    Returns the bedfile plot with provided ID in provided format
    """
    img = bbc.bed.select(
        condition="md5sum=%s", condition_val=[md5sum], columns=["name", id]
    )[0][1]
    remote = True if bbc.config[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(
        bbc.config[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY],
        img["path" if format == "pdf" else "thumbnail_path"],
    )
    return serve_file(path, remote)


@router.get("/bed/{md5sum}/regions/{chr_num}", response_class=PlainTextResponse)
def get_regions_for_bedfile(
    md5sum: str = Path(..., description="digest"),
    chr_num: str = Path(..., description="chromsome number"),
    start: Optional[str] = Query(None, description="query range: start coordinate"),
    end: Optional[str] = Query(None, description="query range: end coordinate"),
):
    """
    Returns the queried regions with provided ID and optional query parameters

    """
    file = bbc.bed.select(
        condition="md5sum=%s",
        condition_val=[md5sum],
        columns=["name", "bigbedfile"],
    )[0][1]

    path = os.path.join(bbc.config[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY], file["path"])

    cmd = ["bigBedToBed"]
    if chr_num:
        cmd.append(f"-chrom={chr_num}")
    if start:
        cmd.append(f"-start={start}")
    if end:
        cmd.append(f"-end={end}")
    cmd.extend([path, "stdout"])

    _LOGGER.info(f"Command: {' '.join(map(str, cmd))} | cut -f1-3")
    try:
        cut_process = subprocess.Popen(
            ["cut", "-f1-3"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            universal_newlines=True,
        )

        subprocess.Popen(
            cmd,
            stdout=cut_process.stdin,
            text=True,
        )

        return cut_process.communicate()[0]

    except FileNotFoundError:
        _LOGGER.warning("bigBedToBed is not installed.")
        raise HTTPException(
            status_code=500, detail="ERROR: bigBedToBed is not installed."
        )


# bedset endpoints


@router.get("/bedset/all/data/count", response_model=int)
async def get_bedset_count():
    """
    Returns the number of bedsets available in the database
    """
    return int(bbc.bedset.record_count)


@router.get("/bedset/all/data", response_model=DBResponse)
async def get_all_bedset_metadata(
    ids: Optional[List[str]] = Query(None, description="Bedsets table column name"),
    limit: int = Query(None, description="number of rows returned by the query"),
):
    """
    Get bedsets data for selected columns
    """

    return serve_columns_for_table(
        bbc=bbc, table_name=BEDSET_TABLE, columns=ids, limit=limit
    )


@router.get("/bedset/all/schema", response_model=Dict[str, SchemaElement])
async def get_bedset_schema():
    """
    Get bedsets pipestat schema
    """
    return serve_schema_for_table(bbc=bbc, table_name=BEDSET_TABLE)


@router.get("/bedset/{md5sum}/bedfiles", response_model=DBResponse)
async def get_bedfiles_in_bedset(
    md5sum: str = Path(..., description="digest"),
    ids: Optional[List[str]] = Query(None, description="Bedfiles table column name"),
):
    if ids:
        assert_table_columns_match(bbc=bbc, table_name=BED_TABLE, columns=ids)
    res = bbc.select_bedfiles_for_bedset(
        condition="md5sum=%s", condition_val=[md5sum], bedfile_col=ids
    )
    if res:
        colnames = list(res[0].keys())
        values = [list(x.values()) for x in res]
        _LOGGER.info(f"Serving data for columns: {colnames}")
    else:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]
    return {"columns": colnames, "data": values}


@router.get("/bedset/{md5sum}/data", response_model=DBResponse)
async def get_bedset_data(
    md5sum: str = Path(..., description="digest"),
    ids: Optional[List[str]] = Query(
        None, description="Column name to select from the table"
    ),
):
    """
    Returns data from selected columns for selected bedset
    """
    return serve_columns_for_table(
        bbc=bbc, table_name=BEDSET_TABLE, columns=ids, digest=md5sum
    )


@router.head("/bedset/{md5sum}/file/{id}", include_in_schema=False)
@router.get("/bedset/{md5sum}/file/{id}")
async def get_file_for_bedset(
    md5sum: str = Path(..., description="digest"),
    id: FileColumnBedset = Path(..., description="File identifier"),
):
    file = bbc.bedset.select(
        condition="md5sum=%s",
        condition_val=[md5sum],
        columns=["name", file_map_bedset[id.value]],
    )[0][1]
    remote = True if bbc.config[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(bbc.config[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY], file["path"])
    return serve_file(path, remote)


@router.get("/bedset/{md5sum}/img/{id}")
async def get_image_for_bedset(
    md5sum: str = Path(..., description="digest"),
    id: str = Path(..., description="Figure identifier"),
    format: FigFormat = Query("pdf", description="Figure file format"),
):
    """
    Returns the img with provided ID
    """
    img = bbc.bedset.select(
        condition="md5sum=%s", condition_val=[md5sum], columns=["name", id]
    )[0][1]
    remote = True if bbc.config[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(
        bbc.config[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY],
        img["path" if format == "pdf" else "thumbnail_path"],
    )
    return serve_file(path, remote)
