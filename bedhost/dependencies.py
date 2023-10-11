from bedhost.helpers import BedHostConf
import os

bb_conf_file_path = os.environ.get("BEDBASE_CONFIG") or os.path.join(
    os.path.dirname(__file__), "bb_conf.yaml"
)

bedbase_conf = BedHostConf(bb_conf_file_path)


def get_bbconf() -> BedHostConf:
    return bedbase_conf
