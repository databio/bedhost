import enum
import shlex
import subprocess
from typing import Optional

from fastapi import APIRouter, HTTPException, Path, Query, Response
from fastapi.responses import PlainTextResponse, StreamingResponse

from ..const import *
from ..data_models import *
from ..helpers import *
from ..main import _LOGGER, app, bbc


router = APIRouter()

RemoteClassEnum = Enum(
    "RemoteClassEnum",
    {r: r for r in bbc.config[CFG_REMOTE_KEY]}
    if is_data_remote(bbc)
    else {"http": "http"},
)

FileColumnBedset = enum.Enum(
    "FileColumnBedset", get_enum_map(bbc, BEDSET_TABLE, "file")
)

FileColumnBed = enum.Enum("FileColumnBed", get_enum_map(bbc, BED_TABLE, "file"))

ImgColumnBedset = enum.Enum("ImgColumnBedset", get_enum_map(bbc, BEDSET_TABLE, "image"))

ImgColumnBed = enum.Enum("ImgColumnBed", get_enum_map(bbc, BED_TABLE, "image"))

file_map_bedset = get_id_map(bbc, BEDSET_TABLE, "file")

file_map_bed = get_id_map(bbc, BED_TABLE, "file")

img_map_bedset = get_id_map(bbc, BEDSET_TABLE, "image")

img_map_bed = get_id_map(bbc, BED_TABLE, "image")


ex_bed_digest = serve_columns_for_table(
    bbc=bbc, table_name=BED_TABLE, columns=["md5sum"], limit=1
).get("data")[0][0]

ex_bedset_digest = serve_columns_for_table(
    bbc=bbc, table_name=BEDSET_TABLE, columns=["md5sum"], limit=1
).get("data")[0][0]

ex_chr = "chr1"

# API query path definitions
bd = Path(
    ...,
    description="BED digest",
    regex=r"^\w+$",
    max_length=32,
    min_length=32,
    example=ex_bed_digest,
)

bsd = Path(
    ...,
    description="BED set digest",
    regex=r"^\w+$",
    max_length=32,
    min_length=32,
    example=ex_bedset_digest,
)

c = Path(
    ...,
    description="Chromosome number",
    regex=r"^\S+$",
    example=ex_chr,
)

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
@router.get("/bed/genomes")
async def get_bed_genome_assemblies():
    """
    Returns available genome assemblies in the database
    """

    return bbc.select_unique(table_name=BED_TABLE, column="genome")


@router.get("/bed/all/data/count", response_model=int)
async def get_bedfile_count():
    """
    Returns the number of bedfiles available in the database
    """
    return int(bbc.bed.record_count)


@router.get("/bed/all/data")
async def get_all_bed_metadata(
    ids: Optional[List[str]] = Query(None, description="Bedfiles table column name"),
    limit: int = Query(None, description="number of rows returned by the query"),
):
    """
    Get bedfiles data for selected columns
    """

    res = bbc.bed.select(columns=ids, limit=limit)

    if res:
        if ids:
            colnames = ids
            values = [list(x) for x in res]
        else:
            colnames = list(res[0].__dict__.keys())[1:-1]
            values = [list(x.__dict__.values())[1:-1] for x in res]

        _LOGGER.info(f"Serving data for columns: {colnames}")
    else:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]

    return {"columns": colnames, "data": values}


@router.get("/bed/all/schema", response_model=Dict[str, SchemaElement])
async def get_bed_schema():
    """
    Get bedfiles pipestat schema
    """
    return serve_schema_for_table(bbc=bbc, table_name=BED_TABLE)


@router.get("/bed/{md5sum}/data", response_model=DBResponse)
async def get_bedfile_data(
    md5sum: str = bd,
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
    md5sum: str = bd,
    id: FileColumnBed = Path(..., description="File identifier"),
):
    hit = bbc.bed.select(
        filter_conditions=[("md5sum", "eq", md5sum)],
        columns=[file_map_bed[id.value]],
    )[0]
    file = getattr(hit, file_map_bed[id.value])
    remote = True if bbc.config[CFG_REMOTE_KEY]['http']['prefix'] else False
    path = (
        os.path.join(bbc.config[CFG_REMOTE_KEY]['http']['prefix'], file["path"])
        if remote
        else os.path.join(
            bbc.config[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY], file["path"]
        )
    )
    return serve_file(path, remote)


