import logging
import sys
from typing import Dict, List, Optional

import bbconf
import coloredlogs
import uvicorn
from fastapi import FastAPI, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware

from bedhost import _LOGGER
from bedhost.cli import build_parser
from bedhost.const import (
    CFG_PATH_KEY,
    CFG_PATH_PIPELINE_OUTPUT_KEY,
    CFG_REMOTE_KEY,
    CFG_SERVER_HOST_KEY,
    CFG_SERVER_KEY,
    CFG_SERVER_PORT_KEY,
    STATIC_PATH,
    ALL_VERSIONS,
)
from bedhost.routers import bed_api, bedset_api
from fastapi import APIRouter, HTTPException, Path, Query, Request, Response
from bedhost.main import _LOGGER, app, bbc

from bedhost.helpers import *

router = APIRouter(prefix="/api", tags=["base"])


@router.get("/")
async def index():
    """
    Display the dummy index UI page
    """
    return FileResponse(os.path.join(STATIC_PATH, "index.html"))


@router.get("/versions", response_model=Dict[str, str])
async def get_version_info():
    """
    Returns app version information
    """
    versions = ALL_VERSIONS
    versions.update({"openapi_version": get_openapi_version(app)})
    return versions


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
