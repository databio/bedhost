from logging import getLogger

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
    :return list[dict]: a list dictionaries with search setup to populate the JavaScript code with
    """
    mapping = bbc.get_bedfiles_mapping()
    attrs = list(mapping.keys())
    setup_dicts = []
    for attr in attrs:
        try:
            attr_type = mapping[attr]["type"]
        except KeyError:
            _LOGGER.warning("Attribute '{}' does not have type defined. "
                            "Is it a nested mapping?".format(attr))
            continue
        setup_dicts.append({"id": attr,
                            "label": attr.replace("_", " "),
                            "type": TYPES_MAPPING[attr_type],
                            "validation": VALIDATIONS_MAPPING[attr_type],
                            "operators": OPERATORS_MAPPING[attr_type]
                            })
    _LOGGER.debug("search setup: {}".format(setup_dicts))
    return setup_dicts


def construct_search_data(ids, request):
    """
    Construct a list of links to display as the search result

    :param bbconf.BedBaseConf bbc: bedbase configuration object
    :param Iterable[str] ids: ids to compose the list for
    :return Iterable[str]: results to display
    """
    template_data = []
    for bed_id in ids:
        bed_data_url_template = request.url_for("bedfile") + "?id={}&format=".format(bed_id)
        template_data.append([bed_id] +
                             [bed_data_url_template + ext for ext in ["html", "bed", "json"]])
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
