from statistics import StatisticsError

from bbconf.bbagent import BedBaseAgent
from bbconf.models.base_models import BinValues, FileStats, GEOStatistics, UsageModel
from bedboss.refgenome_validator.main import ReferenceValidator
from fastapi import Request


def get_bbagent(request: Request) -> BedBaseAgent:
    return request.app.state.bbagent


def get_usage_data(request: Request) -> UsageModel:
    return request.app.state.usage_data


def get_ref_validator(request: Request) -> ReferenceValidator:
    return request.app.state.ref_validator


def _empty_bin_values() -> BinValues:
    return BinValues(bins=[], counts=[], mean=0.0, median=0.0)


def _empty_file_stats() -> FileStats:
    """Return a well-formed FileStats with zeroed-out bins.

    Used as a fallback when the underlying database has no bed records, in
    which case bbconf's ``statistics.mean`` call on an empty list raises
    ``StatisticsError``.
    """
    empty_bins = _empty_bin_values()
    return FileStats(
        bed_compliance={},
        data_format={},
        file_genome={},
        file_organism={},
        file_assay={},
        cell_line={},
        geo_status={},
        bed_comments={},
        mean_region_width=empty_bins,
        file_size=empty_bins,
        number_of_regions=empty_bins,
        geo=GEOStatistics(
            number_of_files={},
            cumulative_number_of_files={},
            file_sizes=empty_bins,
        ),
    )


def fetch_detailed_stats(bbagent: BedBaseAgent, concise: bool = False) -> FileStats:
    """
    Fetch detailed file statistics from the BedBaseAgent.

    The previous implementation cached this with a 14-day TTL keyed on the
    ``concise`` flag. With bbagent now flowing through FastAPI dependencies
    (and process lifetimes typically shorter than the old TTL anyway), the
    cache has been removed — the underlying query lives in Postgres.

    On an empty database bbconf raises ``StatisticsError`` from
    ``statistics.mean`` (called on an empty region-count list). We intercept
    and return an empty ``FileStats`` so that ``/v1/detailed-stats`` stays a
    200 on a freshly-provisioned instance.
    """
    try:
        return bbagent.get_detailed_stats(concise=concise)
    except StatisticsError:
        return _empty_file_stats()
