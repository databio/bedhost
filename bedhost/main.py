import os
import sys
import re
import elasticsearch
import uvicorn
from elasticsearch_dsl import Search, Q
from elasticsearch_dsl.query import Range, Bool
from fastapi import FastAPI, Query, Form
from starlette.responses import FileResponse
from starlette.templating import Jinja2Templates
from starlette.requests import Request
from starlette.staticfiles import StaticFiles

import logmuse
from yacman import select_config, YacAttMap

from .const import *
from .config import *
from .elastic import *
from .helpers import build_parser
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
    # pick a random ID from whatever is stored in the database
    # and pass it onto the main page so that the user can choose to click a link to it
    if all_elastic_docs is not None:
        vars = {"request": request,
                "num_files": doc_num,
                "docs": all_elastic_docs,
                "host_ip": host_ip,
                "host_port": host_port}
        return templates.TemplateResponse("main.html", dict(vars, **ALL_VERSIONS))
    else:
        return {"error": "no data available from database"}


@app.get(REGIONSET_ENDPOINT)
async def bedstat_serve(request: Request, id, format: str = None):
    """
    Searches database backend for id and returns a page matching id with images and stats
    """
    js = elastic_id_search(es_client, index_name, id)
    if 'hits' in js and 'total' in js['hits'] and int(js['hits']['total']['value']) > 0:
        # we have a hit
        if format == 'html':
            bed_url = "http://{}" + REGIONSET_ENDPOINT.format(id=id)
            template_vars = {"request": request, "bed_id": id, "js": js['hits']['hits'][0]['_source'],
                             "bed_url": bed_url.format(host_ip, id)}
            return templates.TemplateResponse("bedfile_splashpage.html", dict(template_vars, **ALL_VERSIONS))
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

# for now, we do not look at or queries at all, just and
# in the future (when I figure out how to do "or" in elastic)
# we will consider or as well
from typing import List
def bedstat_search_db(ands, ors):
    elastic_ops = {'<': 'lt',
                   '<=': 'lte',
                   '=': 'eq',
                   '>': 'gt',
                   '>=': 'gte'}    
    
    # construct re pattern for matches/contains
    re_ptrn_mc = "|".join(SEARCH_TERMS)

    # process ands first
    if ands:
        # filters here looks something like (hopefully! e.g.):
        # filters= ['nregions>=100', 'cpg<0.30', 'nregions=20', 'id matches human', 'id contains mouse', 'tissue matches lung']

        # verify each filter is appropriate
        # and attempt to aggregate comparison operations per filter
        re_pattern = "((({}) +(contains|matches) +(\w+))|((nregions|cpg) *([<=>]+(=)?) *(\d+)(\.\d+)?))".format(re_ptrn_mc)
        #re_pattern = '^(((\w)+ +(contains|matches) +(\w+))|((nregions|cpg)([<=>]+(=)*)(\d)+((\.)*(\d)+)))'
        filter_regex = re.compile(re_pattern)
        filters_and_ops = {}
        for flist in ands:
            if flist[0].endswith('and'):
                f = flist[0][:-3]
            elif flist[0].endswith('or'):
                f = flist[0][:-2]
            else:
                f = flist[0]
            f = f.strip()

            result = filter_regex.match(f)
            if not result:
                return {"error": "bad parameter --> " + f}
            else:
                # we need to distinguish between id matches|contains <something>
                # and the nregions/cpg op kind of a filter here
                # try to split on comparison op
                s = re.split(r'([<=>]+(=)*)', f)
                # element 0 = filter name (nregions or cpg)
                # element 1 = comparison op (<, <=, =, >, >=)
                # element 3 = numeric value (float or int)
                if len(s) == 1: # cpg/nregions filter
                    t = r"({}) +(matches|contains) +(\w+)".format(re_ptrn_mc)
                    s = re.split(t, f)

                s = [ss for ss in s if ss is not None and ss != '']
                sn = s[0].strip()

                if sn in filters_and_ops:
                    # have we already processed a filter? if so, we need to append
                    # this is the case where, for example, we have nregions<2000 and nregions>500
                    if sn not in SEARCH_TERMS:
                        filters_and_ops[sn].append((elastic_ops.get(s[1]), s[2]))
                    else:
                        # this is not a range search but a match/contains search
                        filters_and_ops[sn].append(s[1], s[2])
                else:
                    if sn not in SEARCH_TERMS:
                        filters_and_ops[sn] = [(elastic_ops.get(s[1]), s[2])]
                        # filters_and_ops here looks something like (e.g.):
                        # {'num_regions': [('gte', '100'), ('eq', '20')], 'gc_content': [('lt', '0.30')]}
                        # build up the elastic query
                    else:
                        filters_and_ops[sn] = [(s[1], s[2])]

        musts = []
        for filter_name in filters_and_ops:
            val_list = filters_and_ops[filter_name]
            for (fltr, op_val) in val_list:
                # below approach is awkward since elasticsearch-dsl
                # needs the actual name of the field in the Range object
                # but NOT as string
                if filter_name in SEARCH_TERMS:
                    if fltr == "matches":
                        if filter_name == 'id':
                            musts.append(Q('match', id=op_val))
                        elif filter_name == 'species':
                            musts.append(Q('match', species=op_val))
                        elif filter_name == 'antibody':
                            musts.append(Q('match', antibody=op_val))
                        elif filter_name == 'treatment':
                            musts.append(Q('match', treatment=op_val))
                        elif filter_name == 'tissue':
                            musts.append(Q('match', tissue=op_val))
                        elif filter_name == 'description':
                            musts.append(Q('match', description=op_val))
                        elif filter_name == 'protocol':
                            musts.append(Q('match', protocol=op_val))
                        elif filter_name == 'genome':
                            musts.append(Q('match', genome=op_val))
                    elif fltr == "contains":
                        op_val = '*' + op_val + '*'
                        default_field = filter_name
                        #if filter_name == 'id':
                        musts.append(Q('query_string', query=op_val, default_field=default_field))
                        #elif filter_name == 'species':
                        #    musts.append(Q('query_string', query=op_val, default_field='species'))
                        #elif filter_name == 'antibody':
                        #    musts.append(Q('query_string', antibody=op_val))
                        #elif filter_name == 'treatment':
                        #    musts.append(Q('query_string', treatment=op_val))
                        #elif filter_name == 'tissue':
                        #    musts.append(Q('query_string', tissue=op_val))
                        #elif filter_name == 'description':
                        #    musts.append(Q('query_string', description=op_val))
                elif filter_name == 'nregions':
                    musts.append(Range(num_regions={fltr : int(op_val)}))
                elif filter_name == 'cpg':
                    musts.append(Range(gc_content={fltr : float(op_val)}))
                else:
                    # reserved for more filters
                    pass
        
        # use a scan search where we get ALL the results
        s = Search(using=es_client).query(Bool(must=musts)).to_dict()
        response = elasticsearch.helpers.scan(es_client, query=s, index=index_name)
        return {"result": response}
    return {"error": "no filters provided."}


