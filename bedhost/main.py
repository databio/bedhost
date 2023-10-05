import sys

import logging
import coloredlogs
from typing import Dict, List, Optional

import uvicorn

import bbconf

from fastapi import FastAPI, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware

from bedhost.cli import build_parser
from bedhost.const import (
    CFG_PATH_KEY,
    CFG_REMOTE_KEY,
    CFG_SERVER_KEY,
    CFG_PATH_PIPELINE_OUTPUT_KEY,
    CFG_SERVER_HOST_KEY,
    CFG_SERVER_PORT_KEY,
)
from bedhost.helpers import *
from bedhost import _LOGGER

_LOGGER_BEDHOST = logging.getLogger("uvicorn.access")
coloredlogs.install(
    logger=_LOGGER_BEDHOST,
    level=logging.INFO,
    datefmt="%b %d %Y %H:%M:%S",
    fmt="[%(levelname)s] [%(asctime)s] [BEDHOST] %(message)s",
)


app = FastAPI(
    title=PKG_NAME,
    description="BED file/sets statistics and image server API",
    version=server_v,
)

origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5173",
    "https://bedbase.org",
    "*",
]

# uncomment below for development, to allow cross origin resource sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# misc endpoints
@app.get("/")
async def index():
    """
    Display the dummy index UI page
    """
    return FileResponse(os.path.join(STATIC_PATH, "index.html"))


@app.get("/versions", response_model=Dict[str, str])
async def get_version_info():
    """
    Returns app version information
    """
    versions = ALL_VERSIONS
    versions.update({"openapi_version": get_openapi_version(app)})
    return versions


@app.get("/search/{query}")
async def text_to_bed_search(query):
    _LOGGER.info(f"Searching for: {query}")
    _LOGGER.info(f"Using backend: {bbc.t2bsi}")
    results = bbc.t2bsi.nl_vec_search(query, k=10)
    for result in results:
        # qdrant automatically adds hypens to the ids. remove them.
        result["metadata"] = bbc.bed.retrieve(result["id"].replace("-", ""))
        del result["vector"]  # no need to return the actual vectors
    return results


# @app.post("/search/bed")
# async def bed_to_bed_search(
#     file
# ):
#     search_vector = ...
#     return bbc.t2bsi.search_backend.search(search_vector, k)


def attach_routers(app):
    _LOGGER.debug("Mounting routers")
    from .routers import bed_api, bedset_api, private_api

    app.include_router(bed_api.router)
    app.include_router(bedset_api.router)
    app.include_router(private_api.router, prefix="/_private_api")

    if not CFG_REMOTE_KEY in bbc.config:
        _LOGGER.debug(
            f"Using local files for serving: "
            f"{bbc.config[CFG_PATH_KEY][CFG_PATH_PIPELINE_OUTPUT_KEY]}"
        )
        app.mount(
            bbc.get_bedstat_output_path(),
            StaticFiles(directory=bbc.get_bedstat_output_path()),
            name=BED_TABLE,
        )
        app.mount(
            bbc.get_bedbuncher_output_path(),
            StaticFiles(directory=bbc.get_bedbuncher_output_path()),
            name=BEDSET_TABLE,
        )
    else:
        _LOGGER.debug(
            f"Using remote files for serving. Prefix: {bbc.config[CFG_REMOTE_KEY]['http']['prefix']}"
        )


def register_globals(cfg: str) -> None:
    """
    TODO: what does it meand?
    """
    _LOGGER.debug("Registering uvicorn globals")

    _LOGGER.setLevel(logging.DEBUG)
    stream = logging.StreamHandler(sys.stdout)
    stream.setLevel(logging.DEBUG)
    _LOGGER.addHandler(stream)

    global bbc
    _LOGGER.info("Getting bedbase cfg...")
    bbc = BedHostConf(bbconf.get_bedbase_cfg(cfg))
    _LOGGER_BEDHOST.info("Finish getting bedbase cfg")


def main():
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        print("No subcommand given")
        sys.exit(1)

    register_globals(args.config)

    if args.command == "serve":
        attach_routers(app)
        _LOGGER.info(f"Running {PKG_NAME} app...")
        uvicorn.run(
            app,
            host=bbc.config[CFG_SERVER_KEY][CFG_SERVER_HOST_KEY],
            port=bbc.config[CFG_SERVER_KEY][CFG_SERVER_PORT_KEY],
        )


if __name__ != "__main__":
    # Establish global config when running through uvicorn CLI
    if os.environ.get("BEDBASE_CONFIG"):
        register_globals(os.environ.get("BEDBASE_CONFIG"))
        attach_routers(app)
    else:
        raise EnvironmentError(
            "No BEDBASE_CONFIG found. Can't configure server. Check documentation to create config file"
        )
