import uvicorn
import sys
from fastapi import FastAPI, HTTPException, Path, Query, Response, APIRouter
from starlette.responses import FileResponse, RedirectResponse, HTMLResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.templating import Jinja2Templates
from starlette.requests import Request
from starlette.staticfiles import StaticFiles
from typing import List, Optional
from logging import INFO, DEBUG
import os
import yaml

import logmuse
import bbconf

from .const import *
from .helpers import *
global _LOGGER

app = FastAPI(
    title=PKG_NAME,
    description="BED file/sets statistics and image server API",
    version=server_v
)

# uncomment below for development, to allow cross origin resource sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://localhost:8000'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.add_middleware(SessionMiddleware, secret_key="bedbase")
# templates = Jinja2Templates(directory=TEMPLATES_PATH)


#
#
# @app.get("/")
# @app.get("/index", name="index")
# async def root(request: Request):
#     """
#     Returns a landing page stating the number of bed files kept in database.
#     Offers a database query constructor for the bed files.
#     """
#     global bbc
#     if CUR_RESULT not in request.session:
#         _LOGGER.debug("Creating sample result")
#         md5sums = bbc.select(condition=INIT_POSTGRES_CONDITION,
#                              table_name=BED_TABLE,
#                              columns=[JSON_MD5SUM_KEY, JSON_NAME_KEY])
#         current_result = construct_search_data(md5sums, request)
#         request.session.update({CUR_RESULT: current_result})
#     if CUR_RULES not in request.session:
#         _LOGGER.debug("Creating sample filter rules")
#         request.session.update({CUR_RULES: INIT_QUERYBUILDER})
#     vars = {"result": request.session[CUR_RESULT],
#             "request": request,
#             "num_bedfiles": bbc.count_bedfiles(),
#             "num_bedsets": bbc.count_bedsets(),
#             "host_ip": bbc[CFG_SERVER_KEY][CFG_HOST_KEY],
#             "host_port": bbc.server.port,
#             "openapi_version": get_openapi_version(app),
#             "filters": get_search_setup(bbc),
#             "bedset_urls": get_all_bedset_urls_mapping(bbc, request),
#             "bbc": bbc}
#     return templates.TemplateResponse("main.html", dict(vars, **ALL_VERSIONS))
#
#
# @app.get("/bed/" + BEDFILE_API_ENDPOINT, name="bedsplash")
# async def serve_bedfile_info(request: Request, md5sum: str = None):
#     global bbc
#     hit = bbc.select(table_name=BED_TABLE, condition=f"{JSON_MD5SUM_KEY}='{md5sum}'")
#     assert len(hit) == 1, f"More than one records matched md5sum ({md5sum})"
#     hit = hit[0]
#     if hit:
#         # we have a hit
#         template_vars = {"request": request, "json": hit,
#                          "bedstat_output": bbc[CFG_PATH_KEY][CFG_BEDSTAT_OUTPUT_KEY],
#                          "openapi_version": get_openapi_version(app),
#                          "bed_url": get_param_url(request.url_for("bedfile"), {"md5sum": md5sum}),
#                          "descs": JSON_DICTS_KEY_DESCS}
#         return templates.TemplateResponse("bedfile_splashpage.html", dict(template_vars, **ALL_VERSIONS))
#     raise HTTPException(status_code=404, detail="BED file not found")


# @app.get("/bedset/" + BEDSET_API_ENDPOINT, name="bedsetsplash")
# async def serve_bedset_info(request: Request, md5sum: str = None):
#     global bbc
#     hit = bbc.select(table_name=BEDSET_TABLE, condition=f"{JSON_MD5SUM_KEY}='{md5sum}'")
#     assert len(hit) == 1, f"More than one records matched md5sum ({md5sum})"
#     hit = hit[0]
#     if hit:
#         # we have a hit
#         bed_urls = {id: get_param_url(request.url_for("bedsplash"), {"md5sum": md5sum})
#                     for id, md5sum in hit[JSON_BEDSET_BED_IDS_KEY].items()} \
#             if JSON_BEDSET_BED_IDS_KEY in hit else None
#         template_vars = {"request": request, "json": hit,
#                          "bedbuncher_output": bbc[CFG_PATH_KEY][CFG_BEDBUNCHER_OUTPUT_KEY],
#                          "openapi_version": get_openapi_version(app),
#                          "bedset_url": get_param_url(request.url_for("bedset"), {"md5sum": md5sum}),
#                          "descs": JSON_DICTS_KEY_DESCS,
#                          "bedset_stats_table_url": request.url_for("bedset_stats_table", **{"bedset_md5sum": md5sum}),
#                          "bed_urls": bed_urls}
#         return templates.TemplateResponse("bedset_splashpage.html", dict(template_vars, **ALL_VERSIONS))
#     raise HTTPException(status_code=404, detail="BED set not found")


