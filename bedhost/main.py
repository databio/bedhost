import os
import sys
import uvicorn

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

import markdown
from fastapi.templating import Jinja2Templates
from bbconf.exceptions import (
    MissingObjectError,
    MissingThumbnailError,
    BEDFileNotFoundError,
    BedSetNotFoundError,
)


from . import _LOGGER
from .helpers import (
    configure,
    attach_routers,
    drs_response,
)
from .cli import build_parser
from ._version import __version__ as bedhost_version
from .const import (
    PKG_NAME,
    STATIC_PATH,
)


tags_metadata = [
    {
        "name": "home",
        "description": "General landing page and service info",
    },
    {
        "name": "base",
        "description": "Basic endpoints for the service and statistics.",
    },
    {
        "name": "objects",
        "description": "Download BED files or BEDSET files via [GA4GH DRS standard](https://ga4gh.github.io/data-repository-service-schemas/). For details, see [BEDbase Developer Guide](/docs/guide).",
    },
    {
        "name": "bed",
        "description": "Endpoints for retrieving metadata for BED records",
    },
    {
        "name": "bedset",
        "description": "Endpoints for retrieving metadata for BEDSET records",
    },
    {
        "name": "search",
        "description": "Discovery-oriented endpoints for finding records of interest",
    },
]

app = FastAPI(
    title=PKG_NAME,
    description="BED file/sets statistics and image server API",
    version=bedhost_version,
    docs_url="/docs",
    openapi_tags=tags_metadata,
)

origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5173",
    "https://bedbase.org",
    "*",  # allow cross-origin resource sharing, since this is a public API
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="bedhost/templates", autoescape=False)


@app.get("/", summary="API intro page", tags=["home"])
async def index(request: Request):
    """
    Display the index UI page
    """
    return render_markdown("index.md", request)


@app.get(
    "/docs/changelog",
    summary="Release notes",
    response_class=HTMLResponse,
    tags=["home"],
)
async def changelog(request: Request):
    return render_markdown("changelog.md", request)


def render_markdown(filename: str, request: Request):
    with open(os.path.join(STATIC_PATH, filename), "r", encoding="utf-8") as input_file:
        text = input_file.read()
    content = markdown.markdown(text)
    return templates.TemplateResponse(
        "page.html", {"request": request, "content": content}
    )


@app.exception_handler(MissingThumbnailError)
async def exc_handler_MissingThumbnailError(req: Request, exc: MissingThumbnailError):
    return drs_response(404, "No thumbnail for this object.")


@app.exception_handler(BEDFileNotFoundError)
async def exc_handler_BEDFileNotFoundError(req: Request, exc: BEDFileNotFoundError):
    return drs_response(404, "BED file not found.")


@app.exception_handler(BedSetNotFoundError)
async def exc_handler_BedSetNotFoundError(req: Request, exc: BedSetNotFoundError):
    return drs_response(404, "Bedset not found.")


@app.exception_handler(MissingObjectError)
async def exc_handler_BedSetNotFoundError(req: Request, exc: MissingObjectError):
    return drs_response(404, "Object not found.")


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

        global bbagent
        bbagent = configure(bbconf_file_path)
        attach_routers(app)
        uvicorn.run(
            app,
            host=bbagent.config.config.server.host,
            port=bbagent.config.config.server.port,
        )


if __name__ != "__main__":
    if os.environ.get("BEDBASE_CONFIG"):
        import logging

        _LOGGER.setLevel(logging.DEBUG)
        _LOGGER.info(f"Running {PKG_NAME} app...")
        bbconf_file_path = os.environ.get("BEDBASE_CONFIG") or None
        global bbagent
        bbagent = configure(
            bbconf_file_path
        )  # configure before attaching routers to avoid circular imports
        attach_routers(app)
    else:
        raise EnvironmentError(
            "No BEDBASE_CONFIG found. Can't configure server. Check documentation to create config file"
        )
