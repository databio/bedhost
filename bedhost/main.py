import uvicorn
import sys
from fastapi import FastAPI, Query, Form
from starlette.responses import FileResponse, RedirectResponse
from starlette.templating import Jinja2Templates
from starlette.requests import Request
from starlette.staticfiles import StaticFiles
from typing import Dict

import logmuse
import bbconf

from .const import *
from .helpers import *
global _LOGGER

app = FastAPI(
    title=PKG_NAME,
    description="BED file statistics and image server API",
    version=server_v
)
app.mount("/" + STATIC_DIRNAME, StaticFiles(directory=STATIC_PATH), name=STATIC_DIRNAME)
templates = Jinja2Templates(directory=TEMPLATES_PATH)


@app.get("/")
@app.get("/index")
async def root(request: Request):
    """
    Returns a landing page stating the number of bed files kept in database.
    Offers a database query constructor for the bed files.
    """
    global bbc
    vars = {"result": construct_search_data(bbc, bbc.search_bedfiles({"query": {"match_all": {}}})[0]['id']),
            "request": request,
            "num_files": bbc.count_bedfiles_docs(),
            "host_ip": bbc.server.host,
            "host_port": bbc.server.port,
            "openapi_version": get_openapi_version(app),
            "filters": get_search_setup(bbc)}
    return templates.TemplateResponse("main.html", dict(vars, **ALL_VERSIONS))


@app.get("/bed/" + RSET_API_ENDPOINT)
async def serve_bedfile_info(request: Request, id: str = None):
    global bbc
    json = bbc.search_bedfiles({"match": {"id": id}})[0]
    _LOGGER.debug("json: {}".format(json))
    if json:
        # we have a hit
        template_vars = {"request": request, "bed_id": id, "json": json,
                         "bedstat_output": bbc.path.bedstat_output,
                         "bed_url": RSET_ID_URL.format(bbc.server.host, id)}
        return templates.TemplateResponse("bedfile_splashpage.html", dict(template_vars, **ALL_VERSIONS))
    return {'error': 'no data found'}


@app.get("/" + RSET_API_ENDPOINT)
async def bedstat_serve(id: str = None, format: str = None):
    """
    Searches database backend for id and returns a page matching id with images and stats
    """
    global bbc
    json = bbc.search_bedfiles({"match": {"id": id}})[0]
    if json:
        # we have a hit
        if format == 'html':
            # serve the html splash page (redirect to a dedicated endpoint)
            return RedirectResponse(url="/bed/" + RSET_API_ENDPOINT + "?id=" + id)
        elif format == 'json':
            # serve the json retrieved from database
            return json
        elif format == 'bed':
            # serve raw bed file
            try:
                headers = {'Content-Disposition': 'attachment; filename={}'.
                    format(os.path.basename(json[BEDFILE_PATH_KEY]))}
                return FileResponse(json[BEDFILE_PATH_KEY], headers=headers, media_type='application/gzip')
            except Exception as e:
                return {'error': str(e)}
        else:
            return {'error': 'Unrecognized format for request, can be one of json, html and bed'}
    return {'error': 'no data found'}


@app.post("/bedfiles_filter_result")
async def bedfiles_filter_result(request: Request, json: Dict, html: bool = None):
    global bbc
    _LOGGER.info("Received query: {}".format(json))
    hits = bbc.search_bedfiles(json)
    _LOGGER.debug("response: {}".format(hits))
    ids = [hit["id"][0] for hit in hits]
    _LOGGER.info("{} matched ids: {}".format(len(ids), ids))
    if not html:
        return ids
    vars = {"request": request, "result": construct_search_data(bbc, ids), "openapi_version": get_openapi_version(app)}
    return templates.TemplateResponse("response_search.html", dict(vars, **ALL_VERSIONS))


def main():
    global _LOGGER
    global bbc
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        print("No subcommand given")
        sys.exit(1)
    logger_args = dict(name=PKG_NAME, fmt=LOG_FORMAT, level=5) \
        if args.debug else dict(name=PKG_NAME, fmt=LOG_FORMAT)
    _LOGGER = logmuse.setup_logger(**logger_args)
    bbc = bbconf.BedBaseConf(bbconf.get_bedbase_cfg(args.config))
    bbc.establish_elasticsearch_connection()
    if args.command == "serve":
        app.mount(bbc.path.bedstat_output, StaticFiles(directory=bbc.path.bedstat_output), name=BED_INDEX)
        _LOGGER.info("running {} app".format(PKG_NAME))
        uvicorn.run(app, host=bbc.server.host, port=bbc.server.port)
