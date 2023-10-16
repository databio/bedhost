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
