from logging import getLogger
from urllib import parse
from starlette.responses import RedirectResponse, FileResponse
from starlette.exceptions import HTTPException

from .const import *
from ._version import __version__ as v
from ubiquerg import VersionInHelpParser
from yacman import get_first_env_var

_LOGGER = getLogger(PKG_NAME)


def build_parser():
    """
    Building argument parser

    :return argparse.ArgumentParser
    """
    env_var_val = get_first_env_var(CFG_ENV_VARS)[1] \
        if get_first_env_var(CFG_ENV_VARS) is not None else "not set"
    banner = "%(prog)s - REST API for the bedstat pipeline produced statistics"
    additional_description = "For subcommand-specific options, type: '%(prog)s <subcommand> -h'"
    additional_description += "\nhttps://github.com/databio/bedhost"

    parser = VersionInHelpParser(
        prog=PKG_NAME,
        description=banner,
        epilog=additional_description)

    parser.add_argument(
        "-V", "--version",
        action="version",
        version="%(prog)s {v}".format(v=v))

    msg_by_cmd = {
        "serve": "run the server"
    }

    subparsers = parser.add_subparsers(dest="command")

    def add_subparser(cmd, description):
        return subparsers.add_parser(
            cmd, description=description, help=description)

    sps = {}
    # add arguments that are common for both subparsers
    for cmd, desc in msg_by_cmd.items():
        sps[cmd] = add_subparser(cmd, desc)
        sps[cmd].add_argument(
            '-c', '--config', required=False, dest="config",
            help="A path to the bedhost config file (YAML). If not provided, "
                 "the first available environment variable among: \'{}\' will be used if set."
                 " Currently: {}".format(", ".join(CFG_ENV_VARS), env_var_val))
        sps[cmd].add_argument(
            "-d", "--dbg",
            action="store_true",
            dest="debug",
            help="Set logger verbosity to debug")
    return parser


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
                "id": col_name, "label": col_schema["description"],
                "type": TYPES_MAPPING[col_schema["type"]],
                "validation": VALIDATIONS_MAPPING[col_schema["type"]],
                "operators": OPERATORS_MAPPING[col_schema["type"]]
            }
        except (AttributeError, KeyError):
            _LOGGER.warning(f"Database column '{col_name}' of type "
                            f"'{col_schema['type']}' has no query builder "
                            f"settings predefined, skipping.")
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
        bed_data_url_template = request.url_for("bedfile") + \
                                "?md5sum={}&format=".format(h["md5sum"])
        template_data.append([h["name"]] +
                             [bed_data_url_template + ext
                              for ext in ["html", "bed", "json"]])
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
    hits = bbc.bedset.select()
    if not hits:
        return
    # TODO: don't hardcode url path element name, use operationID?
    return {hit["name"]: get_param_url(
        request.url_for("bedsetsplash"), {"md5sum": hit["md5sum"]})
        for hit in hits}


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
    schema = getattr(getattr(bbc, table_name2attr(table_name), None), "schema", None)
    if schema is None:
        msg = f"Could not determine columns for table: {table_name}"
        _LOGGER.warning(msg)
        raise HTTPException(status_code=404, detail=msg)
    diff = set(columns).difference([c[0] for c in list(schema.keys())])
    if diff:
        msg = f"Columns not found in '{table_name}' table: {', '.join(diff)}"
        _LOGGER.warning(msg)
        raise HTTPException(status_code=404, detail=msg)


def serve_columns_for_table(bbc, table_name, columns=None, digest=None):
    """
    Serve data from selected columns for selected table

    :param bbconf.BedBaseConf bbc: bedbase configuration object
    :param str table_name: table name to query
    :param list[str] columns: columns to return
    :param str digest: entry digest to restrivt the results to
    :return dict: servable DB search result, selected column names and data
    """
    if columns:
        assert_table_columns_match(
            bbc=bbc, table_name=table_name, columns=columns)
    table_manager = getattr(bbc, table_name2attr(table_name), None)
    if table_manager is None:
        msg = f"Failed to serve columns for '{table_name}' table, " \
              f"PipestatManager object not accessible."
        _LOGGER.warning(msg)
        raise HTTPException(status_code=404, detail=msg)
    res = table_manager.select(
        condition="md5sum=%s" if digest else None,
        condition_val=[digest] if digest else None,
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


def table_name2attr(table_name):
    """
    Convert the table name to attribute that can be used to refer to the
    table managers

    :param str table_name: name to convert
    :return str: name of the BedBaseConf attribute to use
    """
    # TODO: just switch to the actual bbconf attributes?
    if table_name == "bedfiles":
        return "bed"
    elif table_name == "bedsets":
        return "bedset"
    return table_name


def serve_file(path, remote):
    """
    Serve a local or remote file

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
