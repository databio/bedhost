try:
    from typing import Annotated, Dict, Optional, List, Any
except ImportError:
    from typing_extensions import Annotated
    from typing import Dict, Optional, List, Any

from fastapi import APIRouter

from bbconf.models.base_models import StatsReturn


from ..main import bbagent


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
