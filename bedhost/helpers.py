import enum
from urllib import parse

from bbconf import BedBaseConf
from starlette.exceptions import HTTPException
from starlette.responses import FileResponse, RedirectResponse

from ._version import __version__ as v
from .const import *

from bedhost import _LOGGER


class BedHostConf(BedBaseConf):
    """
    An extended BedBaseConf object that adds some BedHost-specific functions
    """

    def __init__(self, config_path: str = None):
        super().__init__(config_path)

    def serve_file(self, path, remote=None):
        """
        Serve a local or remote file

        :param str path: relative path to serve
        :param bool remote: whether to redirect to a remote source or serve local
        """
        remote = remote or self.is_remote
        if remote:
            _LOGGER.info(f"Redirecting to: {path}")
            return RedirectResponse(path)
        _LOGGER.info(f"Returning local: {path}")
        if os.path.isfile(path):
            return FileResponse(
                path,
                headers={
                    "Content-Disposition": f"inline; filename={os.path.basename(path)}"
                },
            )
        else:
            msg = f"File not found on server: {path}"
            _LOGGER.warning(msg)
            raise HTTPException(status_code=404, detail=msg)

    def bed_retrieve(self, digest, column: str):
        ## TODO: Should be self.bed.retrieve(digest, column)
        try:
            return self.bed.retrieve(digest)[column]
        except KeyError:  # Probably should be something else
            return {}

    def bedset_retrieve(self, digest, column: str):
        try:
            return self.bedset.retrieve(digest)[column]
        except KeyError:
            return {}


def get_search_setup(schema):
    """
    Create a query setup for QueryBuilder to interface the DB.

    :param dict schema: pipestat schema
    :return list[dict]: a list dictionaries with search setup to use
        in QueryBuilder
    """
    setup_dicts = []
    for col_name, col_schema in schema.items():
        try:
            setup_dict = {
                "id": col_name,
                "label": col_schema["description"],
                "type": TYPES_MAPPING[col_schema["type"]],
                "validation": VALIDATIONS_MAPPING[col_schema["type"]],
                "operators": OPERATORS_MAPPING[col_schema["type"]],
            }
        except (AttributeError, KeyError):
            _LOGGER.warning(
                f"Database column '{col_name}' of type "
                f"'{col_schema['type']}' has no query builder "
                f"settings predefined, skipping."
            )
        else:
            setup_dicts.append(setup_dict)
    return setup_dicts


def construct_search_data(hits, request):
    """
    Construct a list of links to display as the search result

    :param Iterable[str] hits: ids to compose the list for
    :param starlette.requests.Request request: request for the context
    :return Iterable[str]: results to display
    """
    template_data = []
    for h in hits:
        bed_data_url_template = request.url_for(
            "bedfile"
        ) + "?md5sum={}&format=".format(h["md5sum"])
        template_data.append(
            [h["name"]]
            + [bed_data_url_template + ext for ext in ["html", "bed", "json"]]
        )
    return template_data


def get_mounted_symlink_path(symlink):
    """
    Get path to the symlinks target on a mounted filesystem volume.
    Accounts for both transformed and non-transformed symlink targets

    :param str symlink: absolute symlink path
    :return str: path to the symlink target on the mounted volume
    """

    def _find_mount_point(path):
        path = os.path.abspath(path)
        while not os.path.ismount(path):
            path = os.path.dirname(path)
        return path

    link_tgt = os.readlink(symlink)
    if not os.path.isabs(link_tgt):
        _LOGGER.debug("Volume mounted with symlinks transformation")
        return os.path.abspath(os.path.join(os.path.dirname(symlink), link_tgt))
    mnt_point = _find_mount_point(symlink)
    first = os.path.relpath(symlink, mnt_point).split("/")[0]
    common_idx = link_tgt.split("/").index(first)
    rel_tgt = os.path.join(*link_tgt.split("/")[common_idx:])
    return os.path.join(mnt_point, rel_tgt)


def get_all_bedset_urls_mapping(bbc, request):
    """
    Get a mapping of all bedset ids and corrsponding splaspages urls

    :param bbconf.BedBaseConf bbc: bedbase configuration object
    :param starlette.requests.Request request: request context for url generation
    :return Mapping: a mapping of bedset ids and the urls to the corresponding splashpages
    """
    hits = bbc.bedset.select(columns=["name", "md5sum"])
    if not hits:
        return
    # TODO: don't hardcode url path element name, use operationID?
    return {
        hit.name: get_param_url(request.url_for("bedsetsplash"), {"md5sum": hit.md5sum})
        for hit in hits
    }


