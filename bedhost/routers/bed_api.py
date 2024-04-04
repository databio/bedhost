import subprocess

try:
    from typing import Annotated, Dict, Optional, List, Any
except ImportError:
    from typing_extensions import Annotated
    from typing import Dict, Optional, List, Any

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import PlainTextResponse

from geniml.io import RegionSet

import tempfile
import os
import shutil

from bbconf.models.bed_models import (
    BedListResult,
    BedMetadata,
    BedFiles,
    BedStatsModel,
    BedPlots,
    BedClassification,
    BedPEPHub,
    BedListSearchResult,
)
from bbconf.exceptions import BEDFileNotFoundError

from .. import _LOGGER
from ..main import bbagent
from ..data_models import (
    BedDigest,
    CROM_NUMBERS,
)
from ..const import EXAMPLE_BED


router = APIRouter(prefix="/v1/bed", tags=["bed"])


@router.get(
    "/example",
    summary="Get example BED record metadata",
    response_model=BedMetadata,
)
async def get_example_bed_record():
    """
    Get metadata for an example BED record.
    """
    result = bbagent.bed.get_ids_list(limit=1, offset=0, full=True).results
    if result:
        return result[0]
    raise HTTPException(status_code=404, detail="No records found")


@router.get(
    "/list",
    summary="Paged list of all BED records",
    response_model=BedListResult,
)
async def list_beds(
    limit: int = 1000,
    offset: int = 0,
    genome: str = Query(
        default=None, description="filter by genome of the bed file. e.g. 'hg38'"
    ),
    bed_type: str = Query(
        default=None, description="filter by bed type. e.g. 'bed6+4'"
    ),
) -> BedListResult:
    """
    Returns list of BED files in the database with optional filters.
    """
    return bbagent.bed.get_ids_list(
        limit=limit, offset=offset, genome=genome, bed_type=bed_type
    )


@router.get(
    "/{bed_id}/metadata",
    summary="Get metadata for a single BED record",
    response_model=BedMetadata,
    description=f"Example\n " f"bed_id: {EXAMPLE_BED}",
)
async def get_bed_metadata(
    bed_id: str = BedDigest,
    full: Optional[bool] = Query(
        False, description="Return full record with stats, plots, files and metadata"
    ),
):
    """
    Returns metadata for a single BED record. if full=True, returns full record with stats, plots, files and metadata.
    """
    try:
        return bbagent.bed.get(bed_id, full=full)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
        )


@router.get(
    "/{bed_id}/metadata/plots",
    summary="Get plots for a single BED record",
    response_model=BedPlots,
    description=f"Example\n bed_id: {EXAMPLE_BED}",
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
    description=f"Example\n bed_id: {EXAMPLE_BED}",
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
    summary="Get stats for a single BED record",
    response_model=BedStatsModel,
    description=f"Example\n bed_id: {EXAMPLE_BED}",
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
    summary="Get classification of single BED file",
    response_model=BedClassification,
    description=f"Example\n bed_id: {EXAMPLE_BED}",
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
    summary="Get raw metadata for a single BED record",
    response_model=BedPEPHub,
    description=f"Returns raw metadata for a single BED record. "
    f"This metadata is stored in PEPHub. And is not verified."
    f"Example\n bed_id: {EXAMPLE_BED}",
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


@router.post(
    "/search/text",
    summary="Search for a BedFile",
    tags=["search"],
    response_model=BedListSearchResult,
)
async def text_to_bed_search(query, limit: int = 10, offset: int = 0):
    """
    Search for a BedFile by a text query.
    Example: query="cancer"
    """
    _LOGGER.info(f"Searching for: {query}")
    results = bbagent.bed.text_to_bed_search(query, limit=limit, offset=offset)

    if results:
        return results
    raise HTTPException(status_code=404, detail="No records found")


@router.post(
    "/search/bed",
    summary="Search for similar bed files",
    tags=["search"],
    response_model=BedListSearchResult,
)
async def text_to_bed_search(
    file: UploadFile = File(None), limit: int = 10, offset: int = 0
):
    _LOGGER.info(f"Searching for bedfiles...")

    if file is not None:
        with tempfile.TemporaryDirectory() as dirpath:
            file_path = os.path.join(dirpath, file.filename)

            with open(file_path, "wb") as bed_file:
                shutil.copyfileobj(file.file, bed_file)

            region_set = RegionSet(file_path)

            results = bbagent.bed.bed_to_bed_search(
                region_set, limit=limit, offset=offset
            )
    return results