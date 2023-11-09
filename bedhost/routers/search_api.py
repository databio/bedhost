from fastapi import APIRouter

from pipestat.exceptions import RecordNotFoundError

from .. import _LOGGER
from ..main import bbc

search_router = APIRouter(prefix="/search", tags=["search"])


@search_router.get("/bed/{query}")
async def text_to_bed_search(query, number_of_results: int = 10):
    _LOGGER.info(f"Searching for: {query}")
    _LOGGER.info(f"Using backend: {bbc.t2bsi}")
    results = bbc.t2bsi.nl_vec_search(query, k=number_of_results)
    for result in results:
        del result["vector"]  # no need to return the actual vectors
        try:
            # qdrant automatically adds hypens to the ids. remove them.
            result["metadata"] = bbc.bed.retrieve_one(result["id"].replace("-", ""))
        except RecordNotFoundError:
            _LOGGER.info(
                f"Couldn't find qdrant result in bedbase for id: {result['id']}"
            )
    return results
