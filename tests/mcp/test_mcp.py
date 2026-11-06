"""MCP tool behavior tests — asserting on the text and shapes a chatbot sees."""

import asyncio

import pytest
from bbconf.models.bed_models import QdrantSearchResult
from mcp.server.mcpserver.exceptions import ToolError

from bedhost.mcp import tools

from .conftest import VALID_BED_ID


def test_all_tools_registered():
    names = {t.name for t in asyncio.run(tools.mcp.list_tools())}
    assert "search_bed" in names
    assert len(names) == 15


# --- id handling & error hints (Rules 7/8) ---------------------------------- #
def test_bad_bed_id_is_rejected_with_shape_hint(backend_ml):
    with pytest.raises(ToolError, match="32-character"):
        tools.get_bed("not-a-digest")


def test_unknown_bed_id_hints_at_search(backend_ml):
    with pytest.raises(ToolError, match=r"No BED with that id.*search_bed"):
        tools.get_bed("b" * 32)


def test_unknown_bedset_id_hints_at_search(backend_ml):
    with pytest.raises(ToolError, match="search_bedset"):
        tools.get_bedset("nope")


# --- unknown arguments refused, not dropped (Step 5) ------------------------ #
def test_unknown_argument_is_refused_and_suggested(backend_ml):
    async def call():
        return await tools.mcp.call_tool("search_bed", {"query": "x", "genom": "hg38"})

    with pytest.raises(ToolError, match=r"has no argument 'genom'.*genome"):
        asyncio.run(call())


# --- search: rows reuse bbconf models, paging, degradation ------------------ #
def test_search_returns_bbconf_rows_and_pages(backend_ml):
    page = tools.search_bed("liver", page_size=2)
    assert page.pagination.page_size == 2
    assert page.rows and all(isinstance(r, QdrantSearchResult) for r in page.rows)
    assert page.pagination.next_page_token is not None  # 5 rows, page 2 -> more


def test_page_size_is_clamped(backend_ml):
    assert tools.search_bed("liver", page_size=9999).pagination.page_size == 100


def test_token_is_bound_to_the_query(backend_ml):
    tok = tools.search_bed("liver", page_size=1).pagination.next_page_token
    assert tok
    with pytest.raises(ToolError, match="does not match this query"):
        tools.search_bed("brain", token=tok)
    # same query + its own token is accepted
    assert tools.search_bed("liver", page_size=1, token=tok).pagination.page_size == 1


def test_garbage_token_is_rejected(backend_ml):
    with pytest.raises(ToolError, match="not one this server issued"):
        tools.search_bed("liver", token="@@not-base64@@")


def test_ml_disabled_returns_empty_page_with_hint(backend_no_ml):
    page = tools.search_bed("liver")
    assert page.rows == []
    assert page.hint and "BEDHOST_INIT_ML" in page.hint


def test_exact_id_fastpath_needs_no_ml(backend_no_ml):
    # A 32-char id resolves even with ML disabled.
    page = tools.search_bed(VALID_BED_ID)
    assert len(page.rows) == 1
    assert page.rows[0].id == VALID_BED_ID
    assert "neighbours" in page.hint


# --- detail tools return unwrapped bbconf models ---------------------------- #
def test_get_bed_returns_full_record(backend_ml):
    bed = tools.get_bed(VALID_BED_ID)
    assert bed.id == VALID_BED_ID
    assert bed.name == "A"


def test_get_bed_files_returns_bed_files(backend_ml):
    files = tools.get_bed_files(VALID_BED_ID)
    assert files.bed_file.path == "files/x.bed.gz"


# --- v2 caching -------------------------------------------------------------- #
def test_list_genomes_is_cached(backend_ml):
    calls = {"n": 0}
    original = backend_ml.get_list_genomes

    def counting():
        calls["n"] += 1
        return original()

    backend_ml.get_list_genomes = counting
    first = tools.list_genomes()
    second = tools.list_genomes()
    assert first.results == ["hg38", "mm10"]
    assert second.results == ["hg38", "mm10"]
    assert calls["n"] == 1  # second call served from cache


def test_list_exports_rewrites_urls(backend_ml):
    page = tools.list_exports()
    assert page.rows[0].file_path.startswith("https://")
    assert page.rows[0].file_path.endswith("exports/meta.parquet")


# --- region query guard ------------------------------------------------------ #
def test_get_regions_rejects_inverted_range(backend_ml):
    with pytest.raises(ToolError, match="greater than start"):
        tools.get_regions(VALID_BED_ID, "chr1", start=100, end=50)


def test_get_regions_without_bigbed_is_clear(backend_ml):
    # The fake's get_files returns no bigbed_file.
    with pytest.raises(ToolError, match="no bigBed artifact"):
        tools.get_regions(VALID_BED_ID, "chr1")
