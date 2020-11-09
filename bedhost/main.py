import uvicorn
import sys
from fastapi import FastAPI, HTTPException, Path, Query
from starlette.responses import FileResponse, RedirectResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from typing import List, Optional
from logging import INFO, DEBUG

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


def _serve_columns_for_table(bbc, table_name, columns=None, digest=None):
    """
    Serve data from selected columns for selected table

    :param bbconf.BedBaseConf bbc: bedbase configuration object
    :param str table_name: table name to query
    :param list[str] columns: columns to return
    :param str digest: entry digest to restrivt the results to
    :return:
    """
    if isinstance(columns, str):
        columns = [columns]
    if columns:
        coldata_getter = bbc.get_bedfiles_table_columns_types \
            if table_name == BED_TABLE else bbc.get_bedsets_table_columns_types
        diff = set(columns).difference([c[0] for c in coldata_getter()])
        if diff:
            msg = f"Columns not found in '{table_name}' table: {', '.join(diff)}"
            _LOGGER.warning(msg)
            raise HTTPException(status_code=404, detail=msg)
    res = bbc.select(
        table_name=table_name,
        condition=f"{JSON_MD5SUM_KEY}='{digest}'" if digest else None,
        columns=columns
    )
    if res:
        colnames = list(res[0].keys())
        values = [list(x.values()) for x in res]
        _LOGGER.info(f"Serving data for columns: {colnames}")
    else:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]
    return {"columns": colnames, "data": values}


def _serve_file(path, remote):
    """
    Serve local or remote file

    :param str path: relative path to serve
    :param bool remote: whether to redirect to a remote source or serve local
    """
    if remote:
        _LOGGER.info(f"Redirecting to: {path}")
        return RedirectResponse(path)
    _LOGGER.info(f"Returning local: {path}")
    if os.path.isfile(path):
        return FileResponse(path,  headers={
            "Content-Disposition": f"inline; filename={os.path.basename(path)}"})
    else:
        msg = f"File not found on server: {path}"
        _LOGGER.warning(msg)
        raise HTTPException(status_code=404, detail=msg)

# misc endpoints


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


# bed endpoints
@app.get("/api/bed/all/data/count")
async def get_bedfile_count():
    """
    Returns the number of bedfiles available in the database
    """
    return int(bbc.count_bedfiles())


@app.get("/api/bed/all/data")
async def get_all_bed_metadata(
        ids: Optional[List[str]] = Query(
            None,
            description="Bedfiles table column name"
        )
):
    """
    Get bedfiles data for selected columns
    """
    return _serve_columns_for_table(bbc=bbc, table_name=BED_TABLE, columns=ids)


@app.get("/api/bed/{md5sum}/data")
async def get_bedfile_data(
        md5sum: str = Path(
            ...,
            description="digest"),
        ids: Optional[List[str]] = Query(
            None,
            description="Column name to select from the table")
):
    """
    Returns data from selected columns for selected bedfile
    """
    return _serve_columns_for_table(
        bbc=bbc,
        table_name=BED_TABLE,
        columns=ids,
        digest=md5sum
    )


