import uvicorn
from fastapi import FastAPI, Query, Form
from starlette.responses import FileResponse, RedirectResponse
from starlette.templating import Jinja2Templates
from starlette.requests import Request
from starlette.staticfiles import StaticFiles
from typing import Dict

import logmuse
import bbconf

from .const import *
from .config import *
from .elastic import *
from .helpers import build_parser, get_openapi_version, compose_result_response
global _LOGGER

app = FastAPI(
    title="bedhost",
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
    vars = {"result": compose_result_response(bbc, bbc.search_bedfiles({"query": {"match_all": {}}})[0]['id']),
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
    if json:
        # we have a hit
        template_vars = {"request": request, "bed_id": id, "js": json,
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
            return RedirectResponse(url="/bed/" + RSET_API_ENDPOINT + "?id=" + id)
        elif format == 'json':
            # serve the json retrieved from database
            return json
        elif format == 'bed':
            # serve raw bed file
            # construct the path for the file holding the path of the raw bed file
            try:
                headers = {'Content-Disposition': 'attachment; filename={}'.
                    format(os.path.basename(json[BEDFILE_PATH_KEY]))}
                return FileResponse(json[BEDFILE_PATH_KEY], headers=headers, media_type='application/gzip')
            except Exception as e:
                return {'error': str(e)}
        else:
            return {'error': 'Unrecognized format for request, can be one of json, html and bed'}
    return {'error': 'no data found'}


def get_search_setup(bbc):
    """
    Create a query setup for a Jinja2 template.
    The setup is used ot populate a queryBuilder in a JavaScript code.

    :param bbconf.BedBaseConf bbc: bedbase configuration object
    :return list[dict]: a list dictionaries with search setup to populate the JavaScript code with
    """
    mapping = bbc.get_bedfiles_mapping()
    attrs = list(mapping.keys())
    setup_dicts = []
    for attr in attrs:
        try:
            attr_type = mapping[attr]["type"]
        except KeyError:
            _LOGGER.warning("Attribute '{}' does not have type defined. "
                            "Is it a nested mapping?".format(attr))
            continue
        setup_dicts.append({"id": attr,
                            "label": attr.replace("_", " "),
                            "type": TYPES_MAPPING[attr_type],
                            "validation": VALIDATIONS_MAPPING[attr_type],
                            "operators": OPERATORS_MAPPING[attr_type]
                            })
    _LOGGER.debug("search setup: {}".format(setup_dicts))
    return setup_dicts


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
    vars = {"request": request, "result": compose_result_response(bbc, ids), "openapi_version": get_openapi_version(app)}
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
        _LOGGER.info("running bedhost app")
        uvicorn.run(app, host="0.0.0.0", port=args.port)
