import os

from fastapi import APIRouter
from fastapi.responses import FileResponse
from typing import Dict


from ..const import (
    STATIC_PATH,
    ALL_VERSIONS,
)
from ..helpers import get_openapi_version
from .. import _LOGGER
from ..main import bbc

router = APIRouter(prefix="/api", tags=["base"])


@router.get("/")
async def index():
    """
    Display the dummy index UI page
    """
    return FileResponse(os.path.join(STATIC_PATH, "index.html"))
