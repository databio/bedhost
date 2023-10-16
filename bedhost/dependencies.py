from bedhost.helpers import BedHostConf
import os

bb_conf_file_path = os.environ.get("BEDBASE_CONFIG") or None

try:
    bedbase_conf = BedHostConf(bb_conf_file_path)
except Exception as e:
    bedbase_conf = None


def get_bbconf() -> BedHostConf:
    return bedbase_conf
