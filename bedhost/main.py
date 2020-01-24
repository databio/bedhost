import os
import sys
import re
import elasticsearch
import uvicorn
from elasticsearch_dsl import Search, Q
from elasticsearch_dsl.query import Range, Bool
from fastapi import FastAPI, Query, Form
from starlette.responses import FileResponse, RedirectResponse
from starlette.templating import Jinja2Templates
from starlette.requests import Request
from starlette.staticfiles import StaticFiles

import logmuse
from yacman import select_config, YacAttMap

from .const import *
from .config import *
from .elastic import *
from .helpers import build_parser, get_openapi_version
global _LOGGER

app = FastAPI(
    title="bedhost",
    description="BED file statistics and image server API",
    version=server_v
)
app.mount("/" + STATIC_DIRNAME, StaticFiles(directory=STATIC_PATH), name=STATIC_DIRNAME)
templates = Jinja2Templates(directory=TEMPLATES_PATH)


def est_elastic_conn(cfg):
    """
    Establish Elasticsearch connection

    :param str cfg: path to the bedhost config file
    """
    global db_host
    global es_client
    global doc_num
    global all_elastic_docs
    global index_name
    index_name = get_elastic_index_name(cfg)
    db_host = get_db_host(cfg)
    es_client = get_elastic_client(db_host)
    # get number of documents in the main index and test the connection at the same time
    doc_num = get_elastic_doc_num(es_client, index_name)
    # get all elastic docs here, do it once
    all_elastic_docs = get_elastic_docs(es_client, index_name)


# code to handle API paths follows
@app.get("/")
@app.get("/index")
async def root(request: Request):
    """
    Returns a landing page stating the number of bed files kept in database.
    Offers a search dialog for the bed files (by fraction of name),
    Also offers a link to a sample file
    """
    global es_client
    # pick a random ID from whatever is stored in the database
    # and pass it onto the main page so that the user can choose to click a link to it
    if all_elastic_docs is not None:
        vars = {"request": request,
                "num_files": doc_num,
                "docs": all_elastic_docs,
                "host_ip": host_ip,
                "host_port": host_port,
                "openapi_version": get_openapi_version(app),
                "filters": get_search_setup(es_client=es_client)}
        return templates.TemplateResponse("main.html", dict(vars, **ALL_VERSIONS))
    else:
        return {"error": "no data available from database"}


@app.get("/bed/" + RSET_API_ENDPOINT)
async def serve_bedfile_info(request: Request, id: str = None):
    sr = elastic_id_search(es_client, index_name, id)
    if 'hits' in sr and 'total' in sr['hits'] and int(sr['hits']['total']['value']) > 0:
        # we have a hit
        json = sr['hits']['hits'][0]['_source']
        template_vars = {"request": request, "bed_id": id, "js": json, "bed_url": RSET_ID_URL.format(host_ip, id)}
        return templates.TemplateResponse("bedfile_splashpage.html", dict(template_vars, **ALL_VERSIONS))
    return {'error': 'no data found'}


@app.get("/" + RSET_API_ENDPOINT)
async def bedstat_serve(id: str = None, format: str = None):
    """
    Searches database backend for id and returns a page matching id with images and stats
    """
    sr = elastic_id_search(es_client, index_name, id)
    if 'hits' in sr and 'total' in sr['hits'] and int(sr['hits']['total']['value']) > 0:
        # we have a hit
        json = sr['hits']['hits'][0]['_source']
        if format == 'html':
            return RedirectResponse(url="/bed/" + RSET_API_ENDPOINT + "?id=" + id)
        elif format == 'json':
            # serve the json retrieved from database
            return json
        elif format == 'bed':
            # serve raw bed file
            # construct the path for the file holding the path of the raw bed file
            try:
                # get the original raw bed file name .gz
                syml_tgt = os.readlink(os.path.abspath(os.path.join(os.path.join(bedstat_base_path, id), RAW_BEDFILE_KEY)))
                gzbedpath = os.path.abspath(os.path.join(os.path.join(bedstat_base_path, id), syml_tgt))
                # serve the .gz file
                headers = {'Content-Disposition': 'attachment; filename={}'.format(syml_tgt)}
                return FileResponse(gzbedpath, headers=headers, media_type='application/gzip')
            except Exception as e:
                return {'error': str(e)}
        else:
            return {'error': 'Unrecognized format for request, can be one of json, html and bed'}
    return {'error': 'no data found'}


def get_search_setup(es_client):
    """
    Create a query setup for a Jinja2 template.
    The setup is used ot populate a queryBuilder in a JavaScript code.

    :param elasticsearch.client.Elasticsearch es_client: Elasticsearch client object
    :return list[dict]: a list dictionaries with search setup to populate the JavaScript code with
    """
    mapping = es_client.indices.get_mapping(BED_INDEX)
    attrs = list(mapping[BED_INDEX]["mappings"]["properties"].keys())
    setup_dicts = []
    for attr in attrs:
        try:
            attr_type = mapping[BED_INDEX]["mappings"]["properties"][attr]["type"]
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


from typing import Dict
@app.post("/bedfiles_filter_result")
async def bedfiles_filter_result(request: Request, json: Dict):
    global es_client
    _LOGGER.info("Received query: {}".format(json))
    resp = es_client.search(index=BED_INDEX, body={"query": json})
    _LOGGER.debug("response: {}".format(resp))
    hits = resp["hits"]["hits"]
    ids = [hit["_source"]["id"][0] for hit in hits]
    _LOGGER.info("{} matched ids: {}".format(len(ids), ids))
    template_data = []
    for bed_id in ids:
        bed_data_url_template = RSET_ID_URL.format(host_ip, bed_id) + "&format="
        bed_url = bed_data_url_template + "html"
        bed_gz = bed_data_url_template + "bed"
        bed_json = bed_data_url_template + "json"
        template_data.append([bed_id, bed_url, bed_gz, bed_json])
    _LOGGER.debug("template_data: {}".format(template_data))
    vars = {"request": request, "result": template_data, "openapi_version": get_openapi_version(app)}
    return templates.TemplateResponse("response_search.html", dict(vars, **ALL_VERSIONS))


def main():
    global _LOGGER
    global bedstat_base_path
    global host_ip
    global host_port
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        print("No subcommand given")
        sys.exit(1)
    logger_args = dict(name=PKG_NAME, fmt=LOG_FORMAT, level=5) \
        if args.debug else dict(name=PKG_NAME, fmt=LOG_FORMAT)
    _LOGGER = logmuse.setup_logger(**logger_args)
    selected_cfg = select_config(args.config, config_env_vars=CFG_ENV_VARS)
    assert selected_cfg is not None, "You must provide a config file or set the {} environment variable".\
        format("or ".join(CFG_ENV_VARS))
    cfg = YacAttMap(filepath=selected_cfg)
    est_elastic_conn(cfg)
    bedstat_base_path = get_bedstat_base_path(cfg)
    host_ip, host_port = get_server_cfg(cfg)
    if args.command == "serve":
        app.mount(bedstat_base_path, StaticFiles(directory=bedstat_base_path), name="bedfile_stats")
        _LOGGER.info("running bedhost app")
        uvicorn.run(app, host="0.0.0.0", port=args.port)
