import subprocess
import os

try:
    from typing import Annotated, Dict, Optional, List
except:
    from typing_extensions import Annotated
    from typing import Dict, Optional, List

import tempfile

from fastapi import APIRouter, HTTPException, Path, Query, Response, Request
from fastapi.responses import PlainTextResponse
from pipestat.exceptions import RecordNotFoundError
from urllib.parse import urlparse

from .. import _LOGGER
from ..main import bbc
from ..const import (
    CFG_PATH_PIPELINE_OUTPUT_KEY,
    CFG_REMOTE_KEY,
    CFG_PATH_KEY,
    FIG_FORMAT,
)
from ..data_models import (
    DBResponse,
    RemoteClassEnum,
    BedDigest,
    chromosome_number,
)


router = APIRouter(prefix="/bed", tags=["bed"])


@router.get("/genomes")
async def get_bed_genome_assemblies():
    """
    Returns available genome assemblies in the database
    """
    return bbc.bed.retrieve_distinct(columns=["genome"])


@router.get("/count", response_model=int)
async def get_bedfile_count():
    """
    Returns the number of bedfiles available in the database
    """
    return int(bbc.bed.record_count)


@router.get("/schema", response_model=Dict)
async def get_bed_schema():
    """
    Get bedfiles pipestat schema
    """
    d = bbc.bed.schema.original_schema
    return d


@router.get("/example")
async def get_bed_example():
    return bbc.bed.select_records(limit=1)["records"][0]


@router.get("/list", summary="List all bedfiles, paged.")
async def list_beds(limit: int = 1000, token: str = None):
    """
    To get the first page, leave token field empty. The response will include a
    'next_page_token' field, which can be used to get the next page.
    """
    x = bbc.bed.select_records(columns=["name"], limit=limit, cursor=token)
    return x


@router.get("/{record_id}/{result_id}/{access_id}")
async def get_bed_object_uri(record_id: str, result_id: str, access_id: str):
    try:
        record_type = "bed"
        path = bbc.get_object_uri(record_type, record_id, result_id, access_id)
        return Response(path, media_type="text/plain")
    except RecordNotFoundError as e:
        raise HTTPException(status_code=404, detail="Record not found")


@router.get("/{bed_id}/metadata", response_model=DBResponse)
async def get_bed_metadata(
    bed_id: str = BedDigest,
    attr_id: Optional[str] = Query(
        None, description="Column name to select from the table"
    ),
):
    """
    Returns metadata from selected columns for selected bedfile
    """
    # TODO: should accept a list of columns
    try:
        values = bbc.bed.retrieve(bed_id, attr_id)
        if not isinstance(values, dict) or attr_id:
            values = {
                attr_id: values,
                "record_identifier": bed_id,
            }
        if "id" in values:
            del values["id"]
        colnames = list(values.keys())
        _LOGGER.info(f"Serving metadata for columns: {colnames}")
    except RecordNotFoundError:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]
    return {"columns": colnames, "data": values}


# UCSC tool expects a head respond. So we added head request
@router.head("/{bed_id}/file/{file_id}", include_in_schema=False)
@router.get("/{bed_id}/file/{file_id}", include_in_schema=False)
async def get_bytes_of_bedfile(
    bed_id: str,
    file_id: str,
):
    res = bbc.bed_retrieve(bed_id, file_id)
    path = bbc.get_prefixed_uri(res["path"])
    return bbc.serve_file(path)


