import subprocess
from typing import Annotated

from bbconf.bbagent import BedBaseAgent
from bbconf.exceptions import (
    BedBaseConfError,
    BEDFileNotFoundError,
    TokenizeFileNotExistError,
)
from bbconf.models.bed_models import (
    BedClassification,  # BedPEPHub,
    BedEmbeddingResult,
    BedFiles,
    BedListResult,
    BedListSearchResult,
    BedMetadataAll,
    BedPlots,
    BedStatsModel,
    RefGenValidModel,
    RefGenValidReturnModel,
    TokenizedBedResponse,
    TokenizedPathResponse,
)
from bedboss.refgenome_validator.main import ReferenceValidator
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import PlainTextResponse, Response

from .. import _LOGGER
from ..const import (
    BIGBED_TIMEOUT_SECONDS,
    EXAMPLE_BED,
    MAX_BATCH_IDS,
    MAX_LIST_LIMIT,
    MAX_REGIONS_OUTPUT_BYTES,
    MAX_SEARCH_LIMIT,
)
from ..core import (
    BaseListResponse,
    MLUnavailable,
    RegionOutputTooLarge,
    build_exports_url,
    run_bigbed_to_bed,
    search_bed,
)
from ..data_models import (
    CROM_NUMBERS,
    BatchBedRequest,
    BedDigest,
    ChromLengthUploadModel,
    CollectionStatsRequest,
)
from ..dependencies import get_bbagent, get_ref_validator
from ..helpers import count_requests, test_query_parameter
from ..uploads import uploaded_region_set

router = APIRouter(prefix="/v1/bed", tags=["bed"])


def _require_ml(bbagent: BedBaseAgent, *attrs: str) -> None:
    """Return 503 up-front when bbconf was started without the ML pieces a route needs.

    With ``init_ml=False`` these config attributes are ``None`` and bbconf would
    otherwise fail deep inside with a 500 AttributeError.
    """
    config = getattr(bbagent, "config", None)
    if any(getattr(config, attr, None) is None for attr in attrs):
        raise HTTPException(
            status_code=503,
            detail="This endpoint is unavailable (ML models disabled)",
        )


def _force_https(url: object) -> str:
    """Upgrade a generated hub URL to https.

    UCSC refuses to load track-hub resources over plain http when the hub is
    opened from an https page. Behind the TLS-terminating proxy ``request.url_for``
    yields an ``http://`` URL, so we rewrite the scheme; an already-https URL is
    left untouched (unlike a naive ``replace('http', 'https')``).
    """
    text = str(url)
    if text.startswith("http://"):
        return "https://" + text[len("http://") :]
    return text


def _trackdb_value(text: str, limit: int) -> str:
    """Make free text safe as one UCSC trackDb value.

    Name and description come from submitters. A newline would inject trackDb
    settings, a blank line would end the stanza, and a trailing backslash would
    continue the line. UCSC caps shortLabel at 17 chars and longLabel at 76.
    """
    clean = " ".join(str(text).split())[:limit]
    return clean.rstrip("\\ ").lstrip()


