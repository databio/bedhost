import subprocess

try:
    from typing import Annotated, Any, Dict, List, Optional, Union
except ImportError:
    from typing_extensions import Annotated
    from typing import Dict, Optional, List, Any, Union

import os
import shutil
import tempfile

from bbconf.exceptions import (
    BedBaseConfError,
    BEDFileNotFoundError,
    TokenizeFileNotExistError,
)
from bbconf.models.bed_models import BedClassification  # BedPEPHub,
from bbconf.models.bed_models import (
    BedEmbeddingResult,
    BedFiles,
    BedListResult,
    BedListSearchResult,
    BedMetadataAll,
    BedPEPHubRestrict,
    BedPlots,
    BedStatsModel,
    TokenizedBedResponse,
    TokenizedPathResponse,
    QdrantSearchResult,
    RefGenValidReturnModel,
    RefGenValidModel,
)
from fastapi import APIRouter, File, HTTPException, Query, UploadFile, Request
from fastapi.responses import PlainTextResponse
from gtars.models import RegionSet

from .. import _LOGGER
from ..const import EXAMPLE_BED, MAX_FILE_SIZE, MAX_REGION_NUMBER, MIN_REGION_WIDTH
from ..data_models import (
    CROM_NUMBERS,
    BaseListResponse,
    BedDigest,
    ChromLengthUploadModel,
)
from ..main import bbagent, usage_data, ref_validator
from ..helpers import count_requests, test_query_parameter

router = APIRouter(prefix="/v1/bed", tags=["bed"])


@router.get(
    "/example",
    summary="Get example BED record metadata",
    response_model=BedMetadataAll,
    response_model_by_alias=False,
)
async def get_example_bed_record():
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
async def list_beds(
    limit: int = Query(
        1000, ge=1, le=10000, description="Limit (1-10000), default 1000"
    ),
    offset: int = 0,
    genome: str = Query(
        default=None, description="filter by genome of the bed file. e.g. 'hg38'"
    ),
    bed_compliance: str = Query(
        default=None, description="filter by bed type. e.g. 'bed6+4'"
    ),
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
    description=f"Example\n " f"bed_id: {EXAMPLE_BED}",
)
@count_requests(usage_data, event="bed_meta")
async def get_bed_metadata(
    bed_id: str = BedDigest,
    full: Optional[bool] = Query(
        False, description="Return full record with stats, plots, files and metadata"
    ),
    test_request: bool = test_query_parameter,
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
    response_model_by_alias=False,
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
    # response_model=BedPEPHub,
    response_model=BedPEPHubRestrict,
    response_model_by_alias=False,
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
    "/{bed_id}/neighbours",
    summary="Get nearest neighbours for a single BED record",
    response_model=BedListSearchResult,
    response_model_by_alias=False,
    description=f"Returns most similar BED files in the database. "
    f"Example\n bed_id: {EXAMPLE_BED}",
)
async def get_bed_neighbours(
    bed_id: str = BedDigest,
    limit: int = 10,
    offset: int = 0,
):
    try:
        return bbagent.bed.get_neighbours(bed_id, limit=limit, offset=offset)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
        )


@router.get(
    "/{bed_id}/embedding",
    summary="Get embeddings for a single BED record",
    response_model=BedEmbeddingResult,
)
async def get_bed_embedding(bed_id: str = BedDigest):
    """
    Returns embeddings for a single BED record.
    """
    try:
        return bbagent.bed.get_embedding(bed_id)
    except BEDFileNotFoundError as _:
        raise HTTPException(
            status_code=404,
        )


@router.post(
    "/embed",
    summary="Get embeddings for a bed file.",
    response_model=List[float],
)
async def embed_bed_file(
    file: UploadFile = File(None),
):
    """
    Create embedding for bed file
    """
    _LOGGER.info("Embedding file..")

    if file is not None:
        with tempfile.TemporaryDirectory() as dirpath:
            file_path = os.path.join(dirpath, file.filename)

            with open(file_path, "wb") as bed_file:
                shutil.copyfileobj(file.file, bed_file)

            region_set = RegionSet(file_path)

            embedding = bbagent.bed._embed_file(region_set)
    return embedding.tolist()[0]


