from cachetools import TTLCache
from bbconf.bbagent import BedBaseAgent
from bbconf.models.base_models import FileStats, UsageModel
from bedboss.refgenome_validator.main import ReferenceValidator
from fastapi import Request

_stats_cache: TTLCache = TTLCache(maxsize=2, ttl=14 * 24 * 60 * 60)


def get_bbagent(request: Request) -> BedBaseAgent:
    return request.app.state.bbagent


def get_usage_data(request: Request) -> UsageModel:
    return request.app.state.usage_data


def get_ref_validator(request: Request) -> ReferenceValidator:
    return request.app.state.ref_validator


def fetch_detailed_stats(bbagent: BedBaseAgent, concise: bool = False) -> FileStats:
    if concise not in _stats_cache:
        _stats_cache[concise] = bbagent.get_detailed_stats(concise=concise)
    return _stats_cache[concise]
