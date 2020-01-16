from bedhost._version import __version__ as server_v
from platform import python_version
PKG_NAME = "bedhost"
CFG_ENV_VARS = ["BEDHOST"]
LOG_FORMAT = "%(levelname)s in %(funcName)s: %(message)s"
DEFAULT_PORT = 80
# for now bedstat version is hard coded
ALL_VERSIONS = {"apiserver_version": server_v, "bedstat_version": "0.0.1", "python_version": python_version()}
