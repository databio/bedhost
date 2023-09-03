from email.header import Header
import enum
from fileinput import filename
import shlex
import subprocess
import io
from xmlrpc.client import TRANSPORT_ERROR
import requests
from typing import Optional
from bbconf.const import BED_TABLE

from fastapi import APIRouter, HTTPException, Path, Query, Response, Request
from fastapi.responses import PlainTextResponse, StreamingResponse
from sqlalchemy import false

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

# This is using Python's Functional API to create enumerations without the typical
# class syntax. This is useful for creating enumerations dynamically, which is
# what we're doing here. We're creating a new enumeration for each table in the
# database, and then creating a new enumeration for each column in each table.
# This is done by calling the `get_enum_map` function, which returns a dictionary
# of column names and values. The `enum.Enum` function then creates a new
# enumeration class with the given name and values.


FileColumnBedset = enum.Enum(
    value="FileColumnBedset",  # name of the enumeration
    names=get_enum_map(bbc, BEDSET_TABLE, "file")  # dictionary of names and values
)

FileColumnBed = enum.Enum("FileColumnBed", get_enum_map(bbc, BED_TABLE, "file"))

ImgColumnBedset = enum.Enum("ImgColumnBedset", get_enum_map(bbc, BEDSET_TABLE, "image"))

ImgColumnBed = enum.Enum("ImgColumnBed", get_enum_map(bbc, BED_TABLE, "image"))

file_map_bedset = get_id_map(bbc, BEDSET_TABLE, "file")

file_map_bed = get_id_map(bbc, BED_TABLE, "file")

img_map_bedset = get_id_map(bbc, BEDSET_TABLE, "image")

img_map_bed = get_id_map(bbc, BED_TABLE, "image")

# ex_bed_digest = serve_columns_for_table(
#     bbc=bbc, table_name=BED_TABLE, columns=["md5sum"], limit=1
# ).get("data")[0][0]

# ex_bedset_digest = serve_columns_for_table(
#     bbc=bbc, table_name=BEDSET_TABLE, columns=["md5sum"], limit=1
# ).get("data")[0][0]

ex_chr = "chr1"

# API query path definitions
bd = Path(
    ...,
    description="BED digest",
    regex=r"^\w+$",
    max_length=32,
    min_length=32,
    # example=ex_bed_digest,
)

bsd = Path(
    ...,
    description="BED set digest",
    regex=r"^\w+$",
    max_length=32,
    min_length=32,
    # example=ex_bedset_digest,
)

c = Path(
    ...,
    description="Chromosome number",
    regex=r"^\S+$",
    example=ex_chr,
)


class BEDLIST(BaseModel):
    md5sums: list


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

    return bbc.bed.backend.select_distinct(table_name=BED_TABLE, columns=["genome"])


@router.get("/bed/count", response_model=int)
async def get_bedfile_count():
    """
    Returns the number of bedfiles available in the database
    """
    return int(bbc.bed.record_count)


@router.get("/bed/all/metadata")
async def get_all_bed_metadata(
    ids: Optional[List[str]] = Query(None, description="Bedfiles table column name"),
    limit: int = Query(None, description="number of rows returned by the query"),
):
    """
    Get bedfiles metadata for selected columns
    """
    if ids:
        assert_table_columns_match(bbc=bbc, table_name=BED_TABLE, columns=ids)

    res = bbc.bed.backend.select(columns=ids, limit=limit)

    if res:
        if ids:
            colnames = ids
            values = [list(x) for x in res]
        else:
            colnames = list(res[0].__dict__.keys())[1:]
            values = [list(x.__dict__.values())[1:] for x in res]

        _LOGGER.info(f"Serving data for columns: {colnames}")
    else:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]

    return {"columns": colnames, "data": values}


@router.get("/bed/schema", response_model=Dict[str, SchemaElement])
async def get_bed_schema():
    """
    Get bedfiles pipestat schema
    """
    return serve_schema_for_table(bbc=bbc, table_name=BED_TABLE)


