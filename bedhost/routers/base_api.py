try:
    from typing import Annotated, Dict, Optional, List, Any
except ImportError:
    from typing_extensions import Annotated
    from typing import Dict, Optional, List, Any

from fastapi import APIRouter

from bbconf.models.base_models import StatsReturn


from ..main import bbagent, app
from ..const import ALL_VERSIONS
from ..helpers import get_openapi_version
from ..data_models import ServiceInfoResponse

router = APIRouter(prefix="/v1", tags=["base"])


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
    all_versions = ALL_VERSIONS
    service_version = all_versions["bedhost_version"]
    all_versions.update({"openapi_version": get_openapi_version(app)})

    return ServiceInfoResponse(
        id="org.bedbase.api",
        name="BEDbase API",
        type={
            "group": "org.databio",
            "artifact": "bedbase",
            "version": service_version,
        },
        description="An API providing genomic interval data and metadata",
        organization={"name": "Databio Lab", "url": "https://databio.org"},
        contactUrl="https://github.com/databio/bedbase/issues",
        documentationUrl="https://bedbase.org",
        updatedAt="2023-10-25T00:00:00Z",
        environment="dev",
        version=service_version,
        component_versions=all_versions,
    )
