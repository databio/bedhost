"""
Wire models for the MCP tools.

Design rule: reuse the existing bbconf pydantic models as tool return types where
their size suits a chatbot, and add a new model only where none fits. New here:

- ``ToolPage``/``Pagination``: the paging envelope. bbconf exposes
  ``count``/``limit``/``offset``; the MCP tools return an opaque, query-bound
  token instead (see paging.py) and open every page with a one-line ``summary``.
- ``BedHit``: one search/list row. bbconf rows carry the full metadata (and, for
  search, a payload that repeats it); a row here keeps only what a chatbot needs
  to pick a file, about a fifth of the size.
- ``BedSummary``: the default ``get_bed`` record. The common fields, download
  links, bedset memberships, and the size of what ``view="full"`` would return.
- ``BedFull``: bbconf ``BedMetadataAll`` plus reference-genome validation, for
  ``get_bed(view="full")``.
- ``BedSetSummary``: the default ``get_bedset`` record. Like bbconf
  ``BedSetMetadata``, but with the member id list capped, since large BEDsets
  list tens of thousands of files.

Everything else is an unwrapped bbconf model, or bedhost.core.BaseListResponse
for list_genomes/list_assays.
"""

import json
from typing import Generic, TypeVar

from bbconf.models.bed_models import (
    BedMetadataAll,
    BedMetadataBasic,
    RefGenValidReturnModel,
)
from bbconf.models.bedset_models import BedSetMetadata
from pydantic import BaseModel, Field

from bedhost.core import SearchKind

T = TypeVar("T")


class Pagination(BaseModel):
    """Paging block returned with every list/search page."""

    page_size: int
    next_page_token: str | None = None  # opaque; null on the last page
    total: int | None = None  # bbconf ``count`` when known
    # Set only when the requested page_size was out of range and was changed.
    limit_applied: int | None = None


class ToolPage(BaseModel, Generic[T]):
    """A page of rows, opened by a one-line summary of what the server did.

    ``hint`` tells the chatbot what to call next, or what to try when a page is
    empty. An empty page with a useful hint is better than an error.
    """

    summary: str
    search_mode: SearchKind | None = None  # search_bed only: which path ran
    rows: list[T]
    pagination: Pagination
    hint: str | None = None


# --------------------------------------------------------------------------- #
# Trimmed BED views                                                             #
# --------------------------------------------------------------------------- #
def _clean(value):
    """bbconf stores missing annotations as ""; report them as absent."""
    if value in ("", [], None):
        return None
    return value


def _brief_fields(meta: BedMetadataBasic) -> dict:
    ann = meta.annotation
    get = (lambda f: _clean(getattr(ann, f, None))) if ann else (lambda f: None)
    return {
        "id": meta.id,
        "name": _clean(meta.name),
        "genome_alias": _clean(meta.genome_alias),
        "description": _clean(meta.description) or get("description"),
        "assay": get("assay"),
        "cell_type": get("cell_type"),
        "cell_line": get("cell_line"),
        "tissue": get("tissue"),
        "target": get("target"),
        "bed_compliance": _clean(meta.bed_compliance),
        "sample_ids": get("global_sample_id"),
        "experiment_ids": get("global_experiment_id"),
    }


class BedBrief(BaseModel):
    """The fields a chatbot uses to recognize and choose a BED file."""

    id: str = Field(description="32-character BED id; pass it to get_bed")
    name: str | None = None
    genome_alias: str | None = None
    description: str | None = None
    assay: str | None = None
    cell_type: str | None = None
    cell_line: str | None = None
    tissue: str | None = None
    target: str | None = None
    bed_compliance: str | None = None
    sample_ids: list[str] | None = Field(
        None, description="Source sample accessions, e.g. geo:gsm123"
    )
    experiment_ids: list[str] | None = Field(
        None, description="Source experiment accessions, e.g. geo:gse123"
    )


class BedHit(BedBrief):
    """One search or list row."""

    score: float | None = Field(None, description="Similarity; absent for lists")

    @classmethod
    def from_metadata(
        cls, meta: BedMetadataBasic, score: float | None = None
    ) -> "BedHit":
        return cls(**_brief_fields(meta), score=score)


