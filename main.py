from fastapi import FastAPI, HTTPException, Query, APIRouter
from starlette.responses import FileResponse
from starlette.templating import Jinja2Templates
from starlette.requests import Request
from starlette.staticfiles import StaticFiles
import uvicorn

import json, yaml
import os, sys

#import tempfile
#from datetime import datetime
#import re

from elasticsearch import Elasticsearch
from elasticsearch import helpers
from elasticsearch.serializer import JSONSerializer

from const import *

global cfg, es_client, bedstat_base_path

# some elasticsearch helper f-ns
def getElasticClient(host):
    return Elasticsearch([{'host': host}])

# get number of documents in elastic
def getElasticDocNum(es_client, idx):
    try:
        json_ct = es_client.cat.count(idx, params={"format":"json"})
        # decompose the entry
        # it will be returned as a list with one element, which is a dictionary
        # such as [{'epoch': '1571915917', 'timestamp': '11:18:37', 'count': '6'}]
        return json_ct[0]['count'] 
    except Exception as e:
        return -1


def elasticIDSearch(es_client, idx, q):
    # searches elastic for id 'q'
    res = es_client.search(index=idx, doc_type="doc", body={"query": {"match": {"id": q}}})
    return res

# get the yaml config first
# pick up base path for the json out of bedstat pipeline and generated PNG images
with open("config.yaml", 'r') as ymlfile:
    cfg = yaml.load(ymlfile)

if 'path_config' in cfg and 'bed_base_path' in cfg['path_config']:
    bedstat_base_path = cfg['path_config']['bed_base_path']
else:
    bedstat_base_path = os.getcwd()

if 'database' in cfg and 'host' in cfg['database']:
    es_client = getElasticClient(cfg['database']['host'])
else:
    es_client = getElasticClient('localhost')

# get number of documents in the main index and test the connection at the same time
doc_num = getElasticDocNum(es_client, 'bedstat_bedfiles')
if doc_num == -1:
    # quit the server since we cannot connect to database backend
    print("Cannot connect to database back end. Aborting startup.")
    sys.exit(-1)

# FASTAPI code starts
app = FastAPI(
    title="bedstat-rest-api",
    description="BED file statistics and image server API",
    version="0.0.1"
)

app.mount("/static", StaticFiles(directory="static"), name="static")
# since we have a bunch of images to serve, that are already pre-made...
app.mount(bedstat_base_path, StaticFiles(directory=bedstat_base_path), name="bedfiles")

templates = Jinja2Templates(directory="templates")

router = APIRouter()

# code to handle API paths follows
@router.get("/")
@router.get("/index")
async def root(request:Request):
    """
    Returns a landing page stating the number of bed files kept in database.
    Offers a search dialog for the bed files (by fraction of name),
    Also offers a link to a sample file
    """
    vars = {"request": request, "num_files": doc_num}
    return templates.TemplateResponse("main.html", dict(vars, **ALL_VERSIONS))

@router.get("/bedstat/{bed_id}")
async def bedstat_serve(request:Request, bed_id):
    """
    Searches database backend for id and returns a page matching id with images and stats
    """
    js = elasticIDSearch(es_client, "bedstat_bedfiles", bed_id)
    if 'hits' in js and int(js['hits']['total']) > 0:
        # we have a hit
        print(js['hits']['hits'][0]['_source'])
        vars = {"request": request, "bed_id":bed_id, "js":js['hits']['hits'][0]['_source']}
        return templates.TemplateResponse("gccontent.html", dict(vars, **ALL_VERSIONS))
    else:
        return {'error': 'no data found'}

def main():
    # run the app
    app.include_router(router)
    uvicorn.run(app, host="0.0.0.0")

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        _LOGGER.info("Program canceled by user")
        sys.exit(1)
