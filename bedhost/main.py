import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

import markdown
import uvicorn
from apscheduler.schedulers.background import BackgroundScheduler
from bbconf.exceptions import (
    BEDFileNotFoundError,
    BedSetNotFoundError,
    MissingObjectError,
    MissingThumbnailError,
)
from bedboss.refgenome_validator.main import ReferenceValidator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates

from . import _LOGGER
from ._version import __version__ as bedhost_version
from .cli import build_parser
from .const import PKG_NAME, STATIC_PATH, USAGE_SAVE_HOURS
from .helpers import (
    attach_routers,
    configure,
    drs_response,
    init_model_usage,
    upload_usage,
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.

    Startup:
      - Read BEDBASE_CONFIG from env (raise EnvironmentError if missing).
      - Build the BedBaseAgent, UsageModel, and ReferenceValidator.
      - Stash them on app.state for dependency injection.
      - Start the BackgroundScheduler that periodically flushes usage data.

    Shutdown:
      - Stop the scheduler so it does not leak across reloads.
    """
    bbconf_file_path = os.environ.get("BEDBASE_CONFIG")
    if not bbconf_file_path:
        raise EnvironmentError(
            "No BEDBASE_CONFIG found. Can't configure server. "
            "Check documentation to create config file"
        )

    _LOGGER.info(f"Running {PKG_NAME} app...")
    app.state.bbagent = configure(bbconf_file_path)
    app.state.usage_data = init_model_usage()

    # Respect BEDHOST_INIT_ML for CI/smoke deployments that don't need the
    # reference genome validator loaded. Default is to initialize it.
    init_ml_env = os.environ.get("BEDHOST_INIT_ML", "true").lower()
    if init_ml_env in ("0", "false", "no"):
        _LOGGER.info(
            "BEDHOST_INIT_ML=false; skipping ReferenceValidator initialization."
        )
        app.state.ref_validator = None
    else:
        _LOGGER.info("Initializing reference genome validator...")
        app.state.ref_validator = ReferenceValidator()

    scheduler = BackgroundScheduler()
    scheduler.add_job(
        upload_usage,
        "interval",
        hours=USAGE_SAVE_HOURS,
        args=(app.state.bbagent, app.state.usage_data),
    )
    scheduler.start()
    app.state.scheduler = scheduler

    try:
        yield
    finally:
        app.state.scheduler.shutdown(wait=False)


app = FastAPI(
    title=PKG_NAME,
    description="BED file/sets statistics and image server API",
    version=bedhost_version,
    docs_url="/v1/docs",
    openapi_tags=tags_metadata,
    lifespan=lifespan,
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

templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))
templates.env.autoescape = False


@app.get("/v1", summary="API intro page", tags=["home"])
async def index(request: Request):
    """
    Display the index UI page
    """
    return render_markdown("index.md", request)


@app.get(
    "/v1/docs/changelog",
    summary="Release notes",
    response_class=HTMLResponse,
    tags=["home"],
)
async def changelog(request: Request):
    return render_markdown("changelog.md", request)


@app.get("/")
def lending_page():
    return RedirectResponse(url="v1/")


def render_markdown(filename: str, request: Request):
    with open(os.path.join(STATIC_PATH, filename), "r", encoding="utf-8") as input_file:
        text = input_file.read()
    content = markdown.markdown(text)
    return templates.TemplateResponse(request, "page.html", {"content": content})


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
async def exc_handler_MissingObjectError(req: Request, exc: MissingObjectError):
    return drs_response(404, "Object not found.")


# Router endpoints use Depends() to resolve bbagent/usage_data/ref_validator
# from app.state at request time, so attaching at module import is safe
# regardless of lifespan ordering.
attach_routers(app)


def main():
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        print("No subcommand given")
        sys.exit(1)

    if args.command == "serve":
        bbconf_file_path = args.config or os.environ.get("BEDBASE_CONFIG") or None
        if bbconf_file_path:
            os.environ["BEDBASE_CONFIG"] = bbconf_file_path

        # Load config once just to pull host/port out. Lifespan will rebuild
        # the agent in the uvicorn worker process.
        bbagent = configure(bbconf_file_path)
        host = bbagent.config.config.server.host
        port = bbagent.config.config.server.port

        _LOGGER.info(f"Running {PKG_NAME} app on {host}:{port}...")
        uvicorn.run(
            "bedhost.main:app",
            host=host,
            port=port,
        )
