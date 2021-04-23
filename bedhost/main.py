import sys
from logging import DEBUG, INFO
from typing import Dict, List, Optional

import bbconf
import logmuse
import uvicorn
from bbconf import BedBaseConf
from fastapi import FastAPI, HTTPException, Path, Query
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse, RedirectResponse
from starlette.staticfiles import StaticFiles

from .const import *
from .data_models import DBResponse
from .helpers import *

global _LOGGER

app = FastAPI(
    title=PKG_NAME,
    description="BED file/sets statistics and image server API",
    version=server_v,
)

# uncomment below for development, to allow cross origin resource sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://dev1.bedbase.org",
        "http://data.bedbase.org",
        "http://bedbase.org",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
@app.get("/about")
@app.get("/bedsplash/{md5sum}", include_in_schema=False)
@app.get("/bedsetsplash/{md5sum}", include_in_schema=False)
@app.get("/index")
async def index():
    """
    Display the index UI page
    """
    return FileResponse(os.path.join(UI_PATH, "index.html"))


def main():
    global _LOGGER
    global bbc
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        print("No subcommand given")
        sys.exit(1)
    log_level = DEBUG if args.debug else INFO
    _LOGGER = logmuse.setup_logger(name=PKG_NAME, level=log_level)
    logmuse.init_logger(name="bbconf", level=log_level)
    bbc = BedBaseConf(bbconf.get_bedbase_cfg(args.config))
    bbc.bed.establish_postgres_connection()
    if args.command == "serve":
        from .routers import api, private_api

        app.include_router(api.router, prefix="/api")
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
                f"Using remote files for serving: "
                f"{bbc.config[CFG_REMOTE_KEY]['http']['prefix']}"
            )
        if os.path.exists(UI_PATH):
            _LOGGER.debug(f"Determined React UI path: {UI_PATH}")
        else:
            raise FileNotFoundError(f"React UI path to mount not found: {UI_PATH}")

        app.mount("/", StaticFiles(directory=UI_PATH))

        _LOGGER.info("running {} app".format(PKG_NAME))
        uvicorn.run(
            app,
            host=bbc.config[CFG_SERVER_KEY][CFG_HOST_KEY],
            port=bbc.config[CFG_SERVER_KEY][CFG_PORT_KEY],
        )
