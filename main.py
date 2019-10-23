from fastapi import FastAPI, HTTPException, Query
from starlette.responses import FileResponse
from starlette.templating import Jinja2Templates

import json
import yaml

#import tempfile
#from datetime import datetime
#import re

from elasticsearch import Elasticsearch
from elasticsearch import helpers
from elasticsearch.serializer import JSONSerializer

# FASTAPI code starts
app = FastAPI(
    title="bedstat-rest-api server",
    description="BED file statistics and image server API",
    version="0.0.1"
)

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

# pick up base path for the json out of bedstat pipeline and generated PNG images
with open("config.yaml", 'r') as ymlfile:
    cfg = yaml.load(ymlfile)

bedstat_json_base_path = cfg['bed_base_path']

@app.get("/bedstat/{id}")
async def bedstat_serve():
    return {"message": "Hello World"}