@router.get("/bed/{md5sum}/file_path/{id}")
async def get_file_for_bedfile(
    md5sum: str = bd,
    id: FileColumnBed = Path(..., description="File identifier"),
    remoteClass: RemoteClassEnum = Query(
        "http", description="Remote data provider class"
    ),
):
    file = bbc.bed.select(
        condition="md5sum=%s",
        condition_val=[md5sum],
        columns=["name", file_map_bed[id.value]],
    )[0][1]
    remote = is_data_remote(bbc)

    path = (
        os.path.join(
            bbc.config[CFG_REMOTE_KEY][remoteClass.value]["prefix"], file["path"]
        )
        if remote
        else os.path.join(
            bbc.config[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY], file["path"]
        )
    )

    return Response(path, media_type="text/plain")


@router.get("/bed/{md5sum}/img/{id}")
async def get_image_for_bedfile(
    md5sum: str = bd,
    id: ImgColumnBed = Path(..., description="Figure identifier"),
    format: FigFormat = Query("pdf", description="Figure file format"),
):
    """
    Returns the bedfile plot with provided ID in provided format
    """
    hit = bbc.bed.select(
        filter_conditions=[("md5sum", "eq", md5sum)],
        columns=["name", img_map_bed[id.value]],
    )[0]
    img = getattr(hit, img_map_bed[id.value])
    remote = True if bbc.config[CFG_REMOTE_KEY]['http']['prefix'] else False
    path = (
        os.path.join(
            bbc.config[CFG_REMOTE_KEY]['http']['prefix'],
            img["path" if format == "pdf" else "thumbnail_path"],
        )
        if remote
        else os.path.join(
            bbc.config[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY],
            img["path" if format == "pdf" else "thumbnail_path"],
        )
    )
    return serve_file(path, remote)


@router.get("/bed/{md5sum}/img_path/{id}")
async def get_image_for_bedfile(
    md5sum: str = bd,
    id: ImgColumnBed = Path(..., description="Figure identifier"),
    format: FigFormat = Query("pdf", description="Figure file format"),
    remoteClass: RemoteClassEnum = Query(
        "http", description="Remote data provider class"
    ),
):
    """
    Returns the bedfile plot with provided ID in provided format
    """
    img = bbc.bed.select(
        condition="md5sum=%s",
        condition_val=[md5sum],
        columns=["name", img_map_bed[id.value]],
    )[0][1]

    remote = is_data_remote(bbc)
    path = (
        os.path.join(
            bbc.config[CFG_REMOTE_KEY][remoteClass.value]["prefix"],
            img["path" if format == "pdf" else "thumbnail_path"],
        )
        if remote
        else os.path.join(
            bbc.config[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY],
            img["path" if format == "pdf" else "thumbnail_path"],
        )
    )
    return Response(path, media_type="text/plain")


@router.get("/bed/{md5sum}/regions/{chr_num}", response_class=PlainTextResponse)
def get_regions_for_bedfile(
    md5sum: str = bd,
    chr_num: str = c,
    start: Optional[str] = Query(None, description="query range: start coordinate"),
    end: Optional[str] = Query(None, description="query range: end coordinate"),
):
    """
    Returns the queried regions with provided ID and optional query parameters

    """
    hit = bbc.bed.select(
        filter_conditions=[("md5sum", "eq", md5sum)],
        columns=["bigbedfile"],
    )[0]
    file = getattr(hit, "bigbedfile")
    remote = True if bbc.config[CFG_REMOTE_KEY]['http']['prefix'] else False
    path = (
        os.path.join(bbc.config[CFG_REMOTE_KEY]['http']['prefix'], file["path"])
        if remote
        else os.path.join(
            bbc.config[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY], file["path"]
        )
    )

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
@router.get("/bedset/genomes")
async def get_bedset_genome_assemblies():
    """
    Returns available genome assemblies in the database
    """

    return bbc.select_unique(table_name=BEDSET_TABLE, column="genome")


@router.get("/bedset/all/data/count", response_model=int)
async def get_bedset_count():
    """
    Returns the number of bedsets available in the database
    """
    return int(bbc.bedset.record_count)


