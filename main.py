import os, sys, os.path, json, gzip, shutil, re
import requests

from fastapi import FastAPI, HTTPException, Query, APIRouter, Form
from starlette.responses import FileResponse
from starlette.templating import Jinja2Templates
from starlette.requests import Request
from starlette.staticfiles import StaticFiles
import uvicorn

from const import *
from config import *
from elastic import *
from elasticsearch_dsl import Search
from elasticsearch_dsl.query import Range, Bool

global host_ip, host_port, es_client

# get basic config
db_host = get_db_host()
bedstat_base_path = get_bedstat_base_path()
es_client = get_elastic_client(db_host)

# get host and port to attach to (from parser)
host_ip, host_port = get_server_cfg()

# get number of documents in the main index and test the connection at the same time
doc_num = get_elastic_doc_num(es_client, 'bedstat_bedfiles')
if doc_num == -1:
    # quit the server since we cannot connect to database backend
    print("Cannot connect to database back end. Aborting startup.")
    sys.exit(1)

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
#router = APIRouter()
#app.include_router(router)

# code to handle API paths follows
@app.get("/")
@app.get("/index")
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

@app.get("/regionset/")
async def bedstat_serve(request:Request, id, format):
    """
    Searches database backend for id and returns a page matching id with images and stats
    """
    js = elastic_id_search(es_client, "bedstat_bedfiles", id)
    if 'hits' in js and 'total' in js['hits'] and int(js['hits']['total']['value']) > 0:
        # we have a hit
        if format == 'html':
            bed_url = "http://{}:{}/regionset/?id={}"
            vars = {"request": request,
                    "bed_id":id,
                    "js":js['hits']['hits'][0]['_source'],
                    "bed_url": bed_url.format(host_ip,host_port,id)}
            return templates.TemplateResponse("gccontent.html", dict(vars, **ALL_VERSIONS))
        elif format == 'json':
            # serve the json retrieved from database
            return js['hits']['hits'][0]['_source']
        elif format == 'bed':
            # serve raw bed file
            # construct the path for the file holding the path of the raw bed file
            try:
                # get the original raw bed file name .gz
                syml_tgt = os.readlink(os.path.abspath(os.path.join(os.path.join(bedstat_base_path, id), "raw_bedfile")))
                gzbedpath = os.path.abspath(os.path.join(os.path.join(bedstat_base_path, id), syml_tgt))
                # serve the .gz file
                headers = {'Content-Disposition': 'attachment; filename=%s' % syml_tgt}
                return FileResponse(gzbedpath, headers=headers, media_type='application/gzip')
            except Exception as e:
                return {'error': str(e)}
        else:
            return {'error': 'Unrecognized format for request, can be one of json, html and bed'}
    else:
        return {'error': 'no data found'}

# this function had to be made independent because FastAPI does not like
# being called from within FastAPI, which would have been the case in the
# search function
from typing import List
def bedstat_search_db(filters):
    elastic_ops = {'<' : 'lt',
                   '<=': 'lte',
                   '=' : 'eq',
                   '>' : 'gt',
                   '>=': 'gte'}

    search_terms = ['id', 'species', 'antibody', 'treatment', 'tissue', 'description']
        
    if filters:

        # filters here looks something like (hopefully! e.g.):
        # filters= ['nregions>=100', 'cpg<0.30', 'nregions=20', 'id matches human', 'id contains mouse', 'tissue matches lung']

        # verify each filter is appropriate
        # and attempt to aggregate comparison operations per filter
        re_pattern = '^(((\w)+ +(contains|matches) +(\w+))|((nregions|cpg)([<=>]+(=)*)(\d)+((\.)*(\d)+)))'
        filter_regex = re.compile(re_pattern)
        filters_and_ops = {}
        for f in filters:
            result = filter_regex.match(f)
            if not result:
                return {"error" : "bad parameter --> " + f}
            else:
                # we need to distinguish between id matches|contains <something>
                # and the nregions/cpg op kind of a filter here
                
                # try to split on comparison op
                s = re.split(r'([<=>]+(=)*)', f)
                # element 0 = filter name (nregions or cpg)
                # element 1 = comparison op (<, <=, =, >, >=)
                # element 3 = numeric value (float or int)

                # adjust query parameters to match json contents of database
                if s[0] == 'nregions':
                    sn = 'num_regions'
                elif s[0] == 'cpg':
                    sn = 'gc_content'
                else:
                    sn = s[0]
                
                
                if sn in filters_and_ops:
                    if not sn in search_terms:
                        filters_and_ops[sn].append((elastic_ops.get(s[1]),s[3]))
                else:
                    if not sn in search_terms:
                        filters_and_ops[sn] = [(elastic_ops.get(s[1]),s[3])]
        # filters_and_ops here looks something like (e.g.):
        # {'num_regions': [('gte', '100'), ('eq', '20')], 'gc_content': [('lt', '0.30')]}
        # build up the elastic query
        should=[]
        for filter_name in filters_and_ops:
            val_list = filters_and_ops[filter_name]
            for (fltr, op_val) in val_list:
                # below approach is awkward since elasticsearch-dsl
                # needs the actual name of the field in the Range object
                # but NOT as string
                if filter_name == 'num_regions':
                    should.append(Range(num_regions={fltr : float(op_val)}))
                elif filter_name == 'gc_content':
                    should.append(Range(gc_content={fltr : float(op_val)}))
                else:
                    # there could be other filters down the road
                    continue
        s = Search(using=es_client).query(Bool(must=should))
        response = s.execute()
        if response.success():
            return { "result" : response.to_dict()['hits']['hits'] }
        else:
            return { "result" : "no matching data found." }
    return {"error": "no filters provided"}

@app.get("/regionsets")
async def bedstat_search(request:Request, filters:List[str] = Query(None)):
    return bedstat_search_db(filters)

@app.post("/search")
async def parse_search_query(request:Request, search_text:str = Form(...)):
    
    # search for keywords like "and" or operators like ">" or "="
    re_pattern="(((id) +(contains|matches) +(\w+))|((nregions|cpg) *([<=>]+(=)?) *(\d+)(\.\d+)?))+"
    filter_regex = re.compile(re_pattern)

    # split on an "and" only. for now
    res_filtered = []
    ands = search_text.split("and")
    for a in ands:
        # do the regex match
        if a.strip().startswith("id"):
            res = filter_regex.match(a)
        else:
            res = filter_regex.match(a.strip())
        # remove all the unmatched sections of the pattern
        #for i in range(0,len(res.groups())):
        #    if (res.groups()[i] != None):
        #        res_filtered.append(res.groups()[i])
        if len(res.groups()) > 0 and not res.groups()[0].strip().startswith("id"):
            res_filtered.append(res.groups()[0].replace(' ', ''))
        else:
            res_filtered.append(res.groups()[0])
    print(res_filtered)
    # here we can call the search function
    search_res = bedstat_search_db(res_filtered)
    #print("search_res=", search_res)
    # prepare to pas on the results to response template
    template_data = []
    for s in search_res["result"]:
        bed_id = s["_source"]["id"][0]
        bed_url = "http://{}:{}/regionset/?id={}&format=html".format(host_ip,host_port,bed_id)
        bed_gz = "http://{}:{}/regionset/?id={}&format=bed".format(host_ip,host_port,bed_id)
        bed_json = "http://{}:{}/regionset/?id={}&format=json".format(host_ip,host_port,bed_id)
        template_data.append((bed_id, bed_url, bed_gz, bed_json))
    vars = { "request": request, "result" : template_data }
    return templates.TemplateResponse("response_search.html", dict(vars, **ALL_VERSIONS))
