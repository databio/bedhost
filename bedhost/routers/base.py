import os

from typing import Dict

from bedhost.const import (
    STATIC_PATH,
    ALL_VERSIONS,
)
from fastapi import APIRouter
from fastapi.responses import FileResponse
from bedhost.main import _LOGGER
from bedhost.helpers import get_openapi_version
from bedhost.dependencies import get_bbconf

bbc = get_bbconf()

router = APIRouter(prefix="/api", tags=["base"])


@router.get("/")
async def index():
    """
    Display the dummy index UI page
    """
    return FileResponse(os.path.join(STATIC_PATH, "index.html"))


@router.get("/search/{query}")
async def text_to_bed_search(query):
    _LOGGER.info(f"Searching for: {query}")
    _LOGGER.info(f"Using backend: {bbc.t2bsi}")
    results = bbc.t2bsi.nl_vec_search(query, k=10)
    for result in results:
        # qdrant automatically adds hypens to the ids. remove them.
        result["metadata"] = bbc.bed.retrieve(result["id"].replace("-", ""))
        del result["vector"]  # no need to return the actual vectors
    return results
