try:
    from typing import Annotated, Dict, Optional, List, Any
except ImportError:
    from typing_extensions import Annotated
    from typing import Dict, Optional, List, Any

from fastapi import APIRouter

from bbconf.models.base_models import StatsReturn
from platform import python_version
from bbconf import __version__ as bbconf_version
from geniml import __version__ as geniml_version

from ..main import bbagent, app
from ..helpers import get_openapi_version
from ..data_models import (
    ServiceInfoResponse,
    Type,
    Organization,
    ComponentVersions,
    EmbeddingModels,
)
from .._version import __version__ as bedhost_version

router = APIRouter(prefix="/v1", tags=["base"])

packages_versions = {}


@router.get(
    "/stats",
    summary="Get summary statistics for the DRS object store",
    response_model=StatsReturn,
)
async def get_bedbase_db_stats():
    """
    Returns statistics
    """
    return bbagent.get_stats()


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
            vec2vec=bbagent.config.config.path.vec2vec,
            region2vec=bbagent.config.config.path.region2vec,
            text2vec=bbagent.config.config.path.text2vec,
        ),
    )
