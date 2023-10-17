import coloredlogs
import logging
import os
import sys
import uvicorn

from . import _LOGGER
import bedhost.dependencies as dependencies
from .helpers import FileResponse, configure, attach_routers

from .cli import build_parser
from .const import (
    CFG_PATH_KEY,
    CFG_PATH_PIPELINE_OUTPUT_KEY,
    CFG_REMOTE_KEY,
    CFG_SERVER_HOST_KEY,
    CFG_SERVER_KEY,
    CFG_SERVER_PORT_KEY,
    PKG_NAME,
    STATIC_PATH,
    SERVER_VERSION,
)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title=PKG_NAME,
    description="BED file/sets statistics and image server API",
    version=SERVER_VERSION,
    docs_url="/docs",
)

origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5173",
    "https://bedbase.org",
    "*", # allow cross origin resource sharing, since this is a public API
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def index():
    """
    Display the dummy index UI page
    """
    return FileResponse(os.path.join(STATIC_PATH, "index.html"))

@app.get("/test", response_model=int)
async def get_bedfile_count():
    """
    Returns the number of bedfiles available in the database
    """
    return int(bbc.bed.record_count)

def main():
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        print("No subcommand given")
        sys.exit(1)

    if args.command == "serve":
        _LOGGER.info(f"Running {PKG_NAME} app...")
        bbconf_file_path = args.config or os.environ.get("BEDBASE_CONFIG") or None
        global bbc
        bbc = configure(bbconf_file_path)
        attach_routers(app)
        uvicorn.run(
            app,
            host=bbc.config[CFG_SERVER_KEY][CFG_SERVER_HOST_KEY],
            port=bbc.config[CFG_SERVER_KEY][CFG_SERVER_PORT_KEY],
        )


if __name__ != "__main__":
    if os.environ.get("BEDBASE_CONFIG"):
        bbconf_file_path = os.environ.get("BEDBASE_CONFIG") or None
        # must be configured before attaching routers to avoid circular imports
        global bbc
        bbc = configure(bbconf_file_path)  
        attach_routers(app)
    else:
        raise EnvironmentError(
            "No BEDBASE_CONFIG found. Can't configure server. Check documentation to create config file"
        )
