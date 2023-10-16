from bedhost.helpers import BedHostConf
import os
from bedhost.exceptions import BedHostException

bb_conf_file_path = os.environ.get("BEDBASE_CONFIG") or None

try:
    bedbase_conf = BedHostConf(bb_conf_file_path)
except Exception as e:
    raise BedHostException(f"Bedbase config was not provided or is incorrect: {e}")


def get_bbconf() -> BedHostConf:
    return bedbase_conf
