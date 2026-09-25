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
    QdrantSearchResult,
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
    MAX_LIST_LIMIT,
    MAX_REGIONS_OUTPUT_BYTES,
    MAX_SEARCH_LIMIT,
)
from ..data_models import (
    CROM_NUMBERS,
    BaseListResponse,
    BedDigest,
    ChromLengthUploadModel,
)
from ..dependencies import get_bbagent, get_ref_validator
from ..helpers import (
    RegionOutputTooLarge,
    build_exports_url,
    count_requests,
    run_bigbed_to_bed,
    test_query_parameter,
)
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


@router.get(
    "/example",
    summary="Get example BED record metadata",
    response_model=BedMetadataAll,
    response_model_by_alias=False,
)
async def get_example_bed_record(
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
    offset: int = Query(0, ge=0, description="Offset (>= 0)"),
    genome: str = Query(
        default=None, description="filter by genome of the bed file. e.g. 'hg38'"
    ),
    bed_compliance: str = Query(
        default=None, description="filter by bed type. e.g. 'bed6+4'"
    ),
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedListResult:
    """
    Returns list of BED files in the database with optional filters.
    """

    return bbagent.bed.get_ids_list(
        limit=limit, offset=offset, genome=genome, bed_compliance=bed_compliance
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
    "/{bed_id}/og-image",
    summary="Get Open Graph preview image for a BED record",
    response_class=Response,
    responses={200: {"content": {"image/png": {}}}},
    description=f"Returns a 1200x630 PNG card with stats for link previews. Example bed_id: {EXAMPLE_BED}",
)
def get_bed_og_image(
    bed_id: str = BedDigest,
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    from ..og_image import generate_bed_og_image

    try:
        meta = bbagent.bed.get(bed_id, full=True)
    except BEDFileNotFoundError:
        raise HTTPException(status_code=404)

    stats = meta.stats
    png = generate_bed_og_image(
        bed_id=bed_id,
        genome=getattr(meta, "genome_alias", None),
        bed_compliance=getattr(meta, "bed_compliance", None),
        number_of_regions=getattr(stats, "number_of_regions", None) if stats else None,
        mean_region_width=getattr(stats, "mean_region_width", None) if stats else None,
    )
    return Response(
        content=png,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get(
    "/{bed_id}/metadata/plots",
    summary="Get plots for a single BED record",
    response_model=BedPlots,
    description=f"Example\n bed_id: {EXAMPLE_BED}",
)
async def get_bed_plots(
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
async def get_bed_files(
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
async def get_bed_stats(
    bed_id: str = BedDigest,
    bbagent: BedBaseAgent = Depends(get_bbagent),
) -> BedStatsModel:
    try:
        return bbagent.bed.get_stats(bed_id)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
            detail="BED stats not found",
        )


@router.get(
    "/{bed_id}/metadata/classification",
    summary="Get classification of single BED file",
    response_model=BedClassification,
    response_model_by_alias=False,
    description=f"Example\n bed_id: {EXAMPLE_BED}",
)
async def get_bed_classification(
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
async def get_bed_embedding(
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

    # Hybrid search depends on the dense encoder, which isn't loaded when
    # bbconf is initialized with ``init_ml=False`` (CI / BEDHOST_INIT_ML=false).
    # Return 503 up-front rather than a 500 AttributeError from deep in bbconf.
    if getattr(bbagent.config, "dense_encoder", None) is None:
        raise HTTPException(
            status_code=503,
            detail="Text search unavailable (ML models disabled)",
        )

    spaceless_query = query.replace(" ", "")
    if len(spaceless_query) == 32 and spaceless_query == query:
        try:
            result = QdrantSearchResult(
                id=query,
                payload={},
                score=1.0,
                metadata=bbagent.bed.get(query),
            )
            if result.metadata is None:
                raise BEDFileNotFoundError(f"Bed file with id {query} not found")

            try:
                similar_results = bbagent.bed.get_neighbours(
                    query, limit=limit, offset=offset
                )
                if similar_results.results and offset == 0:
                    similar_results.results.insert(0, result)
                    return similar_results
                else:
                    raise BEDFileNotFoundError("Similar beds not found")
            except Exception as _:
                similar_results = BedListSearchResult(
                    count=1,
                    limit=100,
                    offset=0,
                    results=[result],
                )

            return similar_results
        except Exception as _:
            pass

    spaceless_query_lower = spaceless_query.lower()
    if any(
        [
            spaceless_query_lower.startswith("gsm"),
            spaceless_query_lower.startswith("encff"),
            spaceless_query_lower.startswith("encsr"),
            spaceless_query_lower.startswith("gse"),
            spaceless_query_lower.startswith("geo:"),
            spaceless_query_lower.startswith("encode:"),
        ]
    ):
        _LOGGER.info("Searching for GSM or ENCODE accession")

        spaceless_query_lower = spaceless_query_lower.replace("geo:", "").replace(
            "encode:", ""
        )

        if spaceless_query_lower.startswith("gsm") or spaceless_query_lower.startswith(
            "gse"
        ):
            result = bbagent.bed.search_external_file(
                source="geo", accession=spaceless_query_lower
            )
            if result.count != 0:
                return result

        elif spaceless_query_lower.startswith(
            "encsr"
        ) or spaceless_query_lower.startswith("encff"):
            result = bbagent.bed.search_external_file(
                source="encode", accession=spaceless_query_lower.upper()
            )
            if result.count != 0:
                return result

    # # Basic semantic search
    # results = bbagent.bed.semantic_search(
    #     query,
    #     genome_alias=genome,
    #     assay=assay,
    #     limit=limit,
    #     offset=offset,
    # )

    # # Hybrid search
    results = bbagent.bed.hybrid_search(
        query,
        genome_alias=genome,
        assay=assay,
        limit=limit,
        offset=offset,
    )
    return results

    # # # Bi-vec search
    #
    # # This is disabled for now, as it is sql search mix, which we don't want to mix
    # # results_sql = bbagent.bed.sql_search(
    # #     query, limit=round(limit / 2, 0), offset=round(offset / 2, 0)
    # # )
    # #
    # # if results_sql.count > results_sql.offset:
    # #     qdrant_offset = offset - results_sql.offset
    # # else:
    # #     qdrant_offset = offset - results_sql.count
    # # results_qdr = bbagent.bed.text_to_bed_search(
    # #     query, limit=limit, offset=qdrant_offset - 1 if qdrant_offset > 0 else 0
    # # )
    # # results = BedListSearchResult(
    # #     count=results_qdr.count,
    # #     limit=limit,
    # #     offset=offset,
    # # )
    # # print("results:", results_qdr)
    # #
    # # raise HTTPException(status_code=404, detail="No records found")
    #
    #
    # results_qdr = bbagent.bed.text_to_bed_search(
    #     query, limit=limit, offset=offset
    # )


@router.get(
    "/search/exact",
    summary="Search for exact match of metadata in bed files",
    tags=["search"],
    response_model=BedListSearchResult,
    response_model_by_alias=False,
)
async def exact_search(
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
async def get_tokens(
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
async def get_tokens_info(
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
async def get_ref_gen_results(
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
