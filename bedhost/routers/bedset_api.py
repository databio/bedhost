from typing import Optional, List, Dict
from fastapi import APIRouter, Query, Request, Response

from ..data_models import BedsetResponse
from ..main import bbc

router = APIRouter(prefix="/bedset", tags=["bedset"])


@router.get("/genomes")
async def get_bedset_genome_assemblies():
    """
    Returns available genome assemblies in the database
    """

    return bbc.bedset.select_distinct(columns=["genome"])


@router.get("/count", response_model=int)
async def get_bedset_count():
    """
    Returns the number of bedsets available in the database
    """
    return int(bbc.bedset.record_count)


@router.get("/schema", response_model=Dict)
async def get_bedset_schema():
    """
    Get bedsets pipestat schema
    """
    return bbc.bedset.schema.resolved_schema


@router.get(
    "/example", summary="Get metadata for an example BEDset record", response_model=Dict
)
async def get_example_bedset_record():
    return bbc.bedset.select_records(limit=1)["records"][0]


@router.get("/list", summary="Paged list of all BEDset records")
async def list_bedsets(limit: int = 1000, token: int = None):
    """
    Returns a paged list of all BEDset records
    """
    return bbc.bed.select_records(columns=["name"], limit=limit, cursor=token)


@router.get("/{bedset_id}/metadata", response_model=Dict)
async def get_bedset_metadata(
    bedset_id: str,
    ids: Optional[List[str]] = Query(
        None, description="Column name to select from the table"
    ),
):
    """
    Returns metadata from selected columns for selected bedset
    """
    return bbc.bedset.retrieve_one(bedset_id, ids)


@router.get("/{bedset_id}/bedfiles", response_model=BedsetResponse)
async def get_bedfiles_in_bedset(
    bedset_id: str,
    metadata: Optional[bool] = Query(
        False, description="Whether to add metadata to response"
    ),
):
    result = bbc.select_bedfiles_from_bedset(bedset_id, metadata=metadata)
    return BedsetResponse(
        bedset_record_id=bedset_id,
        number_of_bedfiles=len(result),
        bedfile_metadata=result,
    )


@router.get("/{bedset_id}/track_hub")
async def get_track_hub_bedset(request: Request, bedset_id: str):
    """
    Generate track hub files for the BED set
    """

    hit = bbc.bedset.retrieve_one(bedset_id)
    name = hit.get("name", "")

    hub_txt = (
        f"hub \t BEDBASE_{name}\n"
        f"shortLabel \t BEDBASE_{name}\n"
        f"longLabel\t BEDBASE {name} signal tracks\n"
        f"genomesFile\t {request.url_for('get_genomes_file_bedset', bedset_id=bedset_id)}\n"
        "email\t bx2ur@virginia.edu\n"
        "descriptionUrl\t http://www.bedbase.org/"
    )

    return Response(hub_txt, media_type="text/plain")


@router.get("/{bedset_id}/track_hub_genome_file", include_in_schema=False)
async def get_genomes_file_bedset(request: Request, bedset_id: str):
    """
    Generate genomes file for the BED set track hub
    """

    genome = bbc.bedset.retrieve_one(bedset_id, "genome")

    genome_txt = (
        f"genome\t {genome['alias']}\n"
        f"trackDb\t	{request.url_for('get_trackDb_file_bedset', bedset_id=bedset_id)}"
    )

    return Response(genome_txt, media_type="text/plain")


@router.get("/{md5sum}/track_hub_trackDb_file", include_in_schema=False)
async def get_trackDb_file_bedset(request: Request, bedset_id: str):
    """
    Generate trackDb file for the BED set track hub
    """

    hit = bbc.select_bedfiles_for_bedset(
        bedset_id,
        metadata=True,
    )

    trackDb_txt = ""
    for bed in hit:
        trackDb_txt = (
            trackDb_txt + f"track\t {bed.get('name', '')}\n"
            "type\t bigBed\n"
            f"bigDataUrl\t http://data.bedbase.org/bigbed_files/{bed.get('name', '')}.bigBed\n"
            f"shortLabel\t {bed.get('name', '')}\n"
            f"longLabel\t {bed.get('description', '')}\n"
            "visibility\t full\n\n"
        )

    return Response(trackDb_txt, media_type="text/plain")
