from bedhost._version import __version__ as server_v
from bbconf._version import __version__ as bbconf_v
from platform import python_version
from bbconf.const import *
import os
from enum import Enum
PKG_NAME = "bedhost"
LOG_FORMAT = "%(levelname)s in %(funcName)s: %(message)s"

# for now bedstat version is hard coded
ALL_VERSIONS = {"apiserver_version": server_v, "bbconf_version": bbconf_v, "python_version": python_version()}
TEMPLATES_DIRNAME = "templates"
TEMPLATES_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), TEMPLATES_DIRNAME)
STATIC_DIRNAME = "static"
STATIC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), STATIC_DIRNAME)

UI_PATH = os.path.join(os.path.dirname(__file__), "static", "bedhost-ui")

BEDFILE_API_ENDPOINT = "bedfile"
BEDSET_API_ENDPOINT = "bedset"
TYPES_MAPPING = {"integer": "integer", "double precision": "double", "character varying": "string"}
VALIDATIONS_MAPPING = {
    "integer": {"min": 0, "step": 1},
    "double precision": {"min": 0, "step": 0.01},
    "character varying": None
}
NUMERIC_OPERATORS = ["equal", "not_equal", "greater", "greater_or_equal",
                     "between", "less", "less_or_equal", "is_null",
                     "is_not_null"]
TEXT_OPERATORS = ["equal", "not_equal", "in", "not_in", "is_null", "is_not_null"]
OPERATORS_MAPPING = {"character varying": TEXT_OPERATORS,
                     "double precision": NUMERIC_OPERATORS,
                     "integer": NUMERIC_OPERATORS}
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


class FigFormat(str, Enum):
    png = "png"
    pdf = "pdf"


class FileColumnBedset(str, Enum):
    PEP = "PEP"
    iGD_database = "iGD_database"
    bedset_tar = "bedset_tar"
    summary_stats = "summary_stats"
    bedfiles_stats = "bedfiles_stats"


class FileColumnBed(str, Enum):
    bedfile = "bedfile"


class TableName(str, Enum):
    bedfiles = "bedfiles"
    bedsets = "bedsets"


file_map_bedset = {
    "PEP": "bedset_pep",
    "iGD_database": "bedset_igd_database_path",
    "bedset_tar": "bedset_tar_archive_path",
    "summary_stats": "bedset_gd_stats",
    "bedfiles_stats": "bedset_bedfiles_gd_stats"
}

file_map_bed = {
    "bedfile": "bedfile_path",
}