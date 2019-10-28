import json, yaml
import os, sys, os.path
import gzip, shutil

from fastapi import FastAPI, HTTPException, Query, APIRouter
from starlette.responses import FileResponse
from starlette.templating import Jinja2Templates
from starlette.requests import Request
from starlette.staticfiles import StaticFiles
import uvicorn

from elasticsearch import Elasticsearch
from elasticsearch import helpers
from elasticsearch.serializer import JSONSerializer

from const import *

global cfg, es_client, bedstat_base_path, host_ip, host_port

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
    res = es_client.search(index=idx, body={"query": {"match": {"id": q}}})
    return res

# below function will ask for ALL docs stored in elastic but elastic returns only the first 10
def getElasticDocs(es_client, idx):
    try:
        res = es_client.search(index=idx, body = {
            'query': {
                'match_all' : {}
            }})
        if '_shards' in res and int(res['_shards']['total']) > 0:
            return res['hits']['hits']
        else:
            return None
    except Exception as e:
        return None

# get the yaml config first
# pick up base path for the json out of bedstat pipeline and generated PNG images
with open("config.yaml", 'r') as ymlfile:
    cfg = yaml.load(ymlfile)

if 'path_config' in cfg and 'bedstat_pipeline_output_path' in cfg['path_config']:
    bedstat_base_path = cfg['path_config']['bedstat_pipeline_output_path']
else:
    bedstat_base_path = os.getcwd()

if 'database' in cfg and 'host' in cfg['database']:
    es_client = getElasticClient(cfg['database']['host'])
else:
    es_client = getElasticClient('localhost')

if 'server' in cfg:
    if 'host' in cfg['server']:
        host_ip = cfg['server']['host']
    else:
        host_ip = '0.0.0.0'
    if 'port' in cfg['server']:
        host_port = cfg['server']['port']
    else:
        host_port = 8000

# get number of documents in the main index and test the connection at the same time
doc_num = getElasticDocNum(es_client, 'bedstat_bedfiles')
if doc_num == -1:
    # quit the server since we cannot connect to database backend
    print("Cannot connect to database back end. Aborting startup.")
    sys.exit(-1)

# get all elastic docs here, do it once
all_elastic_docs = getElasticDocs(es_client, 'bedstat_bedfiles')

# FASTAPI code starts
app = FastAPI(
    title="bedstat-rest-api",
    description="BED file statistics and image server API",
    version="0.0.1"
)

app.mount("/static", StaticFiles(directory="static"), name="static")
# since we have a bunch of images to serve, that are already pre-made...
app.mount(bedstat_base_path, StaticFiles(directory=bedstat_base_path), name="bedfile_stats")

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
    # pick a random ID from whatever is stored in the database
    # and pass it onto the main page so that the user can choose to click a link to it
    if all_elastic_docs is not None:
        vars = {"request":request,
                "num_files": doc_num,
                "docs": all_elastic_docs,
                "host_ip": host_ip,
                "host_port": host_port}
        return templates.TemplateResponse("main.html", dict(vars, **ALL_VERSIONS))
    else:
        return {"error": "no data available from database"}

@router.get("/regionset/")
async def bedstat_serve(request:Request, id, format):
    """
    Searches database backend for id and returns a page matching id with images and stats
    """
    js = elasticIDSearch(es_client, "bedstat_bedfiles", id)
    if 'hits' in js and 'total' in js['hits'] and int(js['hits']['total']['value']) > 0:
        # we have a hit
        vars = {"request": request, "bed_id":id, "js":js['hits']['hits'][0]['_source']}
        if format == 'html':
            return templates.TemplateResponse("gccontent.html", dict(vars, **ALL_VERSIONS))
        elif format == 'json':
            # serve the json retrieved from database
            return js['hits']['hits']
        elif format == 'bed':
            # serve raw bed file
            # construct the path for the file holding the path of the raw bed file
            try:
                bedpathfile = os.path.abspath(os.path.join(os.path.join(bedstat_base_path, id), id + ".path"))
                # get the path to the original .bed file
                with open(bedpathfile, 'r') as f: bedpath = f.read()
                # copy the bed file to /tmp, in order to compress it
                # get the filename+extension portion of the file first
                fname = os.path.split(bedpath)[1]
                tmp_fname = os.path.abspath(os.path.join('/tmp', fname))
                dst = shutil.copyfile(bedpath, tmp_fname)
                # now compress it using gzip
                with open(tmp_fname, 'rb') as f_in:
                    with gzip.open(tmp_fname + '.gz', 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                # remove uncompressed file
                os.remove(tmp_fname)
                # we cannot remove the .gz file since it is being served
                headers = {'Content-Disposition': 'attachment; filename=%s' % fname+'.gz'}
                return FileResponse(tmp_fname + '.gz', headers=headers, media_type='application/gzip')
            except Exception as e:
                return {'error': str(e)}
        else:
            return {'error': 'Unrecognized format for request, can be one of json, html and bed'}
    else:
        return {'error': 'no data found'}

def main(host_ip):
    # run the app
    app.include_router(router)
    uvicorn.run(app, host=host_ip)

if __name__ == "__main__":
    try:
        sys.exit(main(host_ip))
    except KeyboardInterrupt:
        _LOGGER.info("Program canceled by user")
        sys.exit(1)
