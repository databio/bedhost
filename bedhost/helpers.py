from .const import *
from ._version import __version__ as v
from ubiquerg import VersionInHelpParser
from yacman import get_first_env_var


def build_parser():
    """
    Building argument parser

    :return argparse.ArgumentParser
    """
    env_var_val = get_first_env_var(CFG_ENV_VARS)[1] if get_first_env_var(CFG_ENV_VARS) is not None else "not set"
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
            help="A path to the bedhost config file (YAML). If not provided, the first available environment variable "
                 "among: \'{}\' will be used if set. Currently: {}".format(", ".join(CFG_ENV_VARS), env_var_val))
        sps[cmd].add_argument(
            "-d", "--dbg",
            action="store_true",
            dest="debug",
            help="Set logger verbosity to debug")
    # add subparser-specific arguments
    sps["serve"].add_argument(
        "-p", "--port",
        dest="port",
        type=int,
        help="The port the webserver should be run on.", default=DEFAULT_PORT)
    return parser


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