class SizeInfo(BaseModel):
    bytes: int | None = None
    approx_tokens: int | None = None


class BedSizes(BaseModel):
    """How big the deeper parts are, so a chatbot can decide whether to fetch them."""

    full_record: SizeInfo = Field(description='get_bed(view="full")')
    bed_file: SizeInfo | None = Field(None, description="Compressed BED download")
    bigbed_file: SizeInfo | None = Field(None, description="bigBed download")


def compact_json(data) -> str:
    """Compact JSON without null fields: what the chatbot reads in a text block."""
    return json.dumps(_drop_none(data), separators=(",", ":"), default=str)


def _drop_none(data):
    if isinstance(data, dict):
        return {k: _drop_none(v) for k, v in data.items() if v is not None}
    if isinstance(data, list):
        return [_drop_none(v) for v in data]
    return data


def approx_tokens(model: BaseModel) -> int:
    """Rough token count of a model as a tool returns it (4 bytes per token)."""
    return len(compact_json(model.model_dump(mode="json")).encode()) // 4


def _http_url(file) -> str | None:
    for method in file.access_methods or []:
        if method.type == "http" and method.access_url:
            return method.access_url.url
    return None


BEDSETS_SHOWN = 5


class BedSummary(BedBrief):
    """The default get_bed record."""

    species_name: str | None = None
    data_format: str | None = None
    number_of_regions: int | None = None
    mean_region_width: float | None = None
    bedsets: list[str] | None = Field(
        None, description=f"First {BEDSETS_SHOWN} BEDsets holding this file"
    )
    bedsets_total: int = 0
    downloads: dict[str, str] | None = Field(
        None, description="Download URLs: bed_file (.bed.gz) and bigbed_file"
    )
    sizes: BedSizes

    @classmethod
    def from_full(cls, full: BedMetadataAll, full_tokens: int) -> "BedSummary":
        stats = full.stats
        files = full.files
        downloads, sizes = {}, {}
        for key in ("bed_file", "bigbed_file"):
            f = getattr(files, key, None) if files else None
            if f is None:
                continue
            if url := _http_url(f):
                downloads[key] = url
            sizes[key] = SizeInfo(bytes=f.size)
        bedsets = full.bedsets or []
        ann = full.annotation
        return cls(
            **_brief_fields(full),
            species_name=_clean(ann.species_name) if ann else None,
            data_format=_clean(full.data_format),
            number_of_regions=(
                int(stats.number_of_regions)
                if stats and stats.number_of_regions is not None
                else None
            ),
            mean_region_width=stats.mean_region_width if stats else None,
            bedsets=[b.id for b in bedsets[:BEDSETS_SHOWN]] or None,
            bedsets_total=len(bedsets),
            downloads=downloads or None,
            sizes=BedSizes(full_record=SizeInfo(approx_tokens=full_tokens), **sizes),
        )


class BedFull(BedMetadataAll):
    """get_bed(view="full"): the whole bbconf record plus reference-genome fit."""

    reference_validation: RefGenValidReturnModel | None = Field(
        None, description="How well the regions fit each reference genome"
    )


BED_IDS_SHOWN = 20


class BedSetSummary(BedSetMetadata):
    """The default get_bedset record: bed_ids holds at most the first few members."""

    bed_ids_total: int = 0
    full_record: SizeInfo | None = Field(None, description='get_bedset(view="full")')

    @classmethod
    def from_full(cls, full: BedSetMetadata) -> "BedSetSummary":
        ids = full.bed_ids or []
        # Copy the set fields only: several bbconf fields default to None but
        # refuse an explicit None, so passing every field would fail validation.
        fields = {
            k: v
            for k in BedSetMetadata.model_fields
            if k != "bed_ids" and (v := getattr(full, k)) is not None
        }
        return cls(
            **fields,
            bed_ids=ids[:BED_IDS_SHOWN],
            bed_ids_total=len(ids),
            full_record=SizeInfo(approx_tokens=approx_tokens(full)),
        )
