import os
from platform import python_version
from bbconf import __version__ as bbconf_v

from ._version import __version__ as SERVER_VERSION

PKG_NAME = "bedhost"

# for now bedstat version is hard coded
ALL_VERSIONS = {
    "bedhost_version": SERVER_VERSION,
    "bbconf_version": bbconf_v,
    "python_version": python_version(),
}
TEMPLATES_DIRNAME = "templates"
STATIC_DIRNAME = "../docs"
STATIC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), STATIC_DIRNAME)

EXAMPLE_BED = "bbad85f21962bb8d972444f7f9a3a932"
EXAMPLE_BEDSET = "gse218680"
