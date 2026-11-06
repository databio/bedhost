"""
Wire models for the MCP tools.

The design rule (per @khoroshevskyi): **reuse the existing bbconf pydantic models
as tool return types; add a new model only where none fits.** The only new type
here is the paging envelope, because bbconf exposes ``count``/``limit``/``offset``
and the MCP tools return an *opaque, query-bound* token instead (see paging.py).

``ToolPage`` is generic over the reused bbconf row model, so a search tool returns
``ToolPage[QdrantSearchResult]``, a bedset list returns ``ToolPage[BedSetMetadata]``,
etc. — the rows are the real bbconf models, serialized in full. (Verified: pydantic
serializes the nested bbconf models completely through the generic, and the MCP SDK
emits them as structured content.)

Everything else a tool returns is an unwrapped bbconf model:
  get_bed            -> bbconf BedMetadataAll
  get_bed_stats      -> bbconf BedStatsModel
  get_bed_files      -> bbconf BedFiles
  get_bedset         -> bbconf BedSetMetadata
  get_bed_classification      -> bbconf BedClassification
  get_reference_validation    -> bbconf RefGenValidReturnModel
  list_genomes/list_assays    -> bedhost BaseListResponse
  get_platform_stats          -> bbconf StatsReturn
"""

from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Pagination(BaseModel):
    """Paging block returned with every list/search page."""

    page_size: int
    next_page_token: str | None = None  # opaque; null on the last page
    total: int | None = None  # bbconf ``count`` when known (first page only)


class ToolPage(BaseModel, Generic[T]):
    """A page of reused bbconf row models plus the paging block and an optional hint.

    ``hint`` carries next-step guidance (Rule 2) or empty-result guidance (Rule 7):
    an empty page with a useful hint beats an error.
    """

    rows: list[T]
    pagination: Pagination
    hint: str | None = None


class NameList(BaseModel):
    """A simple named list — the genomes or assays present in BEDbase.

    A local model rather than bedhost.data_models.BaseListResponse: that module
    imports fastapi, and the MCP package stays free of the web stack (see
    tests/mcp/test_layering.py).
    """

    count: int
    results: list[str]