# @app.get("/" + BEDFILE_API_ENDPOINT, name="bedfile")
# async def bedfile_serve(request: Request, md5sum: str = None, format: str = None):
#     """
#     Searches database backend for id and returns a page matching id with images and stats
#     """
#     global bbc
#     hit = bbc.select(table_name=BED_TABLE, condition=f"{JSON_MD5SUM_KEY}='{md5sum}'")
#     assert len(hit) == 1, f"More than one records matched md5sum ({md5sum})"
#     hit = hit[0]
#     if hit:
#         # we have a hit
#         if format == 'html':
#             # serve the html splash page (redirect to a dedicated endpoint)
#             return RedirectResponse(url=get_param_url(request.url_for("bedsplash"), {"md5sum": md5sum}))
#         elif format == 'json':
#             # serve the json retrieved from database
#             return dict(hit)
#         elif format == 'bed':
#             # serve raw bed file
#             bed_path = hit[BEDFILE_PATH_KEY]
#             bed_target = get_mounted_symlink_path(bed_path) \
#                 if os.path.islink(bed_path) else bed_path
#             _LOGGER.debug("Determined BED file path: {}".format(bed_target))
#             if not os.path.exists(bed_target):
#                 raise HTTPException(status_code=404, detail="BED file not found")
#             try:
#                 return FileResponse(bed_target, filename=os.path.basename(bed_path),
#                                     media_type='application/gzip')
#             except Exception as e:
#                 return {'error': str(e)}
#         else:
#             raise HTTPException(status_code=400, detail="Bad request: Unrecognized format for request, "
#                                                         "can be one of json, html and bed")
#     raise HTTPException(status_code=404, detail="BED file not found")


# @app.get("/" + BEDSET_API_ENDPOINT, name="bedset")
# async def bedset_serve(request: Request, md5sum: str = None, format: str = None):
#     """
#     Searches database backend for id and returns a page matching id with images and stats
#     """
#     # TODO: create a generic endpoint that BEDSET_API_ENDPOINT
#     #  and BEDFILE_API_ENDPOINT can build on since they are similar

#     # mapping of gzip formats and json keys to paths to files to serve upon request
#     rtm = {"igd": JSON_BEDSET_IGD_DB_KEY,
#            "pep": JSON_BEDSET_PEP_KEY,
#            "csv": JSON_BEDSET_GD_STATS_KEY,
#            "csv-all": JSON_BEDSET_BEDFILES_GD_STATS_KEY}

#     def _gz_file_response(format, resp_type_map=rtm):
#         key = resp_type_map[format]
#         if key in hit and os.path.exists(hit[key]):
#             f = hit[key]
#             _LOGGER.debug("Determined {} path: {}".format(format, f))
#             return FileResponse(f, filename=os.path.basename(f),
#                                 media_type='application/gzip')
#         else:
#             raise HTTPException(status_code=404,
#                                 detail="{} for this BED set not found".format(format))
#     global bbc
#     hit = bbc.select(table_name=BEDSET_TABLE,
#                      condition=f"{JSON_MD5SUM_KEY}='{md5sum}'")
#     assert len(hit) == 1, f"More than one records matched md5sum ({md5sum})"
#     hit = hit[0]
#     if hit:
#         # we have a hit
#         if format == 'html':
#             # serve the html splash page (redirect to a dedicated endpoint)
#             return RedirectResponse(url=get_param_url(request.url_for("bedsetsplash"), {"md5sum": md5sum}))
#         elif format == 'json':
#             # serve the json retrieved from database
#             return dict(hit)
#         elif format == 'bed':
#             # serve raw bed file
#             bedset_path = hit[JSON_BEDSET_TAR_PATH_KEY]
#             bedset_target = get_mounted_symlink_path(bedset_path) \
#                 if os.path.islink(bedset_path) else bedset_path
#             _LOGGER.debug("Determined BED set path: {}".format(bedset_target))
#             if not os.path.exists(bedset_target):
#                 raise HTTPException(status_code=404, detail="BED set not found")
#             return FileResponse(bedset_target, filename=os.path.basename(bedset_path),
#                                 media_type='application/gzip')
#         elif format in rtm.keys():
#             return _gz_file_response(format)
#         else:
#             raise HTTPException(status_code=400,
#                                 detail="Bad request: Unrecognized format for request. "
#                                        "It must be one of: html, json, bed, {}".format(", ".join(rtm.keys())))
#     else:
#         raise HTTPException(status_code=404, detail="BED set not found")


