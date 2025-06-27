from cachetools import cached, TTLCache
from .main import bbagent
from bbconf.models.base_models import FileStats


@cached(TTLCache(maxsize=100, ttl=14 * 24 * 60 * 60))
def fetch_detailed_stats(concise: bool = False) -> FileStats:
    return bbagent.get_detailed_stats(concise=concise)
