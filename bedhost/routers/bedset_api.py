from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException, Path, Query, Request, Response
from fastapi.responses import StreamingResponse
import io
import os


from bedhost import _LOGGER
from bedhost.const import (
    CFG_REMOTE_KEY,
    CFG_PATH_KEY,
    CFG_PATH_PIPELINE_OUTPUT_KEY,
    FIG_FORMAT,
)

# from bedhost.helpers import
from bedhost.data_models import DBResponse, RemoteClassEnum, BedsetDigest, BEDLIST
from bedhost.dependencies import get_bbconf

bbc = get_bbconf()

router = APIRouter(prefix="/api/bedset", tags=["bedset"])


# bedset endpoints
@router.get("/genomes")
async def get_bedset_genome_assemblies():
    """
    Returns available genome assemblies in the database
    """

    return bbc.bedset.select_distinct(columns=["genome"])


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
    # if ids:
    #     assert_table_columns_match(bbc=bbc, table_name=BEDSET_TABLE, columns=ids)

    res = bbc.bedset.backend.select(columns=ids, limit=limit)

    if res:
        if ids:
            colnames = ids
            values = [[x] for x in res]
        else:
            colnames = list(res[0].__dict__.keys())[1:]
            values = [list(x.__dict__.values())[1:] for x in res]

        _LOGGER.info(f"Serving metadata for columns: {colnames}")
    else:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]

    return {"columns": colnames, "data": values}


@router.get("/bedset/schema", response_model=Dict)
async def get_bedset_schema():
    """
    Get bedsets pipestat schema
    """

    return bbc.bedset.schema.__dict__


# TODO: FIX it!!!
@router.get("/{md5sum}/bedfiles", response_model=DBResponse)
async def get_bedfiles_in_bedset(
    md5sum: str = BedsetDigest,
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


@router.get("/{md5sum}/metadata", response_model=DBResponse)
async def get_bedset_metadata(
    md5sum: str = BedsetDigest,
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
            values = [[x] for x in res]
        else:
            colnames = list(res[0].__dict__.keys())[1:]
            values = [list(x.__dict__.values())[1:] for x in res]

        _LOGGER.info(f"Serving metadata for columns: {colnames}")
    else:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]

    return {"columns": colnames, "data": values}


@router.get("/{md5sum}/file/{file_id}")
async def get_file_for_bedset(
    md5sum: str,
    file_id: str,
):
    res = bbc.retrieve("bedset", md5sum, file_id)
    path = bbc.get_prefixed_uri(res["path"])
    return bbc.serve_file(path)


@router.get("/bedset/{md5sum}/file_path/{id}")
async def get_file_path_for_bedset(
    md5sum: str,
    id: str,
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
            bbc.config[CFG_PATH_KEY][CFG_PATH_PIPELINE_OUTPUT_KEY], file["path"]
        )
    )

    return Response(path, media_type="text/plain")


@router.get("/{md5sum}/img/{id}")
async def get_image_for_bedset(
    md5sum: str,
    id: str,
    format: FIG_FORMAT = Query("pdf", description="Figure file format"),
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
            bbc.config[CFG_PATH_KEY][CFG_PATH_PIPELINE_OUTPUT_KEY],
            img["path" if format == "pdf" else "thumbnail_path"],
        )
    )

    return bbc.serve_file(path, remote)


@router.get("/{md5sum}/img_path/{image_id}")
async def get_image_path_for_bedset(
    md5sum: str,
    image_id: str,
    format: FIG_FORMAT = Query("pdf", description="Figure file format"),
    remoteClass: RemoteClassEnum = Query(
        "http", description="Remote data provider class"
    ),
):
    """
    Returns the img with provided ID
    """

    hit = bbc.bedset.select(
        filter_conditions=[("md5sum", "eq", md5sum)],
        columns=["name", img_map_bedset[image_id.value]],
    )[0]
    img = getattr(hit, img_map_bedset[image_id.value])

    remote = True if CFG_REMOTE_KEY in bbc.config else False

    path = (
        os.path.join(
            bbc.config[CFG_REMOTE_KEY][remoteClass.value]["prefix"],
            img["path" if format == "pdf" else "thumbnail_path"],
        )
        if remote
        else os.path.join(
            bbc.config[CFG_PATH_KEY][CFG_PATH_PIPELINE_OUTPUT_KEY],
            img["path" if format == "pdf" else "thumbnail_path"],
        )
    )

    return Response(path, media_type="text/plain")


@router.get("/{md5sum}/track_hub")
async def get_track_hub_bedset(request: Request, md5sum: str = BedsetDigest):
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


@router.get("/{md5sum}/track_hub_genome_file", include_in_schema=False)
async def get_genomes_file_bedset(request: Request, md5sum: str = BedsetDigest):
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


@router.get("/{md5sum}/track_hub_trackDb_file", include_in_schema=False)
async def get_trackDb_file_bedset(request: Request, md5sum: str = BedsetDigest):
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


@router.post("/create/{name}/{bedfiles}", include_in_schema=False)
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


@router.post("/my_bedset/file_paths", include_in_schema=True)
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
                bbc.config[CFG_PATH_KEY][CFG_PATH_PIPELINE_OUTPUT_KEY], file["path"]
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


@router.get("/bedset/example")
async def get_bed_example():
    # TODO: This is a hack to get the first record in the table
    # It should be eventually moved away from the .backend into a generic interface
    x = bbc.bedset.backend.get_records()

    return x[0][0]
