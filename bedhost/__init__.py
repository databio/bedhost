import logmuse

from bedhost.const import PKG_NAME
from dotenv import load_dotenv

_LOGGER = logmuse.init_logger(PKG_NAME)
load_dotenv()
