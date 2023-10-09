from bedhost.main import bbc

from fastapi import APIRouter


search_router = APIRouter(prefix="/api/search", tags=["search"])


@search_router.get("/bed/{query}")
async def text_to_bed_search(query: str):
    return bbc.search_bed_by_text(query)


# Add more endpoints here