@router.get("/bed/{md5sum}/metadata", response_model=DBResponse)
async def get_bedfile_metadata(
    md5sum: str = bd,
    ids: Optional[List[str]] = Query(
        None, description="Column name to select from the table"
    ),
):
    """
    Returns metadata from selected columns for selected bedfile
    """

    res = bbc.bed.select(columns=ids, filter_conditions=[("md5sum", "eq", md5sum)])

    if res:
        if ids:
            colnames = ids
            values = [list(x) for x in res]
        else:
            colnames = list(res[0].__dict__.keys())[1:]
            values = [list(x.__dict__.values())[1:] for x in res]

        _LOGGER.info(f"Serving metadata for columns: {colnames}")
    else:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]

    return {"columns": colnames, "data": values}


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
    remote = True if CFG_REMOTE_KEY in bbc.config else False

    path = (
        os.path.join(bbc.config[CFG_REMOTE_KEY]["http"]["prefix"], file["path"])
        if remote
        else os.path.join(
            bbc.config[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY], file["path"]
        )
    )

    return serve_file(path, remote)


@router.get("/bed/{md5sum}/file_path/{id}")
async def get_file_path_for_bedfile(
    md5sum: str = bd,
    id: FileColumnBed = Path(..., description="File identifier"),
    remoteClass: RemoteClassEnum = Query(
        "http", description="Remote data provider class"
    ),
):

    hit = bbc.bed.select(
        filter_conditions=[("md5sum", "eq", md5sum)],
        columns=[file_map_bed[id.value]],
    )[0]

    file = getattr(hit, file_map_bed[id.value])
    remote = True if CFG_REMOTE_KEY in bbc.config else False
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
    remote = True if CFG_REMOTE_KEY in bbc.config else False

    path = (
        os.path.join(
            bbc.config[CFG_REMOTE_KEY]["http"]["prefix"],
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
async def get_image_path_for_bedfile(
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

    hit = bbc.bed.select(
        filter_conditions=[("md5sum", "eq", md5sum)],
        columns=["name", img_map_bed[id.value]],
    )[0]
    img = getattr(hit, img_map_bed[id.value])
    remote = True if CFG_REMOTE_KEY in bbc.config else False

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
    remote = True if CFG_REMOTE_KEY in bbc.config else False

    path = (
        os.path.join(bbc.config[CFG_REMOTE_KEY]["http"]["prefix"], file["path"])
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


@router.get(
    "/bed/search_by_genome_coordinates/regions/{chr_num}/{start}/{end}",
    response_model=DBResponse,
    include_in_schema=False,
)
async def get_regions_for_bedfile(
    chr_num: str = c,
    start: int = Path(..., description="start coordinate", example=1103243),
    end: int = Path(..., description="end coordinate", example=2103332),
):
    """
    Returns the list of BED files have regions overlapped with given genome coordinates

    """
    import tempfile

    f = tempfile.NamedTemporaryFile(mode="w+")

    f.write(f"{chr_num}\t{start}\t{end}\n")
    f.read()

    bed_files = await get_all_bed_metadata(ids=["name", "md5sum", "bedfile"])

    colnames = ["name", "md5sum", "overlapped_regions"]
    values = []

    for bed in bed_files["data"]:
        name = bed[0]
        md5sum = bed[1]
        remote = True if CFG_REMOTE_KEY in bbc.config else False
        path = (
            os.path.join(bbc.config[CFG_REMOTE_KEY]["http"]["prefix"], bed[2]["path"])
            if remote
            else os.path.join(
                bbc.config[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY], bed[2]["path"]
            )
        )

        cmd = [
            "bedIntersect",
            f.name,
            path,
            "stdout",
        ]

        _LOGGER.info(f"Command: {' '.join(map(str, cmd))} | wc -l")

        try:
            ct_process = subprocess.Popen(
                ["wc", "-l"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                universal_newlines=True,
            )

            subprocess.Popen(
                cmd,
                stdout=ct_process.stdin,
                text=True,
            )
            if int(ct_process.communicate()[0].rstrip("\n")) != 0:
                values.append(
                    [name, md5sum, int(ct_process.communicate()[0].rstrip("\n"))]
                )

        except FileNotFoundError:
            _LOGGER.warning("bedIntersect is not installed.")
            raise HTTPException(
                status_code=500, detail="ERROR: bigBedToBed is not installed."
            )
    f.close()
    return {"columns": colnames, "data": values}


# bedset endpoints
@router.get("/bedset/genomes")
async def get_bedset_genome_assemblies():
    """
    Returns available genome assemblies in the database
    """

    return bbc.bedset.select_distinct(table_name=BEDSET_TABLE, columns=["genome"])


@router.get("/bedset/count", response_model=int)
async def get_bedset_count():
    """
    Returns the number of bedsets available in the database
    """
    return int(bbc.bedset.record_count)


@router.get("/bedset/all/metadata")
async def get_all_bedset_metadata(
    ids: Optional[List[str]] = Query(None, description="Bedsets table column name"),
    limit: int = Query(None, description="number of rows returned by the query"),
):
    """
    Get bedsets metadata for selected columns
    """
    if ids:
        assert_table_columns_match(bbc=bbc, table_name=BEDSET_TABLE, columns=ids)

    res = bbc.bedset.select(columns=ids, limit=limit)

    if res:
        if ids:
            colnames = ids
            values = [list(x) for x in res]
        else:
            colnames = list(res[0].__dict__.keys())[1:]
            values = [list(x.__dict__.values())[1:] for x in res]

        _LOGGER.info(f"Serving metadata for columns: {colnames}")
    else:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]

    return {"columns": colnames, "data": values}


@router.get("/bedset/schema", response_model=Dict[str, SchemaElement])
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
        bedfile_cols=ids, filter_conditions=[("md5sum", "eq", md5sum)]
    )

    if res:
        if ids:
            colnames = ids
            values = [list(x) for x in res]
        else:
            colnames = list(
                serve_schema_for_table(bbc=bbc, table_name=BED_TABLE).keys()
            )
            values = [list(x) for x in res]

        _LOGGER.info(f"Serving data for columns: {colnames}")
    else:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]

    return {"columns": colnames, "data": values}


@router.get("/bedset/{md5sum}/metadata", response_model=DBResponse)
async def get_bedset_metadata(
    md5sum: str = bsd,
    ids: Optional[List[str]] = Query(
        None, description="Column name to select from the table"
    ),
):
    """
    Returns metadata from selected columns for selected bedset
    """
    res = bbc.bedset.select(columns=ids, filter_conditions=[("md5sum", "eq", md5sum)])

    if res:
        if ids:
            colnames = ids
            values = [list(x) for x in res]
        else:
            colnames = list(res[0].__dict__.keys())[1:]
            values = [list(x.__dict__.values())[1:] for x in res]

        _LOGGER.info(f"Serving metadata for columns: {colnames}")
    else:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]

    return {"columns": colnames, "data": values}


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
    remote = True if CFG_REMOTE_KEY in bbc.config else False

    path = (
        os.path.join(bbc.config[CFG_REMOTE_KEY]["http"]["prefix"], file["path"])
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

    hit = bbc.bedset.select(
        filter_conditions=[("md5sum", "eq", md5sum)],
        columns=[file_map_bedset[id.value]],
    )[0]
    file = getattr(hit, file_map_bedset[id.value])
    remote = True if CFG_REMOTE_KEY in bbc.config else False
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
    remoteClass: RemoteClassEnum = Query(
        "http", description="Remote data provider class"
    ),
):
    """
    Returns the img with provided ID
    """
    hit = bbc.bedset.select(
        filter_conditions=[("md5sum", "eq", md5sum)],
        columns=["name", img_map_bedset[id.value]],
    )[0]
    img = getattr(hit, img_map_bedset[id.value])

    remote = True if CFG_REMOTE_KEY in bbc.config else False

    path = (
        os.path.join(
            bbc.config[CFG_REMOTE_KEY]["http"]["prefix"],
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
async def get_image_path_for_bedset(
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

    hit = bbc.bedset.select(
        filter_conditions=[("md5sum", "eq", md5sum)],
        columns=["name", img_map_bedset[id.value]],
    )[0]
    img = getattr(hit, img_map_bedset[id.value])

    remote = True if CFG_REMOTE_KEY in bbc.config else False

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


@router.get("/bedset/{md5sum}/track_hub")
async def get_track_hub_bedset(request: Request, md5sum: str = bsd):
    """
    Generate track hub files for the BED set
    """

    hit = bbc.bedset.select(filter_conditions=[("md5sum", "eq", md5sum)])[0]
    name = getattr(hit, "name")

    hub_txt = (
        f"hub \t BEDBASE_{name}\n"
        f"shortLabel \t BEDBASE_{name}\n"
        f"longLabel\t BEDBASE {name} signal tracks\n"
        f"genomesFile\t {request.url_for('get_genomes_file_bedset', md5sum=md5sum)}\n"
        "email\t bx2ur@virginia.edu\n"
        "descriptionUrl\t http://www.bedbase.org/"
    )

    return Response(hub_txt, media_type="text/plain")


@router.get("/bedset/{md5sum}/track_hub_genome_file", include_in_schema=False)
async def get_genomes_file_bedset(request: Request, md5sum: str = bsd):
    """
    Generate genomes file for the BED set track hub
    """

    hit = bbc.bedset.select(filter_conditions=[("md5sum", "eq", md5sum)])[0]
    genome = getattr(hit, "genome")

    genome_txt = (
        f"genome\t {genome['alias']}\n"
        f"trackDb\t	{request.url_for('get_trackDb_file_bedset', md5sum=md5sum)}"
    )

    return Response(genome_txt, media_type="text/plain")


@router.get("/bedset/{md5sum}/track_hub_trackDb_file", include_in_schema=False)
async def get_trackDb_file_bedset(request: Request, md5sum: str = bsd):
    """
    Generate trackDb file for the BED set track hub
    """

    hit = bbc.select_bedfiles_for_bedset(
        bedfile_cols=["name", "other"], filter_conditions=[("md5sum", "eq", md5sum)]
    )

    values = [list(x) for x in hit]

    trackDb_txt = ""
    for bed in values:
        trackDb_txt = (
            trackDb_txt + f"track\t {bed[0]}\n"
            "type\t bigBed\n"
            f"bigDataUrl\t http://data.bedbase.org/bigbed_files/{bed[0]}.bigBed\n"
            f"shortLabel\t {bed[0]}\n"
            f"longLabel\t {bed[1]['description']}\n"
            "visibility\t full\n\n"
        )

    return Response(trackDb_txt, media_type="text/plain")


@router.post("/bedset/create/{name}/{bedfiles}", include_in_schema=False)
async def create_new_bedset(
    name: str = Path(..., description="BED set name"),
    bedfiles: str = Path(..., description="BED file ID list (comma sep string)"),
):
    """
    add new BED set to database,
    submit job to calculate status for the BED set
    """
    from hashlib import md5

    bfs = list(bedfiles.split(","))

    bfs_m = []
    for bf in bfs:
        sr = bbc.bed.select(
            columns=["md5sum"],
            filter_conditions=[("id", "eq", bf)],
        )[0]

        bfs_m.append(getattr(sr, "md5sum"))

    m = md5()
    m.update(";".join(sorted([f for f in bfs_m])).encode("utf-8"))

    bedset_summary_info = {
        "name": name,
        "md5sum": m.hexdigest(),
        "processed": False,
    }

    # select only first element of every list due to JSON produced by R putting
    # every value into a list
    data = {
        k.lower(): v[0] if (isinstance(v, list)) else v
        for k, v in bedset_summary_info.items()
    }

    bedset_id = bbc.bedset.report(
        record_identifier=m.hexdigest(), values=data, return_id=True
    )

    for hit_id in bfs:
        bbc.report_relationship(bedset_id=bedset_id, bedfile_id=hit_id)

    return Response(m.hexdigest(), media_type="text/plain")


@router.post("/bedset/my_bedset/file_paths", include_in_schema=True)
async def get_mybedset_file_path(
    md5sums: BEDLIST,
    remoteClass: RemoteClassEnum = Query(
        "http", description="Remote data provider class"
    ),
):
    """
    return list of file path for user defined bed
    """

    # idxs = list(bedfiles.split(","))

    paths = ""
    for bed in md5sums.md5sums:
        print(bed)
        hit = bbc.bed.select(
            filter_conditions=[("md5sum", "eq", bed)],
            columns=[file_map_bed["bed"]],
        )[0]
        file = getattr(hit, file_map_bed["bed"])
        remote = True if CFG_REMOTE_KEY in bbc.config else False

        path = (
            os.path.join(
                bbc.config[CFG_REMOTE_KEY][remoteClass.value]["prefix"], file["path"]
            )
            if remote
            else os.path.join(
                bbc.config[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY], file["path"]
            )
        )
        paths = paths + path + "\n"

        filename = "my_bedset_" + remoteClass.value + ".txt"
        stream = io.StringIO(paths)

        response = StreamingResponse(
            stream,
            media_type="text/csv",
        )
        response.headers["Content-Disposition"] = f"attachment; filename={filename}"

    return response
