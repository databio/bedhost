import logmuse
import logging
from .const import PKG_NAME

_LOGGER = logmuse.init_logger(PKG_NAME)

logging.getLogger("bbconf").setLevel(logging.DEBUG)