# @app.post("/bedfiles_filter_result")
# async def bedfiles_filter_result(request: Request, json: Dict, html: bool = None):
#     global bbc
#     _LOGGER.debug("Received query: {}".format(json))
#     if "current" in json["postgres"].keys():
#         # special kind of query, to serve the latest results
#         if html:
#             _LOGGER.debug("Serving current result")
#             vars = {"request": request, "result": request.session[CUR_RESULT],
#                     "openapi_version": get_openapi_version(app)}
#             return templates.TemplateResponse("response_search.html",
#                                               dict(vars, **ALL_VERSIONS))
#     md5sums = bbc.select(table_name=BED_TABLE,
#                       condition=json["postgres"]["sql"],
#                       columns=[JSON_NAME_KEY, JSON_MD5SUM_KEY])
#     _LOGGER.debug("response: {}".format(md5sums))
#     _LOGGER.info("{} matched files: {}".format(len(md5sums), md5sums))
#     if not html:
#         return md5sums
#     current_result = construct_search_data(md5sums, request)
#     request.session.update({CUR_RESULT: current_result})
#     request.session.update({CUR_RULES: json["rules"]})
#     vars = {"request": request, "result": current_result,
#             "openapi_version": get_openapi_version(app)}
#     return templates.TemplateResponse("response_search.html", dict(vars, **ALL_VERSIONS))


# @app.get("/serve_rules")
# async def serve_rules(request: Request):
#     return request.session[CUR_RULES]

# @app.get("/bedfiles_stats/{bedset_md5sum}", name="bedset_stats_table")
# async def bedfiles_stats(request: Request, bedset_md5sum: str):
#     global bbc
#     import pandas as pd
#     link_str = "<a href='{}'>{}</a>"
#     hit = bbc.select(table_name=BEDSET_TABLE,
#                      condition=f"{JSON_MD5SUM_KEY}='{bedset_md5sum}'",
#                      columns=[JSON_NAME_KEY, JSON_BEDSET_BEDFILES_GD_STATS_KEY])
#     assert len(hit), f"No records matched md5sum ({bedset_md5sum})"
#     assert len(hit) == 1, f"More than one records matched md5sum ({bedset_md5sum})"
#     hit = hit[0]
#     bedset_id = hit[JSON_NAME_KEY]
#     try:
#         df = pd.read_csv(hit[JSON_BEDSET_BEDFILES_GD_STATS_KEY])
#     except FileNotFoundError:
#         raise HTTPException(status_code=404, detail="CSV file not found")
#     address_col = pd.Series([get_param_url(request.url_for("bedsplash"), {"md5sum": md5sum}) for md5sum in list(df[JSON_MD5SUM_KEY])])
#     df = df.assign(address=address_col)
#     df["BED file name"] = df.apply(lambda row: link_str.format(row["address"], row["name"]), axis=1)
#     mid = df['BED file name']
#     df = df.drop(columns=["address", 'BED file name'])
#     df.insert(0, 'BED file name', mid)
#     template_vars = {"bedset_id": bedset_id, "columns": list(df), "address": address_col, "data": df.to_dict(orient='records')}
#     return template_vars

@app.get("/api/bed/count")
async def get_bedfile_count():
    """
    Returns the number of bedfiles available in the database
    """
    return int(bbc.count_bedfiles())


@app.get("/api/bedset/count")
async def get_bedset_count():
    """
    Returns the number of bedsets available in the database
    """
    return int(bbc.count_bedsets())


@app.get("/api/bedset/list/{column}")
async def get_all_bedset_list(column: str = Path(..., description="DB column name", regex=r"^\S+$")):
    """
    Returns a list of selected columns for all bedset records
    """
    return bbc.select(table_name=BEDSET_TABLE, columns=["id", JSON_MD5SUM_KEY, column])


@app.get("/api/bed/list/{column}")
async def get_all_bed_list(column: str = Path(..., description="DB column name",
                                              regex=r"^\S+$")):
    """
    Returns a dict of record IDs and names of selected columns
    for all bedfile records
    """
    return dict(bbc.select(table_name=BED_TABLE, columns=["id", JSON_MD5SUM_KEY, column]))