# @app.get("/regionsets")
# async def bedstat_search(request: Request, filters: List[str] = Query(None)):
#     return bedstat_search_db(filters)


@app.post("/search")
async def parse_search_query(request: Request, search_text: str = Form(...)):

    # first = True signals the first filter in the list
    # last op will be the last operation from the previous filter ('and' or 'or')
    # prev is the previous filter in the list
    # cur is the curent filter in the list
    # and and ors are the separate lists of logical operation filters
    # we consult the previous filter's op to find out where to add the current filter (ands or ors)
    def process_single_filter(first, prev, cur, ands, ors):
        if len(cur) < 6:
            if prev[6] == 'and':
                append_to = ands
            else:
                append_to = ors
        elif prev[6] == 'and':
            append_to = ands
        elif prev[6] == 'or':
            append_to = ors
        else:
            raise Exception("Invalid logical op in filter search")
            
        if first:
            append_to.append(prev)
        append_to.append(cur)

    # construct re pattern for matches/contains
    re_ptrn_mc = "|".join(SEARCH_TERMS)
    
    # search for keywords like "and" or operators like ">" or "="
    #re_pattern="((((\w) +(contains|matches) +(\w))|((nregions|cpg) *([<=>]+(=)?) *(\d+)(\.\d+)?)) +(and|or)*)+"
    re_pattern = "((({}) +(contains|matches) +(\w+)( *(and|or))?)|((nregions|cpg) *([<=>]+(=)?) *(\d+)(\.\d+)?( *(and|or))?))+".format(re_ptrn_mc)

    filter_regex = re.compile(re_pattern)

    res_filtered = []
    # now run through the search_text and try to parse it
    ands = []
    ors = []
    regex_result = filter_regex.findall(search_text)

    regex_results_fixed = []
    for r in regex_result:
        tmp_lst = []
        for elem in r:
            if elem != '':
                elem = elem.lstrip().rstrip()
                #if elem.split(' ')[0] in ['nregions', 'cpg']:
                #    elem = elem.replace(' ', '')
                tmp_lst.append(elem)#.lstrip().rstrip())
        regex_results_fixed.append(tmp_lst)

    l = len(regex_results_fixed)

    if l > 1:
        # more than one search filter
        try:
            for idx in range(1, l):
                cur = regex_results_fixed[idx]
                prev = regex_results_fixed[idx-1]
                # is this a term search of nregions/cpg search filter?
                if idx == 1:
                    # first filter in the list
                    process_single_filter(True, prev, cur, ands, ors)
                else:
                    process_single_filter(False, prev, cur, ands, ors)
        except Exception as e:
            return {"result": "error", "reason": str(e)}
    elif l == 1:
        # just one search filter
        ands.append(regex_results_fixed[0])
    else:
        return {"result": "not found"}

    # here we can call the search function
    search_res = bedstat_search_db(ands, ors)
    if search_res["result"] == "no matching data found." or \
       search_res["result"] == "no filters provided.":
       return {"result": search_res["result"]}

    #print("search_res=", search_res["result"])
    # prepare to pass on the results to response template
    template_data = []
    # ss = search_res["result"]
    # _LOGGER.info("ss: {}".format(ss))
    for s in search_res["result"]:
        if 'id' in s["_source"]:
            bed_id = s["_source"]["id"][0]
            bed_data_url_template = \
                "http://{host}{re}?format=".format(host=host_ip, re=REGIONSET_ENDPOINT.format(id=bed_id))
            bed_url = bed_data_url_template + "html"
            bed_gz = bed_data_url_template + "bed"
            bed_json = bed_data_url_template + "json"
            template_data.append((bed_id, bed_url, bed_gz, bed_json))
    if len(template_data) > 0:
        vars = {"request": request, "result": template_data}
        return templates.TemplateResponse("response_search.html", dict(vars, **ALL_VERSIONS))
    return {"result": "no data matches search criteria."}


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
    print(cfg)
    est_elastic_conn(cfg)
    bedstat_base_path = get_bedstat_base_path(cfg)
    host_ip, host_port = get_server_cfg(cfg)
    if args.command == "serve":
        app.mount(bedstat_base_path, StaticFiles(directory=bedstat_base_path), name="bedfile_stats")
        _LOGGER.info("running bedhost app")
        uvicorn.run(app, host="0.0.0.0", port=args.port)
