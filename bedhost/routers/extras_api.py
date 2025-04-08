try:
    from typing import Annotated, Any, Dict, List, Optional
except ImportError:
    from typing_extensions import Annotated
    from typing import Dict, Optional, List, Any

from bbconf.models.extras_models import (
    ExtraFilesResults,
    FileModel,
)
from fastapi import APIRouter, HTTPException

from ..main import bbagent

router = APIRouter(prefix="/v1/extra", tags=["extras"])


@router.get(
    "/search",
    summary="Search for extra files in the database",
    response_model=ExtraFilesResults,
)
async def search_for_extra_files(
    query: Optional[str] = None, limit: int = 10, offset: int = 0
):
    """
    Get extra files from the database.
    """
    result = bbagent.extras.search_files(query=query, limit=limit, offset=offset)
    return result


@router.get(
    "/file/{file_id}",
    summary="Get extra file by ID ('name')",
    response_model=FileModel,
)
async def get_extra_file_by_id(
    file_id: Annotated[str, "The ID of the extra file to retrieve"],
):
    """
    Get extra file by ID ('name')
    """
    try:
        result = bbagent.extras.get(file_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    return result
