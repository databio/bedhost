from fastapi import APIRouter

from .. import _LOGGER
from ..main import bbc

search_router = APIRouter(prefix="/api/search", tags=["search"])

@search_router.get("/bed/{query}")
async def text_to_bed_search(query):
    _LOGGER.info(f"Searching for: {query}")
    _LOGGER.info(f"Using backend: {bbc.t2bsi}")
    results = bbc.t2bsi.nl_vec_search(query, k=10)
    for result in results:
        # qdrant automatically adds hypens to the ids. remove them.
        result["metadata"] = bbc.bed.retrieve(result["id"].replace("-", ""))
        del result["vector"]  # no need to return the actual vectors
    return results
