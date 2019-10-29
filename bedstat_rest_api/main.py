import os, sys, os.path, json, gzip, shutil

from fastapi import FastAPI, HTTPException, Query, APIRouter
from starlette.responses import FileResponse
from starlette.templating import Jinja2Templates
from starlette.requests import Request
from starlette.staticfiles import StaticFiles
import uvicorn

from const import *
from config import *
from elastic import *

global host_ip, host_port

# get basic config
db_host = get_db_host()
host_ip, host_port = get_server_cfg()
bedstat_base_path = get_bedstat_base_path()
es_client = get_elastic_client(db_host)

# get number of documents in the main index and test the connection at the same time
doc_num = get_elastic_doc_num(es_client, 'bedstat_bedfiles')
if doc_num == -1:
    # quit the server since we cannot connect to database backend
    print("Cannot connect to database back end. Aborting startup.")
    sys.exit(-1)

# get all elastic docs here, do it once
all_elastic_docs = get_elastic_docs(es_client, 'bedstat_bedfiles')

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
    js = elastic_id_search(es_client, "bedstat_bedfiles", id)
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

def main():
    # run the app
    app.include_router(router)
    uvicorn.run(app, host=host_ip, port=host_port)

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        _LOGGER.info("Program canceled by user")
        sys.exit(1)
