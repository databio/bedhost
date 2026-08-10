try:
    from typing import Annotated, Any, Dict, List, Optional
except ImportError:
    from typing_extensions import Annotated
    from typing import Dict, Optional, List, Any

import os

from platform import python_version
from bbconf import __version__ as bbconf_version
from bbconf.bbagent import BedBaseAgent
from bbconf.models.base_models import StatsReturn, FileStats, UsageStats
from bbconf.models.base_models import BedSnapshotListResult
from fastapi import APIRouter, Depends, Request, Query
from fastapi.responses import RedirectResponse
from geniml import __version__ as geniml_version

from .._version import __version__ as bedhost_version
from ..data_models import (
    BaseListResponse,
    ComponentVersions,
    EmbeddingModels,
    Organization,
    ServiceInfoResponse,
    Type,
)
from ..const import EXPORTS_URL_BASE
from ..dependencies import fetch_detailed_stats, get_bbagent
from ..helpers import get_openapi_version, count_requests, test_query_parameter

router = APIRouter(prefix="/v1", tags=["base"])

packages_versions = {}


@router.get(
    "/stats",
    summary="Get summary statistics for BEDbase platform",
    response_model=StatsReturn,
)
async def get_bedbase_db_stats(
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """
    Returns statistics
    """
    return bbagent.get_stats()


@router.get(
    "/detailed-stats",
    summary="Get detailed statistics for BEDbase platform, including number of files for each genome",
    response_model=FileStats,
)
def get_detailed_stats(
    request: Request,
    concise: bool = False,
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """
    Returns detailed statistics
    """
    return fetch_detailed_stats(request, bbagent=bbagent, concise=concise)


@router.get(
    "/detailed-usage",
    summary="Get detailed usage statistics for BEDbase platform",
    response_model=UsageStats,
)
async def get_detailed_usage(
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """
    Returns detailed usage statistics
    """
    return bbagent.get_detailed_usage()


@router.get(
    "/genomes",
    summary="Get available genomes",
    response_model=BaseListResponse,
)
async def get_genomes_list(
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """
    Returns available genomes
    """
    genomes = bbagent.get_list_genomes()
    return BaseListResponse(
        count=len(genomes),
        limit=100,
        offset=0,
        results=genomes,
    )


@router.get(
    "/assays",
    summary="Get available assays",
    response_model=BaseListResponse,
)
async def get_assays_list(
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """
    Returns available assays
    """
    genomes = bbagent.get_list_assays()
    return BaseListResponse(
        count=len(genomes),
        limit=100,
        offset=0,
        results=genomes,
    )


@router.get(
    "/exports",
    summary="Index of published bulk metadata exports (newest first)",
    response_model=BedSnapshotListResult,
)
def get_bed_exports(
    bbagent: BedBaseAgent = Depends(get_bbagent),
    limit: int = Query(
        1000, ge=1, le=10000, description="Limit (1-10000), default 1000"
    ),
    offset: int = 0,
) -> BedSnapshotListResult:
    """
    Return the index of bulk metadata export artifacts published to S3, newest
    first. ``file_path`` is rewritten to the absolute HTTPS CDN URL. Consumers
    should resolve the current snapshot through this endpoint rather than
    constructing or hardcoding a filename, since artifacts are dated and
    immutable.

    Declared ``def`` (not ``async def``) so the blocking database query runs in a
    threadpool instead of stalling the event loop.
    """
    result = bbagent.snapshot.list(limit=limit, offset=offset)
    result.results = [
        row.model_copy(
            update={"file_path": os.path.join(EXPORTS_URL_BASE, row.file_path)}
        )
        for row in result.results
    ]
    return result


@router.get(
    "/service-info", summary="GA4GH service info", response_model=ServiceInfoResponse
)
async def service_info(
    request: Request,
    bbagent: BedBaseAgent = Depends(get_bbagent),
):
    """
    Returns information about this service, such as versions, name, etc.
    """
    all_versions = ComponentVersions(
        bedhost_version=bedhost_version,
        bbconf_version=bbconf_version,
        geniml_version=geniml_version,
        python_version=python_version(),
        openapi_version=get_openapi_version(request.app),
    )

    return ServiceInfoResponse(
        id="org.bedbase.api",
        name="BEDbase API",
        type=Type(
            group="org.databio",
            artifact="bedbase",
            version=bedhost_version,
        ),
        description="An API providing genomic interval data and metadata",
        organization=Organization(name="Databio Lab", url="https://databio.org"),
        contactUrl="https://github.com/databio/bedbase/issues",
        documentationUrl="https://docs.bedbase.org",
        updatedAt="2024-09-26T00:00:00Z",
        environment="main",
        version=bedhost_version,
        component_versions=all_versions,
        embedding_models=EmbeddingModels(
            region2vec=bbagent.config.config.path.region2vec,
            text2vec=bbagent.config.config.path.text2vec,
        ),
    )


@router.get("/files/{file_path:path}")
@count_requests(event="files")
async def redirect_to_download(
    file_path: str,
    request: Request,
    test_request: bool = test_query_parameter,
):
    download_url = f"https://data2.bedbase.org/{file_path}"
    return RedirectResponse(url=download_url)