@router.get("/{bed_id}/file_path/{file_id}", include_in_schema=False)
async def get_uri_for_bedfile(
    bed_id: str,
    file_id: str,
    remote_class: RemoteClassEnum = Query(
        RemoteClassEnum("http"), description="Remote data provider class"
    ),
):
    try:
        res = bbc.bed.retrieve(bed_id, file_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Record or attribute not found")

    path = bbc.get_prefixed_uri(res["path"], remote_class.value)
    return Response(path, media_type="text/plain")


@router.get("/{bed_id}/img/{image_id}", include_in_schema=False)
async def get_image_for_bedfile(
    bed_id: str,
    image_id: str,
    format: FIG_FORMAT = Query("pdf", description="Figure file format"),
):
    """
    Returns the specified image associated with the specified bed file.
    """
    img = bbc.bed_retrieve(bed_id, image_id)
    identifier = img["path" if format == "pdf" else "thumbnail_path"]
    path = bbc.get_prefixed_uri(identifier)
    return bbc.serve_file(path)


@router.get("/{bed_id}/img_path/{image_id}", include_in_schema=False)
async def get_image_path_for_bedfile(
    bed_id: str,
    image_id: str,
    format: Annotated[
        Optional[FIG_FORMAT], Query(description="Figure file format")
    ] = "pdf",
    remote_class: Annotated[
        Optional[RemoteClassEnum], Query(description="Remote data provider class")
    ] = RemoteClassEnum("http"),
):
    """
    Returns the bedfile plot with provided ID in provided format
    """
    img = bbc.bed_retrieve(bed_id, image_id)
    identifier = img["path" if format == "pdf" else "thumbnail_path"]
    path = bbc.get_prefixed_uri(identifier, remote_class.value)
    return Response(path, media_type="text/plain")


@router.get("/{bed_id}/regions/{chr_num}", response_class=PlainTextResponse)
def get_regions_for_bedfile(
    bed_id: str = BedDigest,
    chr_num: str = chromosome_number,
    start: Annotated[
        Optional[str], Query(description="query range: start coordinate")
    ] = None,
    end: Annotated[
        Optional[str], Query(description="query range: start coordinate")
    ] = None,
):
    """
    Returns the queried regions with provided ID and optional query parameters
    """
    hit = bbc.bed.retrieve(record_identifier=bed_id, result_identifier="bigbedfile")
    if isinstance(hit, dict):
        file = hit.get("bigbedfile")
    else:
        raise HTTPException(
            status_code=404, detail="ERROR: bigBed file doesn't exists. Can't query."
        )
    remote = True if CFG_REMOTE_KEY in bbc.config else False

    path = (
        os.path.join(bbc.config[CFG_REMOTE_KEY]["http"]["prefix"], file["path"])
        if remote
        else os.path.join(
            bbc.config[CFG_PATH_KEY][CFG_PATH_PIPELINE_OUTPUT_KEY], file["path"]
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
    "/search_by_genome_coordinates/regions/{chr_num}/{start}/{end}",
    response_model=DBResponse,
    include_in_schema=True,
)
async def get_regions_for_bedfile(
    start: Annotated[int, Path(description="start coordinate", example=1103243)],
    end: Annotated[int, Path(description="end coordinate", example=2103332)],
    chr_num: str = chromosome_number,
):
    """
    Returns the list of BED files have regions overlapping given genome coordinates
    """
    with tempfile.NamedTemporaryFile(mode="w+") as f:
        f.write(f"{chr_num}\t{start}\t{end}\n")

        bed_files = await get_all_bed_metadata(
            ids=["name", "record_identifier", "bedfile"]
        )

        colnames = ["name", "record_identifier", "overlapped_regions"]
        values = []
        for bed in bed_files["data"]:
            name = bed[0]
            bed_id = bed[1]
            remote = True if CFG_REMOTE_KEY in bbc.config else False
            path = (
                os.path.join(
                    bbc.config[CFG_REMOTE_KEY]["http"]["prefix"], bed[2]["path"]
                )
                if remote
                else os.path.join(
                    bbc.config[CFG_PATH_KEY][CFG_PATH_PIPELINE_OUTPUT_KEY],
                    bed[2]["path"],
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
                        [name, bed_id, int(ct_process.communicate()[0].rstrip("\n"))]
                    )

            except FileNotFoundError:
                _LOGGER.warning("bedIntersect is not installed.")
                raise HTTPException(
                    status_code=500, detail="ERROR: bedIntersect is not installed."
                )
    return {"columns": colnames, "data": values}


# should it be deleted, or disabled for public use?
@router.get("/all/metadata")
async def get_all_bed_metadata(
    ids: Annotated[
        Optional[List[str]], Query(description="Bedfiles table column name")
    ] = None,
    limit: Annotated[
        Optional[int], Query(description="number of rows returned by the query")
    ] = 10,
):
    """
    Get bedfiles metadata for selected columns
    """
    if ids and "record_identifier" not in ids:
        ids.append("record_identifier")
    try:
        # TODO: remove backend dependency
        res = bbc.bed.backend.select(columns=ids, limit=limit)
    except AttributeError:
        raise HTTPException(
            status_code=404, detail=f"Table results for {ids} not found"
        )

    if res:
        if ids:
            colnames = ids
            values = [list(x) if isinstance(x, tuple) else list(x) for x in res]
        else:
            colnames = list(res[0].__dict__.keys())[1:]
            values = [list(x.__dict__.values())[1:] for x in res]
    else:
        _LOGGER.warning(f"No records matched the query")
        return {"columns": [], "data": [[]]}

    _LOGGER.debug(f"Serving data for columns: {colnames}")
    return {"columns": colnames, "data": values}
