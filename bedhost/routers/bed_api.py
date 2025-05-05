import subprocess

try:
    from typing import Annotated, Any, Dict, List, Optional
except ImportError:
    from typing_extensions import Annotated
    from typing import Dict, Optional, List, Any

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
)
from fastapi import APIRouter, File, HTTPException, Query, UploadFile, Request
from fastapi.responses import PlainTextResponse
from gtars.models import RegionSet

from .. import _LOGGER
from ..const import EXAMPLE_BED
from ..data_models import CROM_NUMBERS, BaseListResponse, BedDigest
from ..main import bbagent, usage_data
from ..helpers import count_requests

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
    limit: int = 1000,
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


@router.post(
    "/search/text",
    summary="Search for a BedFile",
    tags=["search"],
    response_model=BedListSearchResult,
    response_model_by_alias=False,
)
@count_requests(usage_data, event="bed_search")
async def text_to_bed_search(query: str, limit: int = 10, offset: int = 0):
    """
    Search for a BedFile by a text query.
    Example: query="cancer"
    """
    _LOGGER.info(f"Searching for: {query}")

    # results_sql = bbagent.bed.sql_search(
    #     query, limit=round(limit / 2, 0), offset=round(offset / 2, 0)
    # )
    #
    # if results_sql.count > results_sql.offset:
    #     qdrant_offset = offset - results_sql.offset
    # else:
    #     qdrant_offset = offset - results_sql.count
    #
    # results_qdr = bbagent.bed.text_to_bed_search(
    #     query, limit=limit, offset=qdrant_offset - 1 if qdrant_offset > 0 else 0
    # )
    #
    # results = BedListSearchResult(
    #     count=results_qdr.count,
    #     limit=limit,
    #     offset=offset,
    #     results=(results_sql.results + results_qdr.results)[0:limit],
    # )
    spaceless_query = query.replace(" ", "")
    if len(spaceless_query) == 32 and spaceless_query == query:
        try:
            similar_results = bbagent.bed.get_neighbours(
                query, limit=limit, offset=offset
            )

            if similar_results.results and offset == 0:

                result = QdrantSearchResult(
                    id=query,
                    payload={},
                    score=1.0,
                    metadata=bbagent.bed.get(query),
                )

                similar_results.results.insert(0, result)
            return similar_results
        except Exception as _:
            pass

    results = bbagent.bed.text_to_bed_search(
        query,
        limit=limit,
        offset=offset,
    )

    if results:
        return results
    raise HTTPException(status_code=404, detail="No records found")


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