@router.post(
    "/umap",
    summary="Get embeddings for a bed file.",
    response_model=List[float],
)
async def embed_bed_file(
    file: UploadFile = File(None),
):
    """
    Create embedding for bed file
    """
    _LOGGER.info("Embedding file..")

    if file is not None:
        with tempfile.TemporaryDirectory() as dirpath:
            file_path = os.path.join(dirpath, file.filename)

            with open(file_path, "wb") as bed_file:
                shutil.copyfileobj(file.file, bed_file)

            region_set = RegionSet(file_path)

            embedding = bbagent.bed._get_umap_file(region_set)
    return embedding.tolist()[0]


@router.post(
    "/analyze-genome",
    summary="Analyze reference genome for bed file",
    response_model=RefGenValidReturnModel,
)
async def analyze_reference_genome(
    chrom_lengths: ChromLengthUploadModel,
):
    """
    Provide length of the chromosomes for a reference genome, and
    return reference genome validation results for a bed file
    """

    try:
        genome_aliases = bbagent.get_reference_genomes()
        result = ref_validator.determine_compatibility(
            chrom_lengths.bed_file, concise=True
        )

        compared_genomes: List[RefGenValidModel] = []
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
            detail=f"Unable to process request. Check loggs",
        )


@router.get(
    "/missing_plots",
    summary="Get missing plots for a bed file.",
    response_model=BaseListResponse,
)
async def missing_plots(plot_id: str):
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


@router.get(
    "/search/text",
    summary="Search for a BedFile",
    tags=["search"],
    response_model=BedListSearchResult,
    response_model_by_alias=False,
)
@count_requests(usage_data, event="bed_search")
async def text_to_bed_search(
    query: str,
    genome: Optional[Union[str, None]] = None,
    assay: Optional[Union[str, None]] = None,
    limit: int = 10,
    offset: int = 0,
    test_request: bool = test_query_parameter,  # needed for usage tracking in @count_requests
):
    """
    Search for a BedFile by a text query.

    By default, it searches in the 'hg38' genome. To search in a different genome, specify the `genome` parameter. eg. mm10
    Example: query="cancer"
    """

    _LOGGER.info(
        f"Searching for: '{query}' with limit='{limit}' and offset='{offset}' and genome='{genome}' and assay='{assay}'"
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
                    raise BEDFileNotFoundError(f"Similar beds not found")
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

        elif spaceless_query_lower.startswith("encff"):
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

    return results_qdr


@router.get(
    "/search/exact",
    summary="Search for exact match of metadata in bed files",
    tags=["search"],
    response_model=BedListSearchResult,
    response_model_by_alias=False,
)
async def exact_search(
    query: str,
    genome: Optional[Union[str, None]] = None,
    assay: Optional[Union[str, None]] = None,
    limit: int = 10,
    offset: int = 0,
):
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
async def bed_to_bed_search(
    file: UploadFile = File(None), limit: int = 10, offset: int = 0
):
    _LOGGER.info("Searching for bedfiles...")
    print("file size {}", file.size)
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum file size is 20MB.",
        )

    if file is not None:
        with tempfile.TemporaryDirectory() as dirpath:
            file_path = os.path.join(dirpath, file.filename)

            with open(file_path, "wb") as bed_file:
                shutil.copyfileobj(file.file, bed_file)

            try:
                region_set = RegionSet(file_path)
            except Exception as e:
                _LOGGER.error(f"Error reading bed file: {e}")
                raise HTTPException(
                    status_code=415,
                    detail="Error reading bed file. Please make sure the file is a valid BED file.",
                )

            if region_set.mean_region_width() < MIN_REGION_WIDTH:
                raise HTTPException(
                    status_code=415,
                    detail="Mean region width is too small. Please provide a BED file with mean region width greater than 10.",
                )

            if len(region_set) > MAX_REGION_NUMBER:
                raise HTTPException(
                    status_code=415,
                    detail="Too many regions in the BED file. Please provide a BED file with less than 1,000,000 regions.",
                )

            results = bbagent.bed.bed_to_bed_search(
                region_set, limit=limit, offset=offset
            )
        return results

    return HTTPException(
        status_code=404,
        detail="Error occurred, please make sure file is correct and if issue persists, contact support.",
    )


@router.get(
    "/{bed_id}/tokens/{universe_id}",
    summary="Get tokenized of bed file",
    response_model=TokenizedBedResponse,
)
async def get_tokens(
    bed_id: str,
    universe_id: str,
):
    """
    Return univers of bed file
    Example: bed: 0dcdf8986a72a3d85805bbc9493a1302 | universe: 58dee1672b7e581c8e1312bd4ca6b3c7
    """
    _LOGGER.info(bbagent.config.config.s3)
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
async def get_tokens(
    bed_id: str,
    universe_id: str,
):
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
):
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
