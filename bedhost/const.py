from bedhost._version import __version__ as server_v
from bbconf._version import __version__ as bbconf_v
from platform import python_version
from bbconf.const import *
import os
PKG_NAME = "bedhost"
LOG_FORMAT = "%(levelname)s in %(funcName)s: %(message)s"

# for now bedstat version is hard coded
ALL_VERSIONS = {"apiserver_version": server_v, "bbconf_version": bbconf_v, "python_version": python_version()}
TEMPLATES_DIRNAME = "templates"
TEMPLATES_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), TEMPLATES_DIRNAME)
STATIC_DIRNAME = "static"
STATIC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), STATIC_DIRNAME)
BEDFILE_API_ENDPOINT = "bedfile"
BEDSET_API_ENDPOINT = "bedset"
TYPES_MAPPING = {"long": "integer", "float": "double", "text": "string"}
VALIDATIONS_MAPPING = {
    "long": {"min": 0, "step": 1},
    "float": {"min": 0, "step": 0.01},
    "text": None
}
ALL_QUERY = {"query": {"match_all": {}}}
# the operator lists below are intentionally string representation of lists since they are
# intended to populate JavaScript code in the Jinja2 template
NUMERIC_OPERATORS = '["equal", "not_equal", "greater", "greater_or_equal", "between", "less", ' \
                    '"less_or_equal", "is_null", "is_not_null"]'
TEXT_OPERATORS = '["equal", "not_equal", "in", "not_in", "is_null", "is_not_null"]'
OPERATORS_MAPPING = {"text": TEXT_OPERATORS,
                     "float": NUMERIC_OPERATORS,
                     "long": NUMERIC_OPERATORS}