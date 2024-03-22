import subprocess

try:
    from typing import Annotated, Dict, Optional, List, Any
except ImportError:
    from typing_extensions import Annotated
    from typing import Dict, Optional, List, Any

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse


from .. import _LOGGER
from ..main import bbagent
from ..data_models import (
    BedDigest,
    CROM_NUMBERS,
)
from bbconf.models.bed_models import (
    BedListResult,
    BedMetadata,
    BedFiles,
    BedStats,
    BedPlots,
    BedClassification,
    BedPEPHub,
    BedListSearchResult,
)
from bbconf.exceptions import BEDFileNotFoundError


router = APIRouter(prefix="/v1/bed", tags=["bed"])


@router.post(
    "/search",
    summary="Search for a BedFile",
    tags=["search"],
    response_model=BedListSearchResult,
)
async def text_to_bed_search(query, limit: int = 10, offset: int = 0):
    _LOGGER.info(f"Searching for: {query}")
    results = bbagent.bed.text_to_bed_search(query, limit=limit, offset=offset)

    if results:
        return results
    raise HTTPException(status_code=404, detail="No records found")


@router.get(
    "/example",
    summary="Get metadata for an example BED record",
    response_model=BedMetadata,
)
async def get_example_bed_record():
    result = bbagent.bed.get_ids_list(limit=1, offset=0, full=True).results
    if result:
        return result[0]
    raise HTTPException(status_code=404, detail="No records found")


@router.get(
    "/list",
    summary="Paged list of all BED records",
    response_model=BedListResult,
)
async def list_beds(limit: int = 1000, offset: int = 0) -> BedListResult:
    """
    To get the first page, leave token field empty. The response will include a
    'next_page_token' field, which can be used to get the next page.
    """
    return bbagent.bed.get_ids_list(limit=limit, offset=offset)


@router.get(
    "/{bed_id}/metadata",
    summary="Get metadata for a single BED record",
    response_model=BedMetadata,
)
async def get_bed_metadata(
    bed_id: str = BedDigest,
    full: Optional[bool] = Query(
        False, description="Return full record with stats, plots, files and metadata"
    ),
):
    """
    Returns metadata from selected columns for selected BED record
    """
    try:
        return bbagent.bed.get(bed_id, full=full)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
        )


@router.get(
    "/{bed_id}/metadata/plots",
    summary="Get metadata for a single BED record",
    response_model=BedPlots,
)
async def get_bed_plots(
    bed_id: str = BedDigest,
):
    try:
        return bbagent.bed.get_plots(bed_id)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
        )


@router.get(
    "/{bed_id}/metadata/files",
    summary="Get metadata for a single BED record",
    response_model=BedFiles,
)
async def get_bed_files(
    bed_id: str = BedDigest,
):
    try:
        return bbagent.bed.get_files(bed_id)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
        )


@router.get(
    "/{bed_id}/metadata/stats",
    summary="Get metadata for a single BED record",
    response_model=BedStats,
)
async def get_bed_stats(
    bed_id: str = BedDigest,
):
    try:
        return bbagent.bed.get_stats(bed_id)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
        )


@router.get(
    "/{bed_id}/metadata/classification",
    summary="Get metadata for a single BED record",
    response_model=BedClassification,
)
async def get_bed_classification(
    bed_id: str = BedDigest,
):
    try:
        return bbagent.bed.get_classification(bed_id)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
        )


@router.get(
    "/{bed_id}/metadata/raw",
    summary="Get metadata for a single BED record",
    response_model=BedPEPHub,
)
async def get_bed_pephub(
    bed_id: str = BedDigest,
):
    try:
        return bbagent.bed.get_raw_metadata(bed_id)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
        )


@router.get(
    "/{bed_id}/regions/{chr_num}",
    summary="Get regions from a BED file that overlap a query region.",
    response_class=PlainTextResponse,
)
def get_regions_for_bedfile(
    bed_id: str = BedDigest,
    chr_num: str = CROM_NUMBERS,
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
    bigbedfile = bbagent.bed.get_files(bed_id).bigbed_file

    if not bigbedfile:
        raise HTTPException(
            status_code=404, detail="ERROR: bigBed file doesn't exists. Can't query."
        )
    path = bbagent.objects.get_prefixed_uri(bigbedfile.path, access_id="http")
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