@app.get("/api/bed/bedset/{bedset_id}")
async def get_bed_list_for_bedset(bedset_id: int = Path(..., description="BED set ID"),
                                  column: Optional[str] = Query(None, description="Column name", regex=r"^\D+$")):
    """
    Returns a list of bedfile columns that are part of the bedset with a provided ID
    """
    columns = ["id", JSON_MD5SUM_KEY] if column is None else ["id", JSON_MD5SUM_KEY] + [column]
    return bbc.select_bedfiles_for_bedset(query=f"id='{bedset_id}'", bedfile_col=columns)

@app.get("/api/{table_name}/splash/{md5sum}")
async def get_bed_data_for_bedset(table_name: str = Path(..., description="DB Table name",
                                    regex=r"{}|{}".format(BED_TABLE, BEDSET_TABLE)),
                                  md5sum: str = Path(..., description="digest"),
                                  column: Optional[str] = Query(None, description="Column name", regex=r"^\D+$")):
    """
    Returns table data with a provided ID
    """
    column = "*" if column is None else column

    return bbc.select(table_name = table_name, condition = f"{JSON_MD5SUM_KEY} = '{md5sum}'", columns = column)


@app.get("/api/versions")
async def get_version_info():
    """
    Returns app version information
    """
    versions = ALL_VERSIONS
    versions.update({"openapi_version": get_openapi_version(app)})
    return versions


@app.get("/")
@app.get("/bedfilesplash/{md5sum}", include_in_schema=False)
@app.get("/bedsetsplash/{md5sum}", include_in_schema=False)
@app.get("/index")
async def index():
    """
    Display the index UI page
    """
    return FileResponse(os.path.join(UI_PATH, "index.html"))


@app.get("/api/filters/{table_name}")
async def get_bedfile_table_filters(
        table_name: str = Path(..., description="DB Table name",
                               regex=r"{}|{}".format(BED_TABLE, BEDSET_TABLE))):
    """
    Returns the filters mapping to based on the selected table schema to
    construct the queryBuilder to interface the DB
    """
    if table_name == BED_TABLE:
        return get_search_setup(bbc.get_bedfiles_table_columns_types())
    return get_search_setup(bbc.get_bedsets_table_columns_types())


@app.get("/api/bedset/{md5sum}/bedfiles")
async def get_bedfiles_in_bedset(
        md5sum: str = Path(..., description="digest"),
        column: Optional[str] = Query(
            None,
            description="Column name to select from the table"
        )
):
    avail_cols = [c[0] for c in bbc.get_bedfiles_table_columns_types()]
    if column and column not in avail_cols:
        msg = f"Column '{column}' not found in '{BED_TABLE}' table"
        _LOGGER.warning(msg)
        raise HTTPException(status_code=404, detail=msg)
    res = bbc.select_bedfiles_for_bedset(
        query=f"md5sum='{md5sum}'",
        bedfile_col=column
    )[0]
    colnames = list(res.keys())
    values = list(res.values())
    _LOGGER.info(f"Serving data for columns: {colnames}")
    return {"columns": colnames, "data": values}


@app.get("/api/bedset/{md5sum}/data")
async def get_bedset_data(
        md5sum: str = Path(
            ...,
            description="digest"
        ),
        column: Optional[str] = Query(
            None,
            description="Column name to select from the table"
        )
):
                        
    """
    Returns selected bedset
    """
    avail_cols = [c[0] for c in bbc.get_bedsets_table_columns_types()]
    if column and column not in avail_cols:
        msg = f"Column '{column}' not found in '{BEDSET_TABLE}' table"
        _LOGGER.warning(msg)
        raise HTTPException(status_code=404, detail=msg)
    # there's certainly only one record matching the md5sum query due to
    # bedsets md5sum uniqueness table restrictions
    res = bbc.select(
        table_name=BEDSET_TABLE,
        condition=f"{JSON_MD5SUM_KEY}='{md5sum}'",
        columns=column
    )[0]
    colnames = list(res.keys())
    values = list(res.values())
    _LOGGER.info(f"Serving data for columns: {colnames}")
    return {"columns": colnames, "data": values}


