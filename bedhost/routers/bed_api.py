"""
/bed endpoints
"""

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

@router.get("/bed/genomes")
async def get_bed_genome_assemblies():
    """
    Returns available genome assemblies in the database
    """
    return bbc.bed.select_distinct(table_name=BED_TABLE, columns=["genome"])


@router.get("/bed/count", response_model=int)
async def get_bedfile_count():
    """
    Returns the number of bedfiles available in the database
    """
    return int(bbc.bed.record_count)


@router.get("/bed/schema", response_model=Dict)
async def get_bed_schema():
    """
    Get bedfiles pipestat schema
    """
    # TODO: Fix the ParsedSchema representation so it can be represented as a dict
    return bbc.bed.schema.__dict__

from pipestat.exceptions import PipestatError

@router.get("/bed/{md5sum}/metadata", response_model=DBResponse)
async def get_bedfile_metadata(
    md5sum: str = BedDigest,
    attr_ids: Optional[List[str]] = Query(
        None, description="Column name to select from the table"
    ),
):
    """
    Returns metadata from selected columns for selected bedfile
    """

    try:
        values = bbc.bed.retrieve(md5sum, attr_ids)
        colnames = attr_ids or list(values.keys())
        _LOGGER.info(f"Serving metadata for columns: {colnames}")
    except PipestatError:  # Should be RecordNotFoundError
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]
    return {"columns": colnames, "data": values}


@router.head("/bed/{md5sum}/file/{file_id}", include_in_schema=False)
@router.get("/bed/{md5sum}/file/{file_id}")
async def get_file_for_bedfile(
    md5sum: str,
    file_id: str,
):
    res = bbc.bed_retrieve(md5sum, file_id)
    path = bbc.get_prefixed_uri(res["path"])
    return bbc.serve_file(path)


@router.get("/bed/{md5sum}/file_path/{file_id}")
async def get_file_path_for_bedfile(
    md5sum: str,
    file_id: str,
    remoteClass: RemoteClassEnum = Query(
        RemoteClassEnum("http"), description="Remote data provider class"
    ),
):
    res = bbc.bed_retrieve(md5sum, file_id)
    path = bbc.get_prefixed_uri(res["path"], remoteClass.value)
    return Response(path, media_type="text/plain")


@router.get("/bed/{md5sum}/img/{image_id}")
async def get_image_for_bedfile(
    md5sum: str,
    image_id: str,
    format: FigFormat = Query("pdf", description="Figure file format"),
):
    """
    Returns the specified image associated with the specified bed file.
    """
    img = bbc.bed_retrieve(md5sum, image_id)
    identifier = img["path" if format == "pdf" else "thumbnail_path"]
    path = bbc.get_prefixed_uri(identifier)
    return bbc.serve_file(path)


@router.get("/bed/{md5sum}/img_path/{image_id}")
async def get_image_path_for_bedfile(
    md5sum: str,
    image_id: str,
    format: FigFormat = Query("pdf", description="Figure file format"),
    remoteClass: RemoteClassEnum = Query(
        RemoteClassEnum("http"), description="Remote data provider class"
    ),
):
    """
    Returns the bedfile plot with provided ID in provided format
    """
    img = bbc.bed_retrieve(md5sum, image_id)
    identifier = img["path" if format == "pdf" else "thumbnail_path"]
    path = bbc.get_prefixed_uri(identifier, remoteClass.value)
    return Response(path, media_type="text/plain")


@router.get("/bed/{md5sum}/regions/{chr_num}", response_class=PlainTextResponse)
def get_regions_for_bedfile(
    md5sum: str = BedDigest,
    chr_num: str = chromosome_number,
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
    chr_num: str = chromosome_number,
    start: int = Path(..., description="start coordinate", example=1103243),
    end: int = Path(..., description="end coordinate", example=2103332),
):
    """
    Returns the list of BED files have regions overlapping given genome coordinates

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
                status_code=500, detail="ERROR: bedIntersect is not installed."
            )
    f.close()
    return {"columns": colnames, "data": values}


# TODO: Probably remove this... it's not realistic to return all the metadata
# BUT it's being used by get_regions_for_bedfile, so maybe convert to function?
# @router.get("/bed/all/metadata")
# async def get_all_bed_metadata(
#     ids: Optional[List[str]] = Query(None, description="Bedfiles table column name"),
#     limit: int = Query(None, description="number of rows returned by the query"),
# ):
#     """
#     Get bedfiles metadata for selected columns
#     """
#     if ids:
#         assert_table_columns_match(bbc=bbc, table_name=BED_TABLE, columns=ids)

#     res = bbc.bed.select(columns=ids, limit=limit)

#     if res:
#         if ids:
#             colnames = ids
#             values = [list(x) for x in res]
#         else:
#             colnames = list(res[0].__dict__.keys())[1:]
#             values = [list(x.__dict__.values())[1:] for x in res]

#         _LOGGER.info(f"Serving data for columns: {colnames}")
#     else:
#         _LOGGER.warning("No records matched the query")
#         colnames = []
#         values = [[]]

#     return {"columns": colnames, "data": values}

