import uvicorn
import sys
from fastapi import FastAPI, HTTPException
from starlette.responses import FileResponse, RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
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
app.add_middleware(SessionMiddleware, secret_key="bedbase")
templates = Jinja2Templates(directory=TEMPLATES_PATH)


@app.get("/")
@app.get("/index", name="index")
async def root(request: Request):
    """
    Returns a landing page stating the number of bed files kept in database.
    Offers a database query constructor for the bed files.
    """
    global bbc
    if CUR_RESULT not in request.session:
        _LOGGER.debug("Creating sample result")
        hits = bbc.search_bedfiles(INIT_ELASTIC)
        md5sums = {hit[JSON_ID_KEY][0]: hit[JSON_MD5SUM_KEY][0] for hit in hits}
        current_result = construct_search_data(md5sums, request)
        request.session.update({CUR_RESULT: current_result})
    if CUR_RULES not in request.session:
        _LOGGER.debug("Creating sample filter rules")
        request.session.update({CUR_RULES: INIT_QUERYBUILDER})
    vars = {"result": request.session[CUR_RESULT],
            "request": request,
            "num_bedfiles": bbc.count_bedfiles_docs(),
            "num_bedsets": bbc.count_bedsets_docs(),
            "host_ip": bbc[CFG_SERVER_KEY][CFG_HOST_KEY],
            "host_port": bbc.server.port,
            "openapi_version": get_openapi_version(app),
            "filters": get_search_setup(bbc),
            "bedset_urls": get_all_bedset_urls_mapping(bbc, request),
            "bbc": bbc}
    return templates.TemplateResponse("main.html", dict(vars, **ALL_VERSIONS))


@app.get("/bed/" + BEDFILE_API_ENDPOINT, name="bedsplash")
async def serve_bedfile_info(request: Request, md5sum: str = None):
    global bbc
    json = bbc.search_bedfiles({"match": {JSON_MD5SUM_KEY: md5sum}})[0]
    _LOGGER.debug("json: {}".format(json))
    if json:
        # we have a hit
        template_vars = {"request": request, "json": json,
                         "bedstat_output": bbc[CFG_PATH_KEY][CFG_PIP_OUTPUT_KEY],
                         "openapi_version": get_openapi_version(app),
                         "bed_url": get_param_url(request.url_for("bedfile"), {"md5sum": md5sum}),
                         "descs": JSON_DICTS_KEY_DESCS}
        return templates.TemplateResponse("bedfile_splashpage.html", dict(template_vars, **ALL_VERSIONS))
    raise HTTPException(status_code=404, detail="BED file not found")


@app.get("/bedset/" + BEDSET_API_ENDPOINT, name="bedsetsplash")
async def serve_bedset_info(request: Request, md5sum: str = None):
    global bbc
    json = bbc.search_bedsets({"match": {JSON_MD5SUM_KEY: md5sum}})[0]
    _LOGGER.debug("json: {}".format(json))
    if json:
        # we have a hit
        bed_urls = {id: get_param_url(request.url_for("bedsplash"), {"md5sum": md5sum})
                    for id, md5sum in json[JSON_BEDSET_BED_IDS_KEY][0].items()} \
            if JSON_BEDSET_BED_IDS_KEY in json else None
        template_vars = {"request": request, "json": json,
                         "bedstat_output": bbc[CFG_PATH_KEY][CFG_PIP_OUTPUT_KEY],
                         "openapi_version": get_openapi_version(app),
                         "bedset_url": get_param_url(request.url_for("bedset"), {"md5sum": md5sum}),
                         "descs": JSON_DICTS_KEY_DESCS,
                         "bedset_stats_table_url": request.url_for("bedset_stats_table", **{"bedset_md5sum": md5sum}),
                         "bed_urls": bed_urls}
        return templates.TemplateResponse("bedset_splashpage.html", dict(template_vars, **ALL_VERSIONS))
    raise HTTPException(status_code=404, detail="BED set not found")


@app.get("/" + BEDFILE_API_ENDPOINT, name="bedfile")
async def bedfile_serve(request: Request, md5sum: str = None, format: str = None):
    """
    Searches database backend for id and returns a page matching id with images and stats
    """
    global bbc
    json = bbc.search_bedfiles({"match": {JSON_MD5SUM_KEY: md5sum}})[0]
    if json:
        # we have a hit
        if format == 'html':
            # serve the html splash page (redirect to a dedicated endpoint)
            return RedirectResponse(url=get_param_url(request.url_for("bedsplash"), {"md5sum": md5sum}))
        elif format == 'json':
            # serve the json retrieved from database
            return json
        elif format == 'bed':
            # serve raw bed file
            bed_path = json[BEDFILE_PATH_KEY][0]
            bed_target = get_mounted_symlink_path(bed_path) \
                if os.path.islink(bed_path) else bed_path
            _LOGGER.debug("Determined BED file path: {}".format(bed_target))
            if not os.path.exists(bed_target):
                raise HTTPException(status_code=404, detail="BED file not found")
            try:
                return FileResponse(bed_target, filename=os.path.basename(bed_path),
                                    media_type='application/gzip')
            except Exception as e:
                return {'error': str(e)}
        else:
            raise HTTPException(status_code=400, detail="Bad request: Unrecognized format for request, "
                                                        "can be one of json, html and bed")
    raise HTTPException(status_code=404, detail="BED file not found")


@app.get("/" + BEDSET_API_ENDPOINT, name="bedset")
async def bedset_serve(request: Request, md5sum: str = None, format: str = None):
    """
    Searches database backend for id and returns a page matching id with images and stats
    """
    # TODO: create a generic endpoint that BEDSET_API_ENDPOINT
    #  and BEDFILE_API_ENDPOINT can build on since they are similar

    # mapping of gzip formats and json keys to paths to files to serve upon request
    rtm = {"igd": JSON_BEDSET_IGD_DB_KEY,
           "pep": JSON_BEDSET_PEP_KEY,
           "csv": JSON_BEDSET_GD_STATS_KEY,
           "csv-all": JSON_BEDSET_BEDFILES_GD_STATS_KEY}

    def _gz_file_response(format, resp_type_map=rtm):
        key = resp_type_map[format]
        if key in json and os.path.exists(json[key][0]):
            f = json[key][0]
            _LOGGER.debug("Determined {} path: {}".format(format, f))
            return FileResponse(f, filename=os.path.basename(f),
                                media_type='application/gzip')
        else:
            raise HTTPException(status_code=404,
                                detail="{} for this BED set not found".format(format))
    global bbc
    json = bbc.search_bedsets({"match": {JSON_MD5SUM_KEY: md5sum}})[0]
    if json:
        # we have a hit
        if format == 'html':
            # serve the html splash page (redirect to a dedicated endpoint)
            return RedirectResponse(url=get_param_url(request.url_for("bedsetsplash"), {"md5sum": md5sum}))
        elif format == 'json':
            # serve the json retrieved from database
            return json
        elif format == 'bed':
            # serve raw bed file
            bedset_path = json[JSON_BEDSET_TAR_PATH_KEY][0]
            bedset_target = get_mounted_symlink_path(bedset_path) \
                if os.path.islink(bedset_path) else bedset_path
            _LOGGER.debug("Determined BED set path: {}".format(bedset_target))
            if not os.path.exists(bedset_target):
                raise HTTPException(status_code=404, detail="BED set not found")
            return FileResponse(bedset_target, filename=os.path.basename(bedset_path),
                                media_type='application/gzip')
        elif format in rtm.keys():
            return _gz_file_response(format)
        else:
            raise HTTPException(status_code=400,
                                detail="Bad request: Unrecognized format for request. "
                                       "It must be one of: html, json, bed, {}".format(", ".join(rtm.keys())))
    else:
        raise HTTPException(status_code=404, detail="BED set not found")


@app.post("/bedfiles_filter_result")
async def bedfiles_filter_result(request: Request, json: Dict, html: bool = None):
    global bbc
    _LOGGER.debug("Received query: {}".format(json))
    if "current" in json["elastic"].keys():
        # special kind of query, to serve the latest results
        if html:
            _LOGGER.debug("Serving current result")
            vars = {"request": request, "result": request.session[CUR_RESULT],
                    "openapi_version": get_openapi_version(app)}
            return templates.TemplateResponse("response_search.html",
                                              dict(vars, **ALL_VERSIONS))
    hits = bbc.search_bedfiles(json["elastic"])
    _LOGGER.debug("response: {}".format(hits))
    md5sums = {hit[JSON_ID_KEY][0]: hit[JSON_MD5SUM_KEY][0] for hit in hits}
    _LOGGER.info("{} matched files: {}".format(len(md5sums), md5sums))
    if not html:
        return md5sums
    current_result = construct_search_data(md5sums, request)
    request.session.update({CUR_RESULT: current_result})
    request.session.update({CUR_RULES: json["rules"]})
    vars = {"request": request, "result": current_result,
            "openapi_version": get_openapi_version(app)}
    return templates.TemplateResponse("response_search.html", dict(vars, **ALL_VERSIONS))


@app.get("/serve_rules")
async def serve_rules(request: Request):
    return request.session[CUR_RULES]


@app.get("/bedfiles_stats/{bedset_md5sum}", name="bedset_stats_table")
async def bedfiles_stats(request: Request, bedset_md5sum: str):
    global bbc
    import pandas as pd
    link_str = "<a href='{}'>{}</a>"
    bedset_doc = bbc.get_bedsets_doc(doc_id=bedset_md5sum)
    bedfiles_csv = bedset_doc["_source"][JSON_BEDSET_BEDFILES_GD_STATS_KEY][0]
    bedset_id = bedset_doc["_source"][JSON_ID_KEY]
    try:
        df = pd.read_csv(bedfiles_csv)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="CSV file not found")
    address_col = pd.Series([get_param_url(request.url_for("bedsplash"), {"md5sum": md5sum})
                           for md5sum in list(df[JSON_MD5SUM_KEY])])
    df = df.assign(address=address_col)
    df["BED file name"] = df.apply(lambda row: link_str.format(row["address"], row["id"]), axis=1)
    mid = df['BED file name']
    df = df.drop(columns=["address", "id", 'BED file name'])
    df.insert(0, 'BED file name', mid)
    template_vars = {"request": request, "openapi_version": get_openapi_version(app), "bedset_id": bedset_id, "columns": list(df), "data": df.to_dict(orient='records')}
    return templates.TemplateResponse("bedfiles_table.html", dict(template_vars, **ALL_VERSIONS))


def main():
    global _LOGGER
    global bbc
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        print("No subcommand given")
        sys.exit(1)
    log_lvl = 5 if args.debug else 1
    _LOGGER = logmuse.setup_logger(name=PKG_NAME, level=log_lvl)
    logmuse.init_logger(name="bbconf", level=log_lvl)
    bbc = bbconf.BedBaseConf(bbconf.get_bedbase_cfg(args.config))
    bbc.establish_elasticsearch_connection()
    if args.command == "serve":
        app.mount(bbc[CFG_PATH_KEY][CFG_PIP_OUTPUT_KEY],
                  StaticFiles(directory=bbc[CFG_PATH_KEY][CFG_PIP_OUTPUT_KEY]), name=BED_INDEX)
        _LOGGER.info("running {} app".format(PKG_NAME))
        uvicorn.run(app, host=bbc[CFG_SERVER_KEY][CFG_HOST_KEY],
                    port=bbc[CFG_SERVER_KEY][CFG_PORT_KEY])