@app.get("/api/img/{table_name}/{md5sum}/{img_name}/{format}")
async def get_image(
        table_name: str = Path(..., description="DB Table name", regex=fr"{BED_TABLE}|{BEDSET_TABLE}"),
        md5sum: str = Path(..., description="digest"),
        img_name: str = Path(..., description="image name"),
        format: str = Path(..., description="pdf or png", regex=r"pdf|png")):
    """
    Returns the img with provided ID
    """
    imgs = bbc.select(table_name=table_name,
                      condition=f"{JSON_MD5SUM_KEY} = '{md5sum}'",
                      columns=["name", "plots"])
    output_getter = bbc.get_bedbuncher_output_path \
        if table_name == BEDSET_TABLE else bbc.get_bedstat_output_path
    remote = True if bbc[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(output_getter(remote), md5sum, f"{imgs[0][0]}_{img_name}.{format}")
    if remote:
        _LOGGER.info(f"Redirecting to: {path}")
        return RedirectResponse(path)
    _LOGGER.info(f"Returning local: {path}")
    if os.path.isfile(path):
        return FileResponse(path, filename=os.path.basename(path), media_type="application/octet-stream")
    else:
        msg = f"File not found on server: {path}"
        _LOGGER.warning(msg)
        raise HTTPException(status_code=404, detail=msg)


@app.get("/api/{table_name}/download/{md5sum}")
async def download_file(table_name: str = Path(..., description="DB Table name", regex=r"{}|{}".format(BED_TABLE, BEDSET_TABLE)),
                        md5sum: str = Path(..., description="digest")):
                        
    """
    Download file with provided ID
    """
    file_path = bbc.select(table_name=table_name,
                           condition=f"{JSON_MD5SUM_KEY}='{md5sum}'",
                           columns=BEDFILE_PATH_KEY if table_name == BED_TABLE else JSON_BEDSET_TAR_PATH_KEY)[0][0]
    _LOGGER.info(f"Got relative path from DB: {file_path}")
    output_getter = bbc.get_bedbuncher_output_path if table_name == BEDSET_TABLE else bbc.get_bedstat_output_path
    remote = True if bbc[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(output_getter(remote), file_path)
    if remote:
        _LOGGER.info(f"Redirecting to: {path}")
        return RedirectResponse(path)
    _LOGGER.info(f"Returning local: {path}")
    if os.path.isfile(path):
        return FileResponse(path, filename=os.path.basename(path), media_type="application/octet-stream")
    else:
        msg = f"File not found on server: {path}"
        _LOGGER.warning(msg)
        raise HTTPException(status_code=404, detail=msg)
    if remote:
        _LOGGER.info(f"Redirecting")
        return RedirectResponse(os.path.join(output_getter(remote), file_path))


@app.get("/api/{table_name}/search/{query}")
async def get_query_results(table_name: str = Path(..., description="DB Table name", regex=r"{}|{}".format(BED_TABLE, BEDSET_TABLE)),
                            query: str = Path(None, description="query condiction", regex=r"^.+$"),
                            column: str = Query(None, description="Column name", regex=r"^\D+$")):
                        
    """
    Return query results with provided table name and query string
    """
    columns = ["id", JSON_MD5SUM_KEY] if column is None else ["id", JSON_MD5SUM_KEY] + [column]
    return bbc.select(table_name = table_name, condition = query, columns = columns)


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
    bbc = bbconf.BedBaseConf(bbconf.get_bedbase_cfg(args.config))
    bbc.establish_postgres_connection()
    if args.command == "serve":
        if not bbc[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY]:
            _LOGGER.debug(f"Using local files for serving: "
                          f"{bbc[CFG_PATH_KEY][CFG_PIPELINE_OUT_PTH_KEY]}")
            app.mount(bbc.get_bedstat_output_path(),
                      StaticFiles(directory=bbc.get_bedstat_output_path()),
                      name=BED_TABLE)
            app.mount(bbc.get_bedbuncher_output_path(),
                      StaticFiles(directory=bbc.get_bedbuncher_output_path()),
                      name=BEDSET_TABLE)
        else:
            _LOGGER.debug(f"Using remote files for serving: "
                          f"{bbc[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY]}")
        if os.path.exists(UI_PATH):
            _LOGGER.debug(f"Determined React UI path: {UI_PATH}")
        else:
            raise FileNotFoundError(f"React UI path to mount not found: {UI_PATH}")

        # app.mount("/static", StaticFiles(directory=os.path.join(UI_PATH, "static")))
        app.mount("/", StaticFiles(directory=UI_PATH))

        _LOGGER.info("running {} app".format(PKG_NAME))
        uvicorn.run(app, host=bbc[CFG_SERVER_KEY][CFG_HOST_KEY],
                    port=bbc[CFG_SERVER_KEY][CFG_PORT_KEY])