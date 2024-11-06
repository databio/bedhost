from ubiquerg import VersionInHelpParser

from . import PKG_NAME
from ._version import __version__


def build_parser():
    """
    Building argument parser

    :return argparse.ArgumentParser
    """

    # env_var_val = select_config(config_env_vars=CFG_ENV_VARS)

    banner = "%(prog)s - REST API for the bedstat pipeline produced statistics"
    additional_description = (
        "For subcommand-specific options, type: '%(prog)s <subcommand> -h'"
    )
    additional_description += "\nhttps://github.com/databio/bedhost"

    parser = VersionInHelpParser(
        prog=PKG_NAME, description=banner, epilog=additional_description
    )

    parser.add_argument(
        "-V", "--version", action="version", version=f"%(prog)s {__version__}"
    )

    msg_by_cmd = {"serve": "run the server"}

    subparsers = parser.add_subparsers(dest="command")

    def add_subparser(cmd, description):
        return subparsers.add_parser(cmd, description=description, help=description)

    sps = {}
    # add arguments that are common for both subparsers
    for cmd, desc in msg_by_cmd.items():
        sps[cmd] = add_subparser(cmd, desc)
        sps[cmd].add_argument(
            "-c",
            "--config",
            required=False,
            dest="config",
            help="A path to the bedhost config file (YAML). If not provided, "
            f"the first available environment variable among: {', '.join(CFG_ENV_VARS)} will be used if set.",
        )
    return parser
