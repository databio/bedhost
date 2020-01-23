from bedhost._version import __version__ as server_v
from platform import python_version
from bbconf.const import *
import os
PKG_NAME = "bedhost"
CFG_ENV_VARS = ["BEDHOST"]
LOG_FORMAT = "%(levelname)s in %(funcName)s: %(message)s"
DEFAULT_PORT = 80
DEFAULT_IP = '0.0.0.0'
# for now bedstat version is hard coded
ALL_VERSIONS = {"apiserver_version": server_v, "bedstat_version": "0.0.1", "python_version": python_version()}
TEMPLATES_DIRNAME = "templates"
TEMPLATES_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), TEMPLATES_DIRNAME)
STATIC_DIRNAME = "static"
STATIC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), STATIC_DIRNAME)
RSET_API_ENDPOINT = "regionset"
RSET_ID_URL = "http://{}/" + RSET_API_ENDPOINT + "?id={}"