from fastapi import HTTPException, APIRouter, Path, Query
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
    return int(bbc.count_bedfiles())


@router.get("/bed/all/data", response_model=DBResponse)
async def get_all_bed_metadata(
        ids: Optional[List[str]] = Query(
            None,
            description="Bedfiles table column name"
        )
):
    """
    Get bedfiles data for selected columns
    """
    return serve_columns_for_table(bbc=bbc, table_name=BED_TABLE, columns=ids)


@router.get("/bed/{md5sum}/data", response_model=DBResponse)
async def get_bedfile_data(
        md5sum: str = Path(
            ...,
            description="digest"),
        ids: Optional[List[str]] = Query(
            None,
            description="Column name to select from the table")
):
    """
    Returns data from selected columns for selected bedfile
    """
    return serve_columns_for_table(
        bbc=bbc,
        table_name=BED_TABLE,
        columns=ids,
        digest=md5sum
    )


@router.get("/bed/{md5sum}/file/{id}")
async def get_file_for_bedfile(
        md5sum: str = Path(
            ...,
            description="digest"),
        id: FileColumnBed = Path(
            ...,
            description="File identifier")
):
    files = bbc.select(table_name=BED_TABLE,
                       condition=f"{JSON_MD5SUM_KEY}='{md5sum}'",
                       columns=file_map_bed[id.value])[0][0]
    remote = True if bbc[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(bbc.get_bedstat_output_path(remote), files)
    return serve_file(path, remote)


@router.get("/bed/{md5sum}/img/{id}")
async def get_image_for_bedfile(
        md5sum: str = Path(
            ...,
            description="digest"),
        id: str = Path(
            ...,
            description="Figure identifier"),
        format: FigFormat = Query(
            "pdf",
            description="Figure file format")
):
    """
    Returns the bedfile plot with provided ID in provided format
    """
    imgs = bbc.select(table_name=BED_TABLE,
                      condition=f"{JSON_MD5SUM_KEY} = '{md5sum}'",
                      columns=["name", "plots"])
    remote = True if bbc[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(bbc.get_bedstat_output_path(remote),
                        md5sum, f"{imgs[0][0]}_{id}.{format}")
    return serve_file(path, remote)


# bedset endpoints

@router.get("/bedset/all/data/count", response_model=int)
async def get_bedset_count():
    """
    Returns the number of bedsets available in the database
    """
    return int(bbc.count_bedsets())


@router.get("/bedset/all/data", response_model=DBResponse)
async def get_all_bedset_metadata(
        ids: Optional[List[str]] = Query(
            None,
            description="Bedsets table column name")
):
    """
    Get bedsets data for selected columns
    """

    return serve_columns_for_table(bbc=bbc, table_name=BEDSET_TABLE,
                                    columns=ids)


@router.get("/bedset/{md5sum}/bedfiles", response_model=DBResponse)
async def get_bedfiles_in_bedset(
        md5sum: str = Path(
            ...,
            description="digest"),
        ids: Optional[List[str]] = Query(
            None,
            description="Bedfiles table column name")
):
    avail_cols = [c[0] for c in bbc.get_bedfiles_table_columns_types()]
    if ids and ids not in avail_cols:
        msg = f"Column '{ids}' not found in '{BED_TABLE}' table"
        _LOGGER.warning(msg)
        raise HTTPException(status_code=404, detail=msg)
    res = bbc.select_bedfiles_for_bedset(query=f"md5sum='{md5sum}'", bedfile_col=ids)
    colnames = list(res[0].keys())
    values = list(res.values())
    _LOGGER.info(f"Serving data for columns: {colnames}")
    return {"columns": colnames, "data": values}


@router.get("/bedset/{md5sum}/data", response_model=DBResponse)
async def get_bedset_data(
        md5sum: str = Path(
            ...,
            description="digest"),
        ids: Optional[List[str]] = Query(
            None,
            description="Column name to select from the table")
):
    """
    Returns data from selected columns for selected bedset
    """
    return serve_columns_for_table(bbc=bbc, table_name=BEDSET_TABLE,
        columns=ids, digest=md5sum)


@router.get("/bedset/{md5sum}/file/{id}")
async def get_file_for_bedset(
        md5sum: str = Path(
            ...,
            description="digest"),
        id: FileColumnBedset = Path(
            ...,
            description="File identifier")
):
    files = bbc.select(table_name=BEDSET_TABLE,
                       condition=f"{JSON_MD5SUM_KEY}='{md5sum}'",
                       columns=file_map_bedset[id.value])[0][0]
    _LOGGER.debug(f"files: {files}")
    remote = True if bbc[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(bbc.get_bedbuncher_output_path(remote), files)
    return serve_file(path, remote)


@router.get("/bedset/{md5sum}/img/{id}")
async def get_image_for_bedset(
        md5sum: str = Path(
            ...,
            description="digest"),
        id: str = Path(
            ...,
            description="Figure identifier"),
        format: FigFormat = Query(
            "pdf",
            description="Figure file format")
):
    """
    Returns the img with provided ID
    """
    imgs = bbc.select(table_name=BEDSET_TABLE,
                      condition=f"{JSON_MD5SUM_KEY} = '{md5sum}'",
                      columns=["name", "plots"])
    remote = True if bbc[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(bbc.get_bedbuncher_output_path(remote), md5sum,
                        f"{imgs[0][0]}_{id}.{format}")
    return serve_file(path, remote)