@router.get("/bedset/all/data")
async def get_all_bedset_metadata(
    ids: Optional[List[str]] = Query(None, description="Bedsets table column name"),
    limit: int = Query(None, description="number of rows returned by the query"),
):
    """
    Get bedsets data for selected columns
    """

    res = bbc.bedset.select(columns=ids, limit=limit)

    if res:
        if ids:
            colnames = ids
            values = [list(x) for x in res]
        else:
            colnames = list(res[0].__dict__.keys())[1:-1]
            values = [list(x.__dict__.values())[1:-1] for x in res]

        _LOGGER.info(f"Serving data for columns: {colnames}")
    else:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]

    return {"columns": colnames, "data": values}


@router.get("/bedset/all/schema", response_model=Dict[str, SchemaElement])
async def get_bedset_schema():
    """
    Get bedsets pipestat schema
    """
    return serve_schema_for_table(bbc=bbc, table_name=BEDSET_TABLE)


@router.get("/bedset/{md5sum}/bedfiles", response_model=DBResponse)
async def get_bedfiles_in_bedset(
    md5sum: str = bsd,
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
    md5sum: str = bsd,
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
    md5sum: str = bsd,
    id: FileColumnBedset = Path(..., description="File identifier"),
):
    hit = bbc.bedset.select(
        filter_conditions=[("md5sum", "eq", md5sum)],
        columns=[file_map_bedset[id.value]],
    )[0]
    file = getattr(hit, file_map_bedset[id.value])
    remote = True if bbc.config[CFG_REMOTE_KEY]['http']['prefix'] else False
    path = (
        os.path.join(bbc.config[CFG_REMOTE_KEY]['http']['prefix'], file["path"])
        if remote
        else os.path.join(
            bbc.config[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY], file["path"]
        )
    )
    return serve_file(path, remote)


@router.get("/bedset/{md5sum}/file_path/{id}")
async def get_file_path_for_bedset(
    md5sum: str = bsd,
    id: FileColumnBedset = Path(..., description="File identifier"),
    remoteClass: RemoteClassEnum = Query(
        "http", description="Remote data provider class"
    ),
):
    file = bbc.bedset.select(
        condition="md5sum=%s",
        condition_val=[md5sum],
        columns=["name", file_map_bedset[id.value]],
    )[0][1]
    remote = is_data_remote(bbc)
    path = (
        os.path.join(
            bbc.config[CFG_REMOTE_KEY][remoteClass.value]["prefix"], file["path"]
        )
        if remote
        else os.path.join(
            bbc.config[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY], file["path"]
        )
    )

    return Response(path, media_type="text/plain")


@router.get("/bedset/{md5sum}/img/{id}")
async def get_image_for_bedset(
    md5sum: str = bsd,
    id: ImgColumnBedset = Path(..., description="Figure identifier"),
    format: FigFormat = Query("pdf", description="Figure file format"),
):
    """
    Returns the img with provided ID
    """
    hit = bbc.bedset.select(
        filter_conditions=[("md5sum", "eq", md5sum)],
        columns=["name", img_map_bedset[id.value]],
    )[0]
    img = getattr(hit, img_map_bedset[id.value])

    remote = True if bbc.config[CFG_REMOTE_KEY]['http']['prefix'] else False
    path = (
        os.path.join(
            bbc.config[CFG_REMOTE_KEY]['http']['prefix'],
            img["path" if format == "pdf" else "thumbnail_path"],
        )
        if remote
        else os.path.join(
            bbc.config[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY],
            img["path" if format == "pdf" else "thumbnail_path"],
        )
    )
    return serve_file(path, remote)


@router.get("/bedset/{md5sum}/img_path/{id}")
async def get_image_for_bedset(
    md5sum: str = bsd,
    id: ImgColumnBedset = Path(..., description="Figure identifier"),
    format: FigFormat = Query("pdf", description="Figure file format"),
    remoteClass: RemoteClassEnum = Query(
        "http", description="Remote data provider class"
    ),
):
    """
    Returns the img with provided ID
    """
    img = bbc.bedset.select(
        condition="md5sum=%s",
        condition_val=[md5sum],
        columns=["name", img_map_bedset[id.value]],
    )[0][1]

    remote = is_data_remote(bbc)
    path = (
        os.path.join(
            bbc.config[CFG_REMOTE_KEY][remoteClass.value]["prefix"],
            img["path" if format == "pdf" else "thumbnail_path"],
        )
        if remote
        else os.path.join(
            bbc.config[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY],
            img["path" if format == "pdf" else "thumbnail_path"],
        )
    )

    return Response(path, media_type="text/plain")
