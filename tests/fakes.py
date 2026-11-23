"""An in-memory stand-in for bbconf's BedBaseAgent.

Used by tests/test_core.py and tests/mcp, so they need no Postgres or Qdrant.
It returns real bbconf models, so the code under test sees the same shapes as
in production.
"""

import datetime

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
    BedMetadataBasic,
    BedSetMinimal,
    BedStatsModel,
    QdrantSearchResult,
    RefGenValidModel,
    RefGenValidReturnModel,
    StandardMeta,
)
from bbconf.models.bedset_models import BedSetListResult, BedSetMetadata
from bbconf.models.drs_models import AccessMethod, AccessURL

VALID_BED_ID = "a" * 32
GSM_WITH_HITS = "gsm1234"  # search_external_file finds 3 files for it
BIG_BEDSET_ID = "bigset"  # a BEDset with 50 members
BIG_BEDSET_SIZE = 50


def _row(i: int) -> BedMetadataBasic:
    return BedMetadataBasic(
        id=f"{i:032d}",
        name=f"bed{i}",
        genome_alias="hg38",
        bed_compliance="bed6+4",
        annotation=StandardMeta(assay="ATAC-seq", tissue="liver", cell_line=""),
    )


def _file(name: str, path: str, size: int) -> FileModel:
    url = f"https://api.bedbase.org/v1/files/{path}"
    return FileModel(
        name=name,
        path=path,
        size=size,
        access_methods=[
            AccessMethod(type="http", access_url=AccessURL(url=url)),
            AccessMethod(type="s3", access_url=AccessURL(url=f"s3://bucket/{path}")),
        ],
    )


class _FakeConfig:
    def __init__(self, ml: bool):
        # With ML off, bbconf leaves the encoders and the file-vector index unset.
        self.dense_encoder = object() if ml else None
        self.qdrant_file_backend = object() if ml else None


class _FakeBed:
    def __init__(self, ml: bool):
        self.ml = ml
        self.rows = [_row(i) for i in range(5)]
        self.neighbours_empty = False
        self.bigbed = False
        self.name = "A"
        self.description = "liver ATAC peaks"

    def get(self, identifier, full=False):
        if identifier != VALID_BED_ID:
            raise BEDFileNotFoundError(identifier)
        meta = BedMetadataAll(
            id=VALID_BED_ID,
            name=self.name,
            genome_alias="hg38",
            description=self.description,
            annotation=StandardMeta(assay="ATAC-seq", global_sample_id=["geo:gsm1"]),
        )
        if full:
            meta.stats = BedStatsModel(number_of_regions=100.0, gc_content=0.5)
            meta.files = self.get_files(identifier)
            meta.bedsets = [
                BedSetMinimal(id=f"set{i}", name=f"Set {i}") for i in range(7)
            ]
        return meta

    def get_stats(self, identifier):
        if identifier == VALID_BED_ID:
            return BedStatsModel(number_of_regions=100, gc_content=0.5)
        raise BEDFileNotFoundError(identifier)

    def get_files(self, identifier):
        if identifier != VALID_BED_ID:
            raise BEDFileNotFoundError(identifier)
        bigbed = _file("bigbed_file", "files/x.bigBed", 2000) if self.bigbed else None
        return BedFiles(
            bed_file=_file("bed_file", "files/x.bed.gz", 1000), bigbed_file=bigbed
        )

    def get_classification(self, identifier):
        if identifier == VALID_BED_ID:
            return BedClassification(bed_compliance="bed6+4", data_format="bed")
        raise BEDFileNotFoundError(identifier)

    def get_reference_validation(self, identifier):
        if identifier != VALID_BED_ID:
            raise BEDFileNotFoundError(identifier)
        return RefGenValidReturnModel(
            id=identifier,
            provided_genome="hg38",
            compared_genome=[
                RefGenValidModel(
                    provided_genome="hg38",
                    compared_genome="hg38",
                    genome_digest=None,
                    assigned_points=10,
                    tier_ranking=1,
                )
            ],
        )

    def get_neighbours(self, identifier, limit=10, offset=0):
        if identifier != VALID_BED_ID:
            raise BEDFileNotFoundError(identifier)
        if not self.ml:
            # What bbconf does with no file-vector index loaded.
            raise AttributeError("'NoneType' object has no attribute 'qd_client'")
        if self.neighbours_empty:
            return BedListSearchResult(count=0, limit=limit, offset=offset, results=[])
        return self._search_page(limit, offset)

    def hybrid_search(self, query, genome_alias="", assay="", limit=100, offset=0):
        assert self.ml, "hybrid_search must not run with ML off"
        if query == "nothing matches":
            return BedListSearchResult(count=0, limit=limit, offset=offset, results=[])
        return self._search_page(limit, offset)

    def search_external_file(self, source, accession):
        if (source, accession) == ("geo", GSM_WITH_HITS):
            rows = [
                QdrantSearchResult(id=r.id, payload={}, score=1.0, metadata=r)
                for r in self.rows[:3]
            ]
            return BedListSearchResult(count=3, limit=3, offset=0, results=rows)
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
            QdrantSearchResult(
                id=r.id, payload={"big": "x" * 50}, score=0.9, metadata=r
            )
            for r in self.rows[offset : offset + limit]
        ]
        return BedListSearchResult(
            count=len(self.rows), limit=limit, offset=offset, results=rows
        )


class _FakeBedset:
    extra_member = None  # a member id for set0, which is otherwise empty

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
            return BedSetMetadata(
                id="set0",
                name="Set 0",
                md5sum="m",
                bed_ids=[self.extra_member] if self.extra_member else [],
            )
        if identifier == BIG_BEDSET_ID:
            return BedSetMetadata(
                id=BIG_BEDSET_ID,
                name="Big",
                md5sum="m",
                bed_ids=[f"{i:032d}" for i in range(BIG_BEDSET_SIZE)],
                bedfile_count=BIG_BEDSET_SIZE,
            )
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
        self.bed = _FakeBed(ml)
        self.bedset = _FakeBedset()
        self.snapshot = _FakeSnapshot()

    def get_stats(self):
        return StatsReturn(bedfiles_number=5, bedsets_number=3, genomes_number=1)

    def get_list_genomes(self):
        return ["hg38", "mm10"]

    def get_list_assays(self):
        return ["atac-seq", "chip-seq"]
