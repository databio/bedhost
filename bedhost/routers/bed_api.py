import subprocess

try:
    from typing import Annotated, Dict, Optional
except ImportError:
    from typing_extensions import Annotated
    from typing import Dict, Optional


from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse
from pipestat.exceptions import RecordNotFoundError

from .. import _LOGGER
from ..main import bbc
from ..data_models import (
    BedDigest,
    chromosome_number,
)


router = APIRouter(prefix="/bed", tags=["bed"])


@router.get("/genomes")
async def get_bed_genome_assemblies():
    """
    Returns available genome assemblies in the database
    """
    return bbc.bed.select_distinct(columns=["genome"])


@router.get(
    "/count", summary="Number of BED records in the database", response_model=int
)
async def count_bed_record():
    """
    Returns the number of bed records available in the database
    """
    return int(bbc.bed.record_count)


@router.get("/schema", summary="Schema for BED records", response_model=Dict)
async def get_bed_schema():
    """
    Get pipestat schema for BED records used by this database
    """
    d = bbc.bed.schema.resolved_schema
    return d


@router.get(
    "/example", summary="Get metadata for an example BED record", response_model=Dict
)
async def get_example_bed_record():
    return bbc.bed.select_records(limit=1)["records"][0]


@router.get("/list", summary="Paged list of all BED records")
async def list_beds(limit: int = 1000, token: int = None):
    """
    To get the first page, leave token field empty. The response will include a
    'next_page_token' field, which can be used to get the next page.
    """
    return bbc.bed.select_records(columns=["name"], limit=limit, cursor=token)


@router.get("/{bed_id}/metadata", summary="Get metadata for a single BED record")
async def get_bed_metadata(
    bed_id: str = BedDigest,
    attr_id: Optional[str] = Query(
        None, description="Column name to select from the table"
    ),
):
    """
    Returns metadata from selected columns for selected BED record
    """
    # TODO: should accept a list of columns
    try:
        values = bbc.bed.retrieve_one(bed_id, attr_id)
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
        values = [[]]
    return values


@router.get(
    "/{bed_id}/regions/{chr_num}",
    summary="Get regions from a BED file that overlap a query region.",
    response_class=PlainTextResponse,
)
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
    res = bbc.bed.retrieve_one(bed_id, "bigbedfile")
    if isinstance(res, dict):
        res.get("bigbedfile")
    else:
        raise HTTPException(
            status_code=404, detail="ERROR: bigBed file doesn't exists. Can't query."
        )
    path = bbc.get_prefixed_uri(res["path"], access_id="http")
    _LOGGER.debug(path)
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
