from logging import getLogger
from urllib import parse

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


def get_search_setup(bbc):
    """
    Create a query setup for a Jinja2 template.
    The setup is used ot populate a queryBuilder in a JavaScript code.

    :param bbconf.BedBaseConf bbc: bedbase configuration object
    :return list[dict]: a list dictionaries with search setup to populate the
        JavaScript code with
    """
    columns = bbc.get_bedfiles_table_columns_types()
    setup_dicts = []
    for col in columns:
        try:
            setup_dicts.append({"id": col["column_name"],
                                "label": col["column_name"].replace("_", " "),
                                "type": TYPES_MAPPING[col["data_type"]],
                                "validation": VALIDATIONS_MAPPING[col["data_type"]],
                                "operators": OPERATORS_MAPPING[col["data_type"]]
                                })
        except (AttributeError, KeyError):
            _LOGGER.warning(f"Database column '{col['column_name']}' of type "
                            f"'{col['data_type']}' has no query builder "
                            f"settings predefined, skipping.")
    _LOGGER.debug("search setup: {}".format(setup_dicts))
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
                                "?md5sum={}&format=".format(h[JSON_MD5SUM_KEY])
        template_data.append([h[JSON_NAME_KEY]] +
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
    hits = bbc._select_all(BEDSET_TABLE)
    bm = dict()
    if not hits:
        return
    for hit in hits:
        bedset_md5sum = hit[JSON_MD5SUM_KEY]
        bedset_id = hit[JSON_NAME_KEY]
        bm.update({bedset_id: get_param_url(request.url_for("bedsetsplash"),
                                            {"md5sum": bedset_md5sum})})
    return bm


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