@router.get(
    "/example",
    summary="Get example BED record metadata",
    response_model=BedMetadataAll,
    response_model_by_alias=False,
)
def get_example_bed_record(
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedMetadataAll:
    """
    Get metadata for an example BED record.
    """
    result = bbagent.bed.get_ids_list(limit=1, offset=0, genome="hg38").results
    if result:
        return result[0]
    raise HTTPException(status_code=404, detail="No records found")


@router.get(
    "/list",
    summary="Paged list of all BED records",
    response_model=BedListResult,
)
def list_beds(
    limit: int = Query(
        1000,
        ge=1,
        le=MAX_LIST_LIMIT,
        description=f"Limit (1-{MAX_LIST_LIMIT}), default 1000",
    ),
    offset: int = Query(
        0,
        ge=0,
        le=10000,
        description=(
            "Offset (0-10000), default 0. Offset paging gets slower the deeper "
            "you go, so it is capped. To go further, use after=<last id> or "
            "download the bulk snapshot from /v1/exports."
        ),
    ),
    after: str | None = Query(
        None,
        description=(
            "Return records with id greater than this. Keyset paging; ignores "
            "offset. Pass the last id of the previous page to get the next one."
        ),
    ),
    genome: str = Query(
        default=None, description="filter by genome of the bed file. e.g. 'hg38'"
    ),
    bed_compliance: str = Query(
        default=None, description="filter by bed type. e.g. 'bed6+4'"
    ),
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedListResult:
    """
    To enumerate everything, page with `after=<last id>` or download the
    monthly Parquet snapshot from `/v1/exports`.

    Returns list of BED files in the database with optional filters. Results
    are ordered by id. `count` (the total number of matching records) is only
    filled in on the first page (`offset=0` and no `after`); it is `null` on
    every other page.
    """

    return bbagent.bed.get_ids_list(
        limit=limit,
        offset=offset,
        genome=genome,
        bed_compliance=bed_compliance,
        after=after,
    )


@router.get(
    "/{bed_id}/metadata",
    summary="Get metadata for a single BED record",
    response_model=BedMetadataAll,
    response_model_by_alias=False,
    description=f"Example\n bed_id: {EXAMPLE_BED}",
)
@count_requests(event="bed_meta")
def get_bed_metadata(
    request: Request,
    bed_id: str = BedDigest,
    full: bool | None = Query(
        False, description="Return full record with stats, plots, files and metadata"
    ),
    test_request: bool = test_query_parameter,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedMetadataAll:
    """
    Returns metadata for a single BED record. if full=True, returns full record with stats, plots, files and metadata.
    """
    try:
        return bbagent.bed.get(bed_id, full=full)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
            detail="BED file not found",
        )


@router.get(
    "/{bed_id}/metadata/plots",
    summary="Get plots for a single BED record",
    response_model=BedPlots,
    description=f"Example\n bed_id: {EXAMPLE_BED}",
)
def get_bed_plots(
    bed_id: str = BedDigest,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedPlots:
    try:
        return bbagent.bed.get_plots(bed_id)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
            detail="BED plots not found",
        )


@router.get(
    "/{bed_id}/metadata/files",
    summary="Get metadata for a single BED record",
    response_model=BedFiles,
    description=f"Example\n bed_id: {EXAMPLE_BED}",
)
def get_bed_files(
    bed_id: str = BedDigest,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedFiles:
    try:
        return bbagent.bed.get_files(bed_id)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
            detail="BED files not found",
        )


@router.get(
    "/{bed_id}/metadata/stats",
    summary="Get stats for a single BED record",
    response_model=BedStatsModel,
    description=f"Example\n bed_id: {EXAMPLE_BED}",
)
def get_bed_stats(
    bed_id: str = BedDigest,
    distributions: bool = Query(
        False,
        description="Also return the file's distribution arrays (a large blob).",
    ),
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedStatsModel:
    try:
        return bbagent.bed.get_stats(bed_id, distributions=distributions)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
            detail="BED stats not found",
        )


@router.post(
    "/batch",
    summary="Get metadata for multiple BED records",
)
def get_bed_batch(
    request: BatchBedRequest,
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """Retrieve metadata for up to 1000 BED files in a single request."""
    if len(request.ids) > MAX_BATCH_IDS:
        raise HTTPException(
            status_code=400,
            detail=f"Too many IDs. Maximum is {MAX_BATCH_IDS}.",
        )
    return bbagent.bed.get_batch(request.ids, full=True, distributions=False)


@router.post(
    "/collection/stats",
    summary="Compute collection statistics from a list of BED IDs",
)
def get_collection_stats(
    request: CollectionStatsRequest,
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """Aggregate distribution statistics across up to 1000 BED files on the fly."""
    if len(request.ids) > MAX_BATCH_IDS:
        raise HTTPException(
            status_code=400,
            detail=f"Too many IDs. Maximum is {MAX_BATCH_IDS}.",
        )
    return bbagent.bed.aggregate_distributions(request.ids)


@router.get(
    "/{bed_id}/metadata/classification",
    summary="Get classification of single BED file",
    response_model=BedClassification,
    response_model_by_alias=False,
    description=f"Example\n bed_id: {EXAMPLE_BED}",
)
def get_bed_classification(
    bed_id: str = BedDigest,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedClassification:
    try:
        return bbagent.bed.get_classification(bed_id)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
            detail="BED classification not found",
        )


# @router.get(
#     "/{bed_id}/metadata/raw",
#     summary="Get raw metadata for a single BED record",
#     # response_model=BedPEPHub,
#     response_model=BedPEPHubRestrict,
#     response_model_by_alias=False,
#     description=f"Returns raw metadata for a single BED record. "
#     f"This metadata is stored in PEPHub. And is not verified."
#     f"Example\n bed_id: {EXAMPLE_BED}",
# )
# def get_bed_pephub(
#     bed_id: str = BedDigest,
#     bbagent: BedBaseAgent = Depends(get_bbagent),
# ):
#     try:
#         return bbagent.bed.get_raw_metadata(bed_id)
#     except BEDFileNotFoundError as _:
#         raise HTTPException(
#             status_code=404,
#             detail="BED raw metadata not found",
#         )


@router.get(
    "/{bed_id}/neighbours",
    summary="Get nearest neighbours for a single BED record",
    response_model=BedListSearchResult,
    response_model_by_alias=False,
    description=f"Returns most similar BED files in the database. "
    f"Example\n bed_id: {EXAMPLE_BED}",
)
def get_bed_neighbours(
    bed_id: str = BedDigest,
    limit: int = Query(
        10,
        ge=1,
        le=MAX_SEARCH_LIMIT,
        description=f"Limit (1-{MAX_SEARCH_LIMIT}), default 10",
    ),
    offset: int = Query(0, ge=0, description="Offset (>= 0)"),
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedListSearchResult:
    try:
        return bbagent.bed.get_neighbours(bed_id, limit=limit, offset=offset)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
            detail="BED neighbours not found",
        )


@router.get(
    "/{bed_id}/embedding",
    summary="Get embeddings for a single BED record",
    response_model=BedEmbeddingResult,
)
def get_bed_embedding(
    bed_id: str = BedDigest,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedEmbeddingResult:
    """
    Returns embeddings for a single BED record.
    """
    try:
        return bbagent.bed.get_embedding(bed_id)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
            detail="BED embedding not found",
        )


@router.post(
    "/embed",
    summary="Get embeddings for a bed file.",
    response_model=list[float],
)
def embed_bed_file(
    file: UploadFile = File(...),
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> list[float]:
    """
    Create embedding for bed file
    """
    _LOGGER.info("Embedding file..")
    _require_ml(bbagent, "qdrant_file_backend", "r2v_encoder")
    with uploaded_region_set(file) as region_set:
        embedding = bbagent.bed._embed_file(region_set)
    return embedding.tolist()[0]


@router.post(
    "/umap",
    summary="Get UMAP coordinates for a bed file.",
    response_model=list[float],
)
def umap_bed_file(
    file: UploadFile = File(...),
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> list[float]:
    """
    Compute UMAP coordinates for bed file
    """
    _LOGGER.info("Computing UMAP coordinates for file..")
    _require_ml(bbagent, "qdrant_file_backend", "r2v_encoder", "umap_encoder")
    with uploaded_region_set(file) as region_set:
        coordinates = bbagent.bed._get_umap_file(region_set)
    return coordinates.tolist()[0]


@router.post(
    "/analyze-genome",
    summary="Analyze reference genome for bed file",
    response_model=RefGenValidReturnModel,
)
def analyze_reference_genome(
    chrom_lengths: ChromLengthUploadModel,
    bbagent: BedBaseAgent = Depends(get_bbagent),
    ref_validator: ReferenceValidator = Depends(get_ref_validator),
) -> RefGenValidReturnModel:
    """
    Provide length of the chromosomes for a reference genome, and
    return reference genome validation results for a bed file
    """

    if ref_validator is None:
        raise HTTPException(
            status_code=503,
            detail="Reference validator unavailable (BEDHOST_INIT_ML=false)",
        )

    try:
        genome_aliases = bbagent.get_reference_genomes()
        result = ref_validator.determine_compatibility(
            chrom_lengths.bed_file, concise=True
        )

        compared_genomes: list[RefGenValidModel] = []
        for genome, value in result.items():
            if value.tier_ranking < 4:
                compared_genomes.append(
                    RefGenValidModel(
                        provided_genome="Not Provided",
                        compared_genome=genome_aliases.get(genome, "Unknown genome"),
                        genome_digest=genome,
                        xs=value.xs,
                        oobr=value.oobr,
                        sequence_fit=value.sequence_fit,
                        assigned_points=value.assigned_points,
                        tier_ranking=value.tier_ranking,
                    )
                )
        return RefGenValidReturnModel(
            id="No ID",
            provided_genome="Not Provided",
            compared_genome=compared_genomes,
        )

    except BedBaseConfError as e:
        _LOGGER.error(e)
        raise HTTPException(
            status_code=400,
            detail="Unable to process request. Check loggs",
        )


@router.get(
    "/missing_plots",
    summary="Get missing plots for a bed file.",
    response_model=BaseListResponse,
)
def missing_plots(
    plot_id: str,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BaseListResponse:
    """
    Get missing plots for a bed file

    example ->  plot_id: gccontent
    """

    try:
        bed_ids = bbagent.bed.get_missing_plots(plot_id, limit=100000, offset=0)
    except BedBaseConfError as e:
        raise HTTPException(
            status_code=404,
            detail=f"{e}",
        )
    return BaseListResponse(
        count=len(bed_ids),
        limit=100000,
        offset=0,
        results=bed_ids,
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
        int | None, Query(ge=0, description="Query range: start coordinate (0-based)")
    ] = None,
    end: Annotated[
        int | None, Query(ge=0, description="Query range: end coordinate")
    ] = None,
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """
    Returns the queried regions with provided ID and optional query parameters
    """
    if start is not None and end is not None and end <= start:
        raise HTTPException(status_code=400, detail="end must be greater than start")

    bigbedfile = bbagent.bed.get_files(bed_id).bigbed_file

    if not bigbedfile:
        raise HTTPException(
            status_code=404, detail="ERROR: bigBed file doesn't exists. Can't query."
        )
    # Use the direct storage URL: the "http" access method points at the API's
    # /v1/files/ redirect, and bigBedToBed cannot follow redirects.
    path = build_exports_url(bigbedfile.path)
    _LOGGER.debug(path)
    cmd = ["bigBedToBed"]
    if chr_num:
        cmd.append(f"-chrom={chr_num}")
    if start is not None:
        cmd.append(f"-start={start}")
    if end is not None:
        cmd.append(f"-end={end}")
    cmd.extend([path, "stdout"])

    _LOGGER.info(f"Command: {' '.join(map(str, cmd))}")
    try:
        return run_bigbed_to_bed(cmd, BIGBED_TIMEOUT_SECONDS, MAX_REGIONS_OUTPUT_BYTES)
    except RegionOutputTooLarge:
        raise HTTPException(
            status_code=413,
            detail=f"Too many regions in the requested range (over "
            f"{MAX_REGIONS_OUTPUT_BYTES // (1024 * 1024)} MB). Narrow it with start and end.",
        )
    except FileNotFoundError:
        _LOGGER.warning("bigBedToBed is not installed.")
        raise HTTPException(
            status_code=500, detail="ERROR: bigBedToBed is not installed."
        )
    except subprocess.TimeoutExpired:
        _LOGGER.warning(f"Region query timed out for bed_id={bed_id}, chrom={chr_num}")
        raise HTTPException(status_code=504, detail="Region query timed out.")
    except subprocess.CalledProcessError as e:
        _LOGGER.error(
            f"bigBedToBed failed for bed_id={bed_id}, chrom={chr_num}: "
            f"returncode={e.returncode}, stderr={e.stderr}"
        )
        raise HTTPException(status_code=502, detail="Failed to query bigBed file.")


@router.head("/{bed_id}/track_hub", include_in_schema=False)
@router.get(
    "/{bed_id}/track_hub",
    summary="Generate a UCSC track hub for a single BED file",
)
def get_track_hub_bed(
    request: Request,
    bed_id: str = BedDigest,
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """
    Generate the UCSC hub.txt for a single BED file.

    Point the UCSC Genome Browser at this endpoint with
    ``hgTracks?db=<genome>&hubUrl=<this url>``.
    """
    bbagent.bed.get(bed_id)  # 404s via BEDFileNotFoundError handler if unknown

    hub_txt = (
        f"hub \t BEDBASE_{bed_id}\n"
        f"shortLabel \t BEDBASE_{bed_id}\n"
        f"longLabel\t BEDBASE {bed_id} signal track\n"
        f"genomesFile\t {_force_https(request.url_for('get_genomes_file_bed', bed_id=bed_id))}\n"
        "email\t bnt4me@virginia.edu\n"
        f"descriptionUrl\t https://bedbase.org/bed/{bed_id}"
    )

    return Response(hub_txt, media_type="text/plain")


@router.head("/{bed_id}/track_hub_genome_file", include_in_schema=False)
@router.get("/{bed_id}/track_hub_genome_file", include_in_schema=False)
def get_genomes_file_bed(
    request: Request,
    bed_id: str = BedDigest,
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """
    Generate the genomes file for a single BED file track hub.
    """
    metadata = bbagent.bed.get(bed_id)
    genome = metadata.genome_alias or "hg38"

    genome_txt = (
        f"genome\t {genome}\n"
        f"trackDb\t {_force_https(request.url_for('get_trackDb_file_bed', bed_id=bed_id))}"
    )

    return Response(genome_txt, media_type="text/plain")


@router.head("/{bed_id}/track_hub_trackDb_file", include_in_schema=False)
@router.get("/{bed_id}/track_hub_trackDb_file", include_in_schema=False)
def get_trackDb_file_bed(
    bed_id: str = BedDigest,
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """
    Generate the trackDb file (a single track) for a BED file track hub.
    """
    bigbed_file = bbagent.bed.get_files(bed_id).bigbed_file

    if not bigbed_file:
        raise HTTPException(
            status_code=404,
            detail="No bigBed file for this BED; cannot build a genome browser track.",
        )

    metadata = bbagent.bed.get(bed_id)
    name = _trackdb_value(metadata.name or "", 17) or bed_id[:17]
    # longLabel is the text UCSC draws *over* the track, so lead with the name (the
    # identifier users recognize) and append the description only when it's actually
    # present -- BEDbase descriptions are frequently empty or None.
    full_name = metadata.name or bed_id
    description = (metadata.description or "").strip()
    long_label = f"{full_name}: {description}" if description else full_name
    # Use the direct storage URL rather than the /v1/files/ redirect: UCSC fetches
    # the bigBed over range requests, and the direct CDN URL avoids depending on
    # redirect-following (mirrors the region-query endpoint above).
    bigbed_url = build_exports_url(bigbed_file.path)

    trackDb_txt = (
        # `track` must start with a letter and use only [A-Za-z0-9_-]; a BED id is
        # hex and often starts with a digit, so prefix it.
        f"track\tbedbase_{bed_id}\n"
        "type\tbigBed\n"
        f"bigDataUrl\t{bigbed_url}\n"
        f"shortLabel\t{name}\n"
        f"longLabel\t{_trackdb_value(long_label, 76) or bed_id}\n"
        "visibility\tfull\n\n"
    )

    return Response(trackDb_txt, media_type="text/plain")


@router.get(
    "/search/text",
    summary="Search for a BedFile",
    tags=["search"],
    response_model=BedListSearchResult,
    response_model_by_alias=False,
)
@count_requests(event="bed_search")
def text_to_bed_search(
    request: Request,
    query: str,
    genome: str | None = None,
    assay: str | None = None,
    limit: int = Query(
        10,
        ge=1,
        le=MAX_SEARCH_LIMIT,
        description=f"Limit (1-{MAX_SEARCH_LIMIT}), default 10",
    ),
    offset: int = Query(0, ge=0, description="Offset (>= 0)"),
    test_request: bool = test_query_parameter,  # needed for usage tracking in @count_requests
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedListSearchResult:
    """
    Search for a BedFile by a text query.

    By default, it searches in the 'hg38' genome. To search in a different genome, specify the `genome` parameter. eg. mm10
    Example: query="cancer"
    """

    _LOGGER.info(
        f"Searching for: '{query}' with limit='{limit}' and offset='{offset}' and genome='{genome}' and assay='{assay}'"
    )
    try:
        return search_bed(
            bbagent, query, genome=genome, assay=assay, limit=limit, offset=offset
        ).result
    except MLUnavailable:
        # Only free-text queries need the dense encoder, which isn't loaded when
        # bbconf runs with ``init_ml=False`` (CI / BEDHOST_INIT_ML=false). Exact
        # ids and GEO/ENCODE accessions still work then.
        raise HTTPException(
            status_code=503,
            detail="Text search unavailable (ML models disabled)",
        )


@router.get(
    "/search/exact",
    summary="Search for exact match of metadata in bed files",
    tags=["search"],
    response_model=BedListSearchResult,
    response_model_by_alias=False,
)
def exact_search(
    query: str,
    genome: str | None = None,
    assay: str | None = None,
    limit: int = Query(
        10,
        ge=1,
        le=MAX_SEARCH_LIMIT,
        description=f"Limit (1-{MAX_SEARCH_LIMIT}), default 10",
    ),
    offset: int = Query(0, ge=0, description="Offset (>= 0)"),
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedListSearchResult:
    return bbagent.bed.sql_search(
        query=query,
        genome=genome,
        assay=assay,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/search/bed",
    summary="Search for similar bed files",
    tags=["search"],
    response_model=BedListSearchResult,
    response_model_by_alias=False,
)
def bed_to_bed_search(
    file: UploadFile = File(...),
    limit: int = Query(
        10,
        ge=1,
        le=MAX_SEARCH_LIMIT,
        description=f"Limit (1-{MAX_SEARCH_LIMIT}), default 10",
    ),
    offset: int = Query(0, ge=0, description="Offset (>= 0)"),
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedListSearchResult:
    _LOGGER.info("Searching for bedfiles...")
    _require_ml(bbagent, "b2b_search_interface")
    with uploaded_region_set(file, validate_for_search=True) as region_set:
        return bbagent.bed.bed_to_bed_search(region_set, limit=limit, offset=offset)


@router.get(
    "/{bed_id}/tokens/{universe_id}",
    summary="Get tokenized of bed file",
    response_model=TokenizedBedResponse,
)
def get_tokens(
    bed_id: str,
    universe_id: str,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> TokenizedBedResponse:
    """
    Return univers of bed file
    Example: bed: 0dcdf8986a72a3d85805bbc9493a1302 | universe: 58dee1672b7e581c8e1312bd4ca6b3c7
    """
    try:
        return bbagent.bed.get_tokenized(bed_id, universe_id)

    except TokenizeFileNotExistError as _:
        raise HTTPException(
            status_code=404,
            detail="Tokenized file not found",
        )


@router.get(
    "/{bed_id}/tokens/{universe_id}/info",
    summary="Get link to tokenized bed file",
    response_model=TokenizedPathResponse,
)
def get_tokens_info(
    bed_id: str,
    universe_id: str,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> TokenizedPathResponse:
    """
    Return link to tokenized bed file
    Example: bed: 0dcdf8986a72a3d85805bbc9493a1302 | universe: 58dee1672b7e581c8e1312bd4ca6b3c7
    """
    try:
        return bbagent.bed.get_tokenized_link(bed_id, universe_id)

    except TokenizeFileNotExistError as _:
        raise HTTPException(
            status_code=404,
            detail="Tokenized file not found",
        )


@router.get(
    "/{bed_id}/genome-stats",
    summary="Get reference genome validation results",
    response_model=RefGenValidReturnModel,
)
def get_ref_gen_results(
    bed_id: str,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> RefGenValidReturnModel:
    """
    Return reference genome validation results for a bed file
    Example: bed: 0dcdf8986a72a3d85805bbc9493a1302
    """
    try:
        return bbagent.bed.get_reference_validation(bed_id)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
            detail=f"Bed file {bed_id} not found",
        )
