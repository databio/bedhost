from _version import __version__ as server_v
from platform import python_version
# for now bedstat version is hard coded
ALL_VERSIONS = {"apiserver_version": server_v, "bedstat_version": "0.0.1", "python_version": python_version()}
