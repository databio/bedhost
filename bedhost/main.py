import os
import sys
import uvicorn

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from typing import Dict
from urllib.parse import urlparse
from fastapi import Response, HTTPException

from bbconf.exceptions import *
from pipestat.exceptions import RecordNotFoundError, ColumnNotFoundError


from . import _LOGGER
from .helpers import (
    FileResponse,
    configure,
    attach_routers,
    get_openapi_version,
    drs_response,
)
from .cli import build_parser
from .const import (
    ALL_VERSIONS,
    CFG_SERVER_HOST_KEY,
    CFG_SERVER_KEY,
    CFG_SERVER_PORT_KEY,
    PKG_NAME,
    STATIC_PATH,
    SERVER_VERSION,
)

tags_metadata = [
    {
        "name": "home",
        "description": "General landing page and service info",
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
    version=SERVER_VERSION,
    docs_url="/docs",
    openapi_tags=tags_metadata,
)

origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5173",
    "https://bedbase.org",
    "*",  # allow cross origin resource sharing, since this is a public API
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import markdown 
from fastapi.templating import Jinja2Templates
templates = Jinja2Templates(directory="bedhost/templates", autoescape=False)

@app.get("/", summary="API intro page", tags=["home"])
async def index(request: Request):
    """
    Display the index UI page
    """
    return render_markdown("index.md", request)


@app.get("/docs/changelog", summary="Release notes", response_class=HTMLResponse, tags=["home"])
async def changelog(request: Request):
    return render_markdown("changelog.md", request)

@app.get("/docs/guide", summary="Developer guide", response_class=HTMLResponse, tags=["home"])
async def guide(request: Request):
    return render_markdown("guide.md", request)

def render_markdown(filename: str, request: Request):
    with open(os.path.join(STATIC_PATH, filename), "r", encoding="utf-8") as input_file:
        text = input_file.read()
    content = markdown.markdown(text)
    return templates.TemplateResponse("page.html", {"request": request, "content": content})


@app.get("/service-info", summary="GA4GH service info", tags=["home"])
async def service_info():
    """
    Returns information about this service, such as versions, name, etc.
    """
    all_versions = ALL_VERSIONS
    service_version = all_versions["bedhost_version"]
    all_versions.update({"openapi_version": get_openapi_version(app)})
    ret = {
        "id": "org.bedbase.api",
        "name": "BEDbase API",
        "type": {
            "group": "org.databio",
            "artifact": "bedbase",
            "version": service_version,
        },
        "description": "An API providing genomic interval data and metadata",
        "organization": {"name": "Databio Lab", "url": "https://databio.org"},
        "contactUrl": "https://github.com/databio/bedbase/issues",
        "documentationUrl": "https://bedbase.org",
        "updatedAt": "2023-10-25T00:00:00Z",
        "environment": "dev",
        "version": service_version,
        "component_versions": all_versions,
    }
    return JSONResponse(content=ret)

@app.get(
    "/objects/{object_id}",
    summary="Get DRS object metadata",
    tags=["objects"],
)
async def get_drs_object_metadata(object_id: str, req: Request):
    """
    Returns metadata about a DrsObject.
    """
    ids = parse_bedbase_drs_object_id(object_id)
    base_uri = urlparse(str(req.url)).netloc
    return bbc.get_drs_metadata(
        ids["record_type"], ids["record_id"], ids["result_id"], base_uri
    )


@app.get(
    "/objects/{object_id}/access/{access_id}",
    summary="Get URL where you can retrieve files",
    tags=["objects"],
)
async def get_object_bytes_url(object_id: str, access_id: str):
    """
    Returns a URL that can be used to fetch the bytes of a DrsObject.
    """
    ids = parse_bedbase_drs_object_id(object_id)
    return bbc.get_object_uri(
        ids["record_type"], ids["record_id"], ids["result_id"], access_id
    )


@app.head(
    "/objects/{object_id}/access/{access_id}/bytes", include_in_schema=False
)  # Required by UCSC track hubs
@app.get(
    "/objects/{object_id}/access/{access_id}/bytes",
    summary="Download actual files",
    tags=["objects"],
)
async def get_object_bytes(object_id: str, access_id: str):
    """
    Returns the bytes of a DrsObject.
    """
    ids = parse_bedbase_drs_object_id(object_id)
    return bbc.serve_file(
        bbc.get_object_uri(
            ids["record_type"], ids["record_id"], ids["result_id"], access_id
        )
    )


@app.get(
    "/objects/{object_id}/access/{access_id}/thumbnail",
    summary="Download thumbnail",
    tags=["objects"],
)
async def get_object_thumbnail(object_id: str, access_id: str):
    """
    Returns the bytes of a thumbnail of a DrsObject
    """
    ids = parse_bedbase_drs_object_id(object_id)
    return bbc.serve_file(
        bbc.get_thumbnail_uri(
            ids["record_type"], ids["record_id"], ids["result_id"], access_id
        )
    )


# DRS-compatible API.
# Requires using `object_id` which has the form: `<record_type>.<record_id>.<object_class>`
# for example: `bed.326d5d77c7decf067bd4c7b42340c9a8.bedfile`
# or: `bed.421d2128e183424fcc6a74269bae7934.bedfile`
# bed.326d5d77c7decf067bd4c7b42340c9a8.bedfile
# bed.326d5d77c7decf067bd4c7b42340c9a8.bigbed
def parse_bedbase_drs_object_id(object_id: str):
    """
    Parse bedbase object id into its components
    """
    try:
        record_type, record_id, result_id = object_id.split(".")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Object ID {object_id} is malformed. Should be of the form <record_type>.<record_id>.<result_id>",
        )
    if record_type not in ["bed", "bedset"]:
        raise HTTPException(
            status_code=400, detail=f"Object type {record_type} is incorrect"
        )
    return {
        "record_type": record_type,
        "record_id": record_id,
        "result_id": result_id,
    }


# General-purpose exception handlers (so we don't have to write try/catch blocks in every endpoint)

@app.exception_handler(MissingThumbnailError)
async def exc_handler_MissingThumbnailError(req: Request, exc: MissingThumbnailError):
    return drs_response(404, "No thumbnail for this object.")


@app.exception_handler(BadAccessMethodError)
async def exc_handler_BadAccessMethodError(req: Request, exc: BadAccessMethodError):
    return drs_response(404, "Requested access URL was not found.")


@app.exception_handler(ColumnNotFoundError)
async def exc_handler_ColumnNotFoundError(req: Request, exc: ColumnNotFoundError):
    _LOGGER.error(f"ColumnNotFoundError: {exc}")
    return drs_response(404, "Malformed result identifier.")


@app.exception_handler(RecordNotFoundError)
async def exc_handler_RecordNotFoundError(req: Request, exc: RecordNotFoundError):
    return drs_response(404, "Record not found.")


@app.exception_handler(MissingObjectError)
async def exc_handler_MissingObjectError(req: Request, exc: MissingObjectError):
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
        global bbc
        bbc = configure(bbconf_file_path, app)
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
        bbc = configure(bbconf_file_path, app)
        attach_routers(app)
    else:
        raise EnvironmentError(
            "No BEDBASE_CONFIG found. Can't configure server. Check documentation to create config file"
        )
