"""Fixtures for the MCP tool tests.

These tests exercise the chatbot-proofing contract (strict args, query-bound
paging tokens, error-hint text, graceful degradation, model reuse) using a fake
in-memory BedBaseAgent, so they need no Postgres/Qdrant and run in CI with only
the `mcp` extra installed.
"""

import datetime

import pytest
from bbconf.exceptions import BEDFileNotFoundError, BedSetNotFoundError
from bbconf.models.base_models import (
    BedSnapshotListResult,
    BedSnapshotResult,
    FileModel,
    StatsReturn,
)
from bbconf.models.bed_models import (
    BedClassification,
    BedFiles,
    BedListResult,
    BedListSearchResult,
    BedMetadataAll,
    BedStatsModel,
    QdrantSearchResult,
)
from bbconf.models.bed_models import (
    BedMetadataBasic as _Basic,
)
from bbconf.models.bedset_models import BedSetListResult, BedSetMetadata

VALID_BED_ID = "a" * 32


def _row(i: int) -> _Basic:
    return _Basic(
        id=f"{i:032d}", name=f"bed{i}", genome_alias="hg38", bed_compliance="bed6+4"
    )


class _FakeConfig:
    def __init__(self, ml: bool):
        # search_bed branches on `dense_encoder is None` to detect ML-disabled mode.
        self.dense_encoder = object() if ml else None


class _FakeBed:
    def __init__(self):
        self.rows = [_row(i) for i in range(5)]

    def get(self, identifier, full=False):
        if identifier == VALID_BED_ID:
            return BedMetadataAll(id=VALID_BED_ID, name="A", genome_alias="hg38")
        raise BEDFileNotFoundError(identifier)

    def get_stats(self, identifier):
        if identifier == VALID_BED_ID:
            return BedStatsModel(number_of_regions=100, gc_content=0.5)
        raise BEDFileNotFoundError(identifier)

    def get_files(self, identifier):
        if identifier == VALID_BED_ID:
            return BedFiles(bed_file=FileModel(name="x.bed.gz", path="files/x.bed.gz"))
        raise BEDFileNotFoundError(identifier)

    def get_classification(self, identifier):
        if identifier == VALID_BED_ID:
            return BedClassification(bed_compliance="bed6+4", data_format="bed")
        raise BEDFileNotFoundError(identifier)

    def get_neighbours(self, identifier, limit=10, offset=0):
        if identifier != VALID_BED_ID:
            raise BEDFileNotFoundError(identifier)
        return self._search_page(limit, offset)

    def hybrid_search(self, query, genome_alias="", assay="", limit=100, offset=0):
        return self._search_page(limit, offset)

    def search_external_file(self, source, accession):
        return BedListSearchResult(count=0, limit=10, offset=0, results=[])

    def get_ids_list(
        self, limit=100, offset=0, genome=None, bed_compliance=None, after=None
    ):
        rows = self.rows[offset : offset + limit]
        return BedListResult(
            count=len(self.rows), limit=limit, offset=offset, results=rows
        )

    def _search_page(self, limit, offset):
        rows = [
            QdrantSearchResult(id=r.id, payload={}, score=0.9, metadata=r)
            for r in self.rows[offset : offset + limit]
        ]
        return BedListSearchResult(
            count=len(self.rows), limit=limit, offset=offset, results=rows
        )


class _FakeBedset:
    def get_ids_list(self, query=None, limit=10, offset=0):
        all_rows = [
            BedSetMetadata(id=f"set{i}", name=f"Set {i}", md5sum="m") for i in range(3)
        ]
        return BedSetListResult(
            count=len(all_rows),
            limit=limit,
            offset=offset,
            results=all_rows[offset : offset + limit],
        )

    def get(self, identifier, full=False):
        if identifier == "set0":
            return BedSetMetadata(id="set0", name="Set 0", md5sum="m")
        raise BedSetNotFoundError(identifier)


class _FakeSnapshot:
    def list(self, file_type=None, limit=100, offset=0):
        rows = [
            BedSnapshotResult(
                file_path="exports/meta.parquet",
                file_type="bed",
                creation_date=datetime.datetime(2026, 1, 1),
            )
        ]
        return BedSnapshotListResult(
            count=len(rows), results=rows[offset : offset + limit]
        )


class FakeAgent:
    def __init__(self, ml: bool = True):
        self.config = _FakeConfig(ml)
        self.bed = _FakeBed()
        self.bedset = _FakeBedset()
        self.snapshot = _FakeSnapshot()

    def get_stats(self):
        return StatsReturn(bedfiles_number=5, bedsets_number=3, genomes_number=1)

    def get_list_genomes(self):
        return ["hg38", "mm10"]

    def get_list_assays(self):
        return ["atac-seq", "chip-seq"]


@pytest.fixture(autouse=True)
def _reset_backend():
    """Clear the injected backend and cache around every test."""
    from bedhost.mcp import tools

    yield
    tools._backend = None
    tools._serves_downloads = False
    if tools._cache is not None:
        tools._cache.clear()


@pytest.fixture
def backend_ml():
    from bedhost.mcp import tools

    agent = FakeAgent(ml=True)
    tools.set_backend(agent)
    return agent


@pytest.fixture
def backend_no_ml():
    from bedhost.mcp import tools

    agent = FakeAgent(ml=False)
    tools.set_backend(agent)
    return agent