@app.get("/api/bed/{md5sum}/file/{id}")
async def get_file_for_bedfile(
        md5sum: str = Path(
            ...,
            description="digest"),
        id: FileColumnBed = Path(
            ...,
            description="File identifier")
):
    files = bbc.select(table_name=BED_TABLE,
                       condition=f"{JSON_MD5SUM_KEY}='{md5sum}'",
                       columns=file_map_bed[id.value])[0][0]
    remote = True if bbc[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(bbc.get_bedstat_output_path(remote), files)
    return _serve_file(path, remote)


@app.get("/api/bed/{md5sum}/img/{id}")
async def get_image_for_bedfile(
        md5sum: str = Path(
            ...,
            description="digest"),
        id: str = Path(
            ...,
            description="Figure identifier"),
        format: FigFormat = Query(
            "pdf",
            description="Figure file format")
):
    """
    Returns the bedfile plot with provided ID in provided format
    """
    imgs = bbc.select(table_name=BED_TABLE,
                      condition=f"{JSON_MD5SUM_KEY} = '{md5sum}'",
                      columns=["name", "plots"])
    remote = True if bbc[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(bbc.get_bedstat_output_path(remote),
                        md5sum, f"{imgs[0][0]}_{id}.{format}")
    return _serve_file(path, remote)


# bedset endpoints

@app.get("/api/bedset/all/data/count")
async def get_bedset_count():
    """
    Returns the number of bedsets available in the database
    """
    return int(bbc.count_bedsets())


@app.get("/api/bedset/all/data")
async def get_all_bedset_metadata(
        ids: Optional[List[str]] = Query(
            None,
            description="Bedsets table column name"
        )
):
    """
    Get bedsets data for selected columns
    """

    return _serve_columns_for_table(bbc=bbc, table_name=BEDSET_TABLE, columns=ids)


@app.get("/api/bedset/{md5sum}/bedfiles")
async def get_bedfiles_in_bedset(
        md5sum: str = Path(..., description="digest"),
        ids: Optional[List[str]] = Query(
            None,
            description="Bedfiles table column name"
        )
):
    avail_cols = [c[0] for c in bbc.get_bedfiles_table_columns_types()]
    if ids and ids not in avail_cols:
        msg = f"Column '{ids}' not found in '{BED_TABLE}' table"
        _LOGGER.warning(msg)
        raise HTTPException(status_code=404, detail=msg)
    res = bbc.select_bedfiles_for_bedset(
        query=f"md5sum='{md5sum}'",
        bedfile_col=ids
    )
    colnames = list(res[0].keys())
    values = list(res.values())
    _LOGGER.info(f"Serving data for columns: {colnames}")
    return {"columns": colnames, "data": values}


@app.get("/api/bedset/{md5sum}/data")
async def get_bedset_data(
        md5sum: str = Path(
            ...,
            description="digest"
        ),
        ids: Optional[List[str]] = Query(
            None,
            description="Column name to select from the table"
        )
):
                        
    """
    Returns data from selected columns for selected bedset
    """
    return _serve_columns_for_table(
        bbc=bbc,
        table_name=BEDSET_TABLE,
        columns=ids,
        digest=md5sum
    )


@app.get("/api/bedset/{md5sum}/file/{id}")
async def get_file_for_bedset(
        md5sum: str = Path(
            ...,
            description="digest"),
        id: FileColumnBedset = Path(
            ...,
            description="File identifier")
):
    files = bbc.select(table_name=BEDSET_TABLE,
                       condition=f"{JSON_MD5SUM_KEY}='{md5sum}'",
                       columns=file_map_bedset[id.value])[0][0]
    _LOGGER.debug(f"files: {files}")
    remote = True if bbc[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(bbc.get_bedbuncher_output_path(remote), files)
    return _serve_file(path, remote)


@app.get("/api/bedset/{md5sum}/img/{id}")
async def get_image_for_bedset(
        md5sum: str = Path(
            ...,
            description="digest"),
        id: str = Path(
            ...,
            description="Figure identifier"),
        format: FigFormat = Query(
            "pdf",
            description="Figure file format")
):
    """
    Returns the img with provided ID
    """
    imgs = bbc.select(table_name=BEDSET_TABLE,
                      condition=f"{JSON_MD5SUM_KEY} = '{md5sum}'",
                      columns=["name", "plots"])
    remote = True if bbc[CFG_PATH_KEY][CFG_REMOTE_URL_BASE_KEY] else False
    path = os.path.join(bbc.get_bedbuncher_output_path(remote),
                        md5sum, f"{imgs[0][0]}_{id}.{format}")
    return _serve_file(path, remote)


# private API


@app.get("/_private_api/query/{table_name}/{query}")
async def get_query_results(
        table_name: TableName = Path(
            ...,
            description="DB Table name"),
        query: str = Path(
            None,
            description="DB query to perform"),
        columns: Optional[List[str]] = Query(
            None,
            description="Column names to include in the query result")
):
    """
    Return query results with provided table name and query string
    """
    return bbc.select(table_name=table_name, condition=query, columns=columns)


@app.get("/_private_api/filters/{table_name}")
async def get_search_setup_for_table(
        table_name: TableName = Path(
            ...,
            description="DB Table name"
        )
):
    """
    Returns the filters mapping to based on the selected table schema to
    construct the queryBuilder to interface the DB
    """
    if table_name.value == BED_TABLE:
        return get_search_setup(bbc.get_bedfiles_table_columns_types())
    return get_search_setup(bbc.get_bedsets_table_columns_types())


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

        app.mount("/", StaticFiles(directory=UI_PATH))

        _LOGGER.info("running {} app".format(PKG_NAME))
        uvicorn.run(app, host=bbc[CFG_SERVER_KEY][CFG_HOST_KEY],
                    port=bbc[CFG_SERVER_KEY][CFG_PORT_KEY])