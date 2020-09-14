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
TYPES_MAPPING = {"integer": "integer", "double precision": "double", "character varying": "string"}
VALIDATIONS_MAPPING = {
    "integer": {"min": 0, "step": 1},
    "double precision": {"min": 0, "step": 0.01},
    "character varying": None
}
# the operator lists below are intentionally string representation of lists since they are
# intended to populate JavaScript code in the Jinja2 template
NUMERIC_OPERATORS = '["equal", "not_equal", "greater", "greater_or_equal", "between", "less", ' \
                    '"less_or_equal", "is_null", "is_not_null"]'
TEXT_OPERATORS = '["equal", "not_equal", "in", "not_in", "is_null", "is_not_null"]'
OPERATORS_MAPPING = {"character varying": TEXT_OPERATORS,
                     "double precision": NUMERIC_OPERATORS,
                     "integer": NUMERIC_OPERATORS}
INIT_ELASTIC = {'bool': {'must': [{'range': {'gc_content': {'gt': 0.5}}}]}}
INIT_POSTGRES_CONDITION = "gc_content>0.5"
INIT_QUERYBUILDER = {'condition': 'AND', 'rules': [
    {'id': 'gc_content',
     'field': 'gc_content',
     'type': 'double',
     'input': 'number',
     'operator': 'greater',
     'value': 0.5}
], 'valid': True}
CUR_RESULT = "current_result"
CUR_RULES = "current_rules"
