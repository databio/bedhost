from bbconf.bbagent import BedBaseAgent
from bbconf.models.base_models import FileStats, UsageModel
from bedboss.refgenome_validator.main import ReferenceValidator
from fastapi import Request


def get_bbagent(request: Request) -> BedBaseAgent:
    return request.app.state.bbagent


def get_usage_data(request: Request) -> UsageModel:
    return request.app.state.usage_data


def get_ref_validator(request: Request) -> ReferenceValidator:
    return request.app.state.ref_validator


def fetch_detailed_stats(bbagent: BedBaseAgent, concise: bool = False) -> FileStats:
    """
    Fetch detailed file statistics from the BedBaseAgent.

    The previous implementation cached this with a 14-day TTL keyed on the
    ``concise`` flag. With bbagent now flowing through FastAPI dependencies
    (and process lifetimes typically shorter than the old TTL anyway), the
    cache has been removed — the underlying query lives in Postgres.
    """
    return bbagent.get_detailed_stats(concise=concise)
