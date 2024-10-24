from fastapi import APIRouter, HTTPException, Request, Response
import logging

from bbconf.models.bedset_models import (
    BedSetMetadata,
    BedSetListResult,
    BedSetBedFiles,
    BedSetPlots,
    BedSetStats,
)
from bbconf.exceptions import BedSetNotFoundError

from ..main import bbagent
from ..const import PKG_NAME, EXAMPLE_BEDSET
from ..utils import zip_pep


router = APIRouter(prefix="/v1/bedset", tags=["bedset"])

_LOGGER = logging.getLogger(PKG_NAME)


@router.get(
    "/example",
    summary="Get metadata for an example BEDset record",
    response_model=BedSetMetadata,
    response_model_by_alias=False,
)
async def get_example_bedset_record():
    result = bbagent.bedset.get_ids_list(limit=1).results
    if result:
        return bbagent.bedset.get(result[0].id, full=True)
    raise HTTPException(status_code=404, detail="No records found")


@router.get(
    "/list",
    summary="Paged list of all BEDset records",
    tags=["search"],
    response_model=BedSetListResult,
)
async def list_bedsets(query: str = None, limit: int = 1000, offset: int = 0):
    """
    Returns a list of BEDset records in the database with optional filters and search.
    """
    return bbagent.bedset.get_ids_list(query=query, limit=limit, offset=offset)


@router.get(
    "/{bedset_id}/metadata",
    response_model=BedSetMetadata,
    summary="Get all metadata for a single BEDset record",
    description=f"Example\n bed_id: {EXAMPLE_BEDSET}",
    response_model_by_alias=False,
)
async def get_bedset_metadata(
    bedset_id: str,
    full: bool = True,
):
    # TODO: fix error with not found
    try:
        return bbagent.bedset.get(bedset_id, full=full)
    except BedSetNotFoundError as _:
        raise HTTPException(status_code=404, detail="No records found")


@router.get(
    "/{bedset_id}/pep",
    summary="Download PEP project for a single BEDset record",
    description=f"Example\n bed_id: {EXAMPLE_BEDSET}",
)
async def get_bedset_pep(
    bedset_id: str,
):
    try:
        return zip_pep(bbagent.bedset.get_bedset_pep(bedset_id))
    except BedSetNotFoundError as _:
        raise HTTPException(status_code=404, detail="No records found")


@router.get(
    "/{bedset_id}/metadata/plots",
    response_model=BedSetPlots,
    summary="Get plots for single bedset record",
    description=f"Example\n bed_id: {EXAMPLE_BEDSET}",
)
async def get_bedset_metadata(
    bedset_id: str,
):
    """
    Returns metadata from selected columns for selected bedset
    """
    try:
        return bbagent.bedset.get_plots(bedset_id)
    except BedSetNotFoundError as _:
        raise HTTPException(status_code=404, detail="No records found")


@router.get(
    "/{bedset_id}/metadata/stats",
    response_model=BedSetStats,
    summary="Get stats for a single BEDSET record",
    description=f"Example\n bed_id: {EXAMPLE_BEDSET}",
)
async def get_bedset_metadata(
    bedset_id: str,
):
    try:
        return bbagent.bedset.get_statistics(bedset_id)
    except BedSetNotFoundError as _:
        raise HTTPException(status_code=404, detail="No records found")


@router.get(
    "/{bedset_id}/bedfiles",
    response_model=BedSetBedFiles,
    description=f"Example\n bed_id: {EXAMPLE_BEDSET}",
    response_model_by_alias=False,
)
async def get_bedfiles_in_bedset(
    bedset_id: str,
):
    return bbagent.bedset.get_bedset_bedfiles(bedset_id)


@router.head("/{bedset_id}/track_hub")
@router.get("/{bedset_id}/track_hub")
async def get_track_hub_bedset(request: Request, bedset_id: str):
    """
    Generate track hub files for the BED set
    """

    bbagent.bedset.get(bedset_id)

    hub_txt = (
        f"hub \t BEDBASE_{bedset_id}\n"
        f"shortLabel \t BEDBASE_{bedset_id}\n"
        f"longLabel\t BEDBASE {bedset_id} signal tracks\n"
        f"genomesFile\t {str(request.url_for('get_genomes_file_bedset', bedset_id=bedset_id)).replace('http', 'https', 1)}\n"
        "email\t bx2ur@virginia.edu\n"
        "descriptionUrl\t https://bedbase.org/"
    )

    return Response(hub_txt, media_type="text/plain")


@router.head("/{bedset_id}/track_hub_genome_file", include_in_schema=False)
@router.get("/{bedset_id}/track_hub_genome_file", include_in_schema=False)
async def get_genomes_file_bedset(request: Request, bedset_id: str):
    """
    Generate genomes file for the BED set track hub
    """

    genome = "hg38"
    genome_txt = (
        f"genome\t {genome}\n"
        f"trackDb\t	{str(request.url_for('get_trackDb_file_bedset', bedset_id=bedset_id)).replace('http', 'https', 1)}"
    )

    return Response(genome_txt, media_type="text/plain")


@router.head("/{bedset_id}/track_hub_trackDb_file", include_in_schema=False)
@router.get("/{bedset_id}/track_hub_trackDb_file", include_in_schema=False)
async def get_trackDb_file_bedset(bedset_id: str):
    """
    Generate trackDb file for the BED set track hub
    """

    hit = bbagent.bedset.get_bedset_bedfiles(bedset_id)

    trackDb_txt = ""
    for bed in hit.results:
        metadata = bbagent.bed.get(bed.id, full=True)

        if metadata.files.bigbed_file:

            trackDb_txt = (
                trackDb_txt + f"track\t {metadata.name}\n"
                "type\t bigBed\n"
                f"bigDataUrl\t {metadata.files.bigbed_file.access_methods[0].access_url.url} \n"
                f"shortLabel\t {metadata.name}\n"
                f"longLabel\t {metadata.description}\n"
                "visibility\t full\n\n"
            )

    return Response(trackDb_txt, media_type="text/plain")
