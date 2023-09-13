import bbconf
import logmuse

import sys
import uvicorn

from fastapi import FastAPI, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware
from logging import DEBUG, INFO
from typing import Dict, List, Optional

from . import _LOGGER
from .cli import build_parser
from .const import *
from .helpers import *

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
    "*"
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
async def text_to_bed_search(
    query: str = Query(..., description="Search query string")
):
    _LOGGER.info(f"Searching for: {query}")
    _LOGGER.info(f"Using backend: {bbc.t2bsi}")
    results = bbc.t2bsi.nl_vec_search(query, k=10)
    for result in results:
        # qdrant automatically adds hypens to the ids. remove them.
        result["metadata"] = bbc.bed.retrieve(result['id'].replace('-', ''))
        del result["vector"]  # no need to return the actual vectors
    return results


def attach_routers(app):
    _LOGGER.debug("Mounting routers")
    from .routers import bed_api, bedset_api, private_api

    app.include_router(bed_api.router)
    app.include_router(bedset_api.router)
    app.include_router(private_api.router, prefix="/_private_api")

    if not CFG_REMOTE_KEY in bbc.config:
        _LOGGER.debug(
            f"Using local files for serving: "
            f"{bbc.config[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY]}"
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


def register_globals(cfg):
    _LOGGER.debug("Registering uvicorn globals")
    import logging

    _LOGGER.setLevel(logging.DEBUG)
    stream = logging.StreamHandler(sys.stdout)
    stream.setLevel(logging.DEBUG)
    _LOGGER.addHandler(stream)

    global bbc
    _LOGGER.info("Get bedbase cfg...")
    bbc = BedHostConf(bbconf.get_bedbase_cfg(cfg))
    _LOGGER.info("finish getting bedbase cfg")


def main():
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        print("No subcommand given")
        sys.exit(1)

    log_level = DEBUG if args.debug else INFO
    _LOGGER = logmuse.setup_logger(name=PKG_NAME, level=log_level)
    logmuse.init_logger(name="bbconf", level=log_level)

    register_globals(args.config)

    if args.command == "serve":
        attach_routers(app)
        _LOGGER.info(f"Running {PKG_NAME} app...")
        uvicorn.run(
            app,
            host=bbc.config[CFG_SERVER_KEY][CFG_HOST_KEY],
            port=bbc.config[CFG_SERVER_KEY][CFG_PORT_KEY],
        )


if __name__ != "__main__":
    # Establish global config when running through uvicorn CLI
    if os.environ.get("BEDBASE_CONFIG"):
        register_globals(os.environ.get("BEDBASE_CONFIG"))
        attach_routers(app)
    else:
        _LOGGER.warning("No BEDBASE_CONFIG found. Can't configure server.")
