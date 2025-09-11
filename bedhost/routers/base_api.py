try:
    from typing import Annotated, Any, Dict, List, Optional
except ImportError:
    from typing_extensions import Annotated
    from typing import Dict, Optional, List, Any

from platform import python_version

from bbconf import __version__ as bbconf_version
from bbconf.models.base_models import StatsReturn, FileStats, UsageStats
from fastapi import APIRouter, Request
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
from ..dependencies import fetch_detailed_stats
from ..helpers import get_openapi_version, count_requests
from ..main import app, bbagent, usage_data

router = APIRouter(prefix="/v1", tags=["base"])
from fastapi.responses import RedirectResponse

packages_versions = {}


@router.get(
    "/stats",
    summary="Get summary statistics for BEDbase platform",
    response_model=StatsReturn,
)
async def get_bedbase_db_stats():
    """
    Returns statistics
    """
    return bbagent.get_stats()


@router.get(
    "/detailed-stats",
    summary="Get detailed statistics for BEDbase platform, including number of files for each genome",
    response_model=FileStats,
)
async def get_detailed_stats(
    concise: bool = False,
):
    """
    Returns detailed statistics
    """
    return fetch_detailed_stats(concise=concise)


@router.get(
    "/detailed-usage",
    summary="Get detailed usage statistics for BEDbase platform",
    response_model=UsageStats,
)
async def get_detailed_usage():
    """
    Returns detailed usage statistics
    """
    return bbagent.get_detailed_usage()


@router.get(
    "/genomes",
    summary="Get available genomes",
    response_model=BaseListResponse,
)
async def get_bedbase_db_stats():
    """
    Returns statistics
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
async def get_bedbase_db_stats():
    """
    Returns statistics
    """
    genomes = bbagent.get_list_assays()
    return BaseListResponse(
        count=len(genomes),
        limit=100,
        offset=0,
        results=genomes,
    )


@router.get(
    "/service-info", summary="GA4GH service info", response_model=ServiceInfoResponse
)
async def service_info():
    """
    Returns information about this service, such as versions, name, etc.
    """
    all_versions = ComponentVersions(
        bedhost_version=bedhost_version,
        bbconf_version=bbconf_version,
        geniml_version=geniml_version,
        python_version=python_version(),
        openapi_version=get_openapi_version(app),
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
@count_requests(usage_data, event="files")
async def redirect_to_download(file_path: str, request: Request):
    download_url = f"https://data2.bedbase.org/{file_path}"
    return RedirectResponse(url=download_url)