def get_param_url(url, params):
    """
    Create parametrized URL

    :param str url: URL base to parametrize
    :param Mapping params: a mapping of URL parameters and values
    :return str: parametrized URL
    """
    if not params:
        return url
    return url + "?" + parse.urlencode(params)


def get_openapi_version(app):
    """
    Get the OpenAPI version from the OpenAPI description JSON

    :param fastapi.FastAPI app: app object
    :return str: openAPI version in use
    """
    try:
        return app.openapi()["openapi"]
    except Exception:
        return "3.0.2"


def assert_table_columns_match(bbc, table_name, columns):
    """
    Verify that the selected list of columns exists in the database and react approprietly

    :param str table_name: name of the table, either bedfiles or bedsets
    :param str | list[str] columns: collection columns to check
    :raises HTTPException: in case there is a columns mismatch
    """
    if isinstance(columns, str):
        columns = [columns]
    if table_name == "bedfiles":
        schema = bbc.bed.schema
    elif table_name == "bedsets":
        schema = bbc.bedset.schema
    if schema is None:
        msg = f"Could not determine columns for table: {table_name}"
        _LOGGER.warning(msg)
        raise HTTPException(status_code=404, detail=msg)
    diff = set(columns).difference(list(schema.sample_level_data.keys()))
    if diff:
        msg = f"Columns not found in '{table_name}' table: {', '.join(diff)}"
        _LOGGER.warning(msg)
        raise HTTPException(status_code=404, detail=msg)


# def serve_columns_for_table(bbc, table_name, columns=None, digest=None, limit=None):
#     """
#     Serve data from selected columns for selected table

#     :param bbconf.BedBaseConf bbc: bedbase configuration object
#     :param str table_name: table name to query
#     :param list[str] columns: columns to return
#     :param str digest: entry digest to restrict the results to
#     :return dict: servable DB search result, selected column names and data
#     """
#     if columns:
#         assert_table_columns_match(bbc=bbc, table_name=table_name, columns=columns)

#     table_manager = getattr(bbc, table_name2attr(table_name), None)
#     if table_manager is None:
#         msg = (
#             f"Failed to serve columns for '{table_name}' table, "
#             f"PipestatManager object not accessible."
#         )
#         _LOGGER.warning(msg)
#         raise HTTPException(status_code=404, detail=msg)
#     res = table_manager.select(
#         filter_conditions=[("md5sum", "eq", digest)] if digest else None,
#         columns=columns,
#         limit=limit,
#     )
#     if res:
#         colnames = list(res[0].keys())
#         values = [list(x) for x in res]
#         _LOGGER.info(f"Serving data for columns: {colnames}")
#     else:
#         _LOGGER.warning("No records matched the query")
#         colnames = []
#         values = [[]]
#     return {"columns": colnames, "data": values}

# def get_id_map(bbc, table_name, file_type):
#     """
#     Get a dict for avalible file/figure ids

#     :param str table_name: table name to query
#     :param st file_type: "file" or "image"
#     :return dict
#     """

#     id_map = {}

#     schema = serve_schema_for_table(bbc=bbc, table_name=table_name)
#     # This is basically just doing this:
#     # if table_name == BED_TABLE:
#     #     schema = bbc.bed.schema
#     # if table_name == BEDSET_TABLE:
#     #     schema = bbc.bedset.schema
#     # TODO: Eliminate the need for bedhost to be aware of table names; this should be abstracted away by bbconf/pipestat
#     for key, value in schema.sample_level_data.items():
#         if value["type"] == file_type:
#             id_map[value["label"]] = key

#     return id_map


# def get_enum_map(bbc, table_name, file_type):
#     """
#     Get a dict of file/figure labels

#     :param str table_name: table name to query
#     :param st file_type: "file" or "image"
#     :return dict
#     """

#     enum_map = {}
#     _LOGGER.debug(f"Getting enum map for {file_type} in {table_name}")

#     # TO FIX: I think we need a different way to get the schema
#     schema = serve_schema_for_table(bbc=bbc, table_name=table_name)

#     for key, value in schema.sample_level_data.items():
#         if value["type"] == file_type:
#             enum_map[value["label"]] = value["label"]

#     return enum_map
