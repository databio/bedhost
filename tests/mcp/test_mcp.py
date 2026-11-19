"""MCP tool behavior tests — asserting on the text and shapes a chatbot sees."""

import asyncio
import json
import logging
import subprocess

import pytest
from mcp.server.mcpserver.exceptions import ToolError

from bedhost.core import RegionOutputTooLarge
from bedhost.mcp import tools
from bedhost.mcp.errors import ERROR_CODES
from bedhost.mcp.schemas import BedFull, BedHit, BedSetSummary, BedSummary, compact_json
from tests.fakes import (
    BIG_BEDSET_ID,
    BIG_BEDSET_SIZE,
    GSM_WITH_HITS,
    VALID_BED_ID,
)

TOOLS = {
    "search_bed",
    "get_bed",
    "get_bed_neighbours",
    "search_bedset",
    "get_bedset",
    "list_bed",
    "list_genomes",
    "list_assays",
    "get_platform_stats",
    "list_exports",
    "get_regions",
}
REMOVED = (
    "get_bed_stats",
    "get_bed_files",
    "get_bed_classification",
    "get_reference_validation",
)


def _list_tools():
    return asyncio.run(tools.mcp.list_tools())


def _call(name, args):
    return asyncio.run(tools.mcp.call_tool(name, args))


def _error(excinfo) -> dict:
    """Parse a coded tool error and check its stable shape."""
    body = json.loads(str(excinfo.value))
    assert {"error", "message", "hint"} <= set(body)
    assert body["error"] in ERROR_CODES
    return body


# --- catalog: names, annotations, schemas, descriptions --------------------- #
def test_tool_catalog():
    assert {t.name for t in _list_tools()} == TOOLS


def test_every_tool_is_annotated_read_only():
    for t in _list_tools():
        assert t.annotations is not None, t.name
        assert t.annotations.read_only_hint is True, t.name
        assert t.annotations.open_world_hint is False, t.name


def test_every_tool_has_a_real_output_schema():
    for t in _list_tools():
        schema = t.output_schema or {}
        assert schema.get("properties"), f"{t.name} has an empty outputSchema"


def test_descriptions_name_the_domain_and_no_removed_tool():
    for t in _list_tools():
        first_sentence = t.description.strip().split(". ")[0]
        assert "BEDbase" in first_sentence, t.name
        for gone in REMOVED:
            assert gone not in t.description, (t.name, gone)
    for gone in REMOVED:
        assert gone not in tools.INSTRUCTIONS


# --- ids, URLs, and coded errors -------------------------------------------- #
def test_bad_bed_id_is_invalid_input_with_search_hint(backend_ml):
    with pytest.raises(ToolError) as ei:
        tools.get_bed("not-a-digest")
    body = _error(ei)
    assert body["error"] == "invalid_input"
    assert "search_bed" in body["hint"]


def test_unknown_bed_id_is_not_found_with_search_hint(backend_ml):
    with pytest.raises(ToolError) as ei:
        tools.get_bed("b" * 32)
    body = _error(ei)
    assert body["error"] == "not_found"
    assert "search_bed" in body["hint"]


def test_unknown_bedset_id_is_not_found_with_search_hint(backend_ml):
    with pytest.raises(ToolError) as ei:
        tools.get_bedset("nope")
    body = _error(ei)
    assert body["error"] == "not_found"
    assert "search_bedset" in body["hint"]


@pytest.mark.parametrize(
    "url",
    [
        f"https://bedbase.org/bed/{VALID_BED_ID}",
        f"http://bedbase.org/bed/{VALID_BED_ID}/",
        f"https://www.bedbase.org/bed/{VALID_BED_ID}?tab=stats",
        f"  https://bedbase.org/bed/{VALID_BED_ID}#plots ",
    ],
)
def test_bedbase_url_is_accepted_as_bed_id(backend_ml, url):
    assert tools.get_bed(url).id == VALID_BED_ID


def test_bedbase_url_is_accepted_as_bedset_id(backend_ml):
    assert tools.get_bedset("https://bedbase.org/bedset/set0/").id == "set0"


def test_bedset_url_passed_to_get_bed_points_to_get_bedset(backend_ml):
    with pytest.raises(ToolError) as ei:
        tools.get_bed("https://bedbase.org/bedset/set0")
    body = _error(ei)
    assert body["error"] == "invalid_input"
    assert body["hint"] == 'get_bedset(id="set0")'


def test_unknown_argument_is_refused_with_valid_list(backend_ml):
    with pytest.raises(ToolError) as ei:
        _call("search_bed", {"query": "x", "genom": "hg38"})
    body = _error(ei)
    assert body["error"] == "invalid_input"
    assert "genome" in body["valid"]
    assert "'genome'" in body["hint"]


def test_error_text_through_the_server_is_pure_json(backend_ml):
    # The SDK prefixes a tool's own error text; the server strips it again.
    with pytest.raises(ToolError) as ei:
        _call("get_bed", {"id": "b" * 32})
    assert _error(ei)["error"] == "not_found"


def test_wrong_argument_type_is_invalid_input(backend_ml):
    with pytest.raises(ToolError) as ei:
        _call("search_bed", {"query": "liver", "page_size": "lots"})
    body = _error(ei)
    assert body["error"] == "invalid_input"
    assert "page_size" in body["message"]


def test_unknown_argument_without_close_match_has_no_hint(backend_ml):
    with pytest.raises(ToolError) as ei:
        _call("list_genomes", {"zzz": 1})
    body = _error(ei)
    assert body["error"] == "invalid_input" and body["hint"] is None
    assert body["valid"] == []


def test_sdk_still_drops_unknown_arguments(backend_ml):
    # Why _StrictMCP checks argument names itself: the SDK ignores extras. If
    # this fails, the SDK now refuses them and the guard can go.
    from mcp.server.mcpserver import MCPServer

    result = asyncio.run(
        MCPServer.call_tool(tools.mcp, "search_bed", {"query": "x", "genom": "hg38"})
    )
    assert not result.is_error


def test_bad_stored_record_is_internal_not_invalid_input(backend_ml, monkeypatch):
    # A pydantic error inside a tool is the server's fault, not the caller's.
    from pydantic import BaseModel

    class Strict(BaseModel):
        n: int

    def broken(*a, **k):
        Strict(n="not a number")

    monkeypatch.setattr(backend_ml.bed, "get", broken)
    with pytest.raises(ToolError) as ei:
        _call("get_bed", {"id": VALID_BED_ID})
    body = _error(ei)
    assert body["error"] == "internal"
    assert "not a number" not in str(ei.value) and "Traceback" not in str(ei.value)


def test_crash_is_internal_without_detail(backend_ml, monkeypatch):
    def boom(*a, **k):
        raise RuntimeError("secret detail")

    monkeypatch.setattr(backend_ml, "get_list_genomes", boom)
    with pytest.raises(ToolError) as ei:
        _call("list_genomes", {})
    assert _error(ei)["error"] == "internal"
    assert "secret" not in str(ei.value)


def test_dropped_row_does_not_end_paging(backend_ml):
    # A hit without metadata is dropped, but the backend page was full, so
    # there may be more: the token must still be there.
    real = backend_ml.bed._search_page

    def with_hole(limit, offset):
        page = real(limit, offset)
        page.results[0].metadata = None
        return page

    backend_ml.bed._search_page = with_hole
    page = tools.search_bed("liver", page_size=2)
    assert len(page.rows) == 1
    assert page.pagination.next_page_token is not None
    page = tools.get_bed_neighbours(VALID_BED_ID, page_size=2)
    assert len(page.rows) == 1
    assert page.pagination.next_page_token is not None


# --- search: rows, summary, paging, degradation ------------------------------ #
def test_search_returns_trimmed_rows_and_pages(backend_ml):
    page = tools.search_bed("liver", page_size=2)
    assert page.pagination.page_size == 2
    assert page.rows and all(isinstance(r, BedHit) for r in page.rows)
    assert page.rows[0].assay == "ATAC-seq"
    assert page.rows[0].cell_line is None  # bbconf's "" is reported as absent
    assert page.pagination.next_page_token is not None  # 5 rows, page 2 -> more
    assert page.pagination.limit_applied is None


def test_search_default_page_size_is_10(backend_ml):
    assert tools.search_bed("liver").pagination.page_size == 10


def test_search_page_size_is_clamped_and_reported(backend_ml):
    page = tools.search_bed("liver", page_size=9999)
    assert page.pagination.page_size == 50
    assert page.pagination.limit_applied == 50


def test_list_page_size_is_clamped_and_reported(backend_ml):
    page = tools.list_bed(page_size=500)
    assert page.pagination.page_size == 100
    assert page.pagination.limit_applied == 100
    assert tools.list_bed().pagination.page_size == 20


def test_semantic_summary_says_what_ran(backend_ml):
    page = tools.search_bed("liver", genome="hg38", page_size=2)
    assert page.search_mode == "semantic"
    assert page.summary.startswith("Semantic search for 'liver' genome=hg38: rows 1-2")
    assert page.pagination.total is None  # bbconf's count is the catalog size


def test_semantic_no_matches_hints_at_other_queries(backend_ml):
    page = tools.search_bed("nothing matches")
    assert page.rows == []
    assert "no matches" in page.summary
    assert "accession" in page.hint


def test_exact_id_summary_and_neighbours(backend_ml):
    page = tools.search_bed(VALID_BED_ID, page_size=3)
    assert page.search_mode == "exact_id"
    assert page.rows[0].id == VALID_BED_ID
    assert page.summary == "Exact id match, followed by 2 similar files."


def test_exact_id_needs_no_ml(backend_no_ml):
    page = tools.search_bed(VALID_BED_ID)
    assert [r.id for r in page.rows] == [VALID_BED_ID]
    assert page.summary == "Exact id match, followed by 0 similar files."


def test_accession_summary(backend_no_ml):
    page = tools.search_bed(GSM_WITH_HITS.upper())
    assert page.search_mode == "accession"
    assert page.summary == (
        f"Accession {GSM_WITH_HITS.upper()}: rows 1-3 of 3 matching files."
    )
    assert page.pagination.total == 3


def test_ml_disabled_returns_empty_page_saying_so(backend_no_ml):
    page = tools.search_bed("liver")
    assert page.rows == []
    assert "nothing was searched" in page.summary
    assert "accession" in page.hint


def test_token_is_bound_to_the_query(backend_ml):
    tok = tools.search_bed("liver", page_size=1).pagination.next_page_token
    assert tok
    with pytest.raises(ToolError) as ei:
        tools.search_bed("brain", token=tok)
    assert _error(ei)["error"] == "bad_token"
    # same query + its own token is accepted
    assert tools.search_bed("liver", page_size=1, token=tok).pagination.page_size == 1


def test_foreign_token_says_which_rows_it_wanted(backend_ml):
    tok = tools.search_bed("liver", page_size=2).pagination.next_page_token
    with pytest.raises(ToolError) as ei:
        tools.search_bed("brain", token=tok)
    body = _error(ei)
    assert "rows 3 on" in body["message"]
    assert "next_page_token" in body["hint"] and "row 3" in body["hint"]


def test_no_output_schema_has_a_regex_pattern():
    # bbconf's bed_compliance regex is Python-only and breaks JS clients.
    for t in asyncio.run(tools.mcp.list_tools()):
        assert '"pattern"' not in json.dumps(t.output_schema or {}), t.name


def test_garbage_token_is_bad_token(backend_ml):
    with pytest.raises(ToolError) as ei:
        tools.search_bed("liver", token="@@not-base64@@")
    assert _error(ei)["error"] == "bad_token"


def test_neighbours_with_ml_off_is_unavailable(backend_no_ml):
    with pytest.raises(ToolError) as ei:
        tools.get_bed_neighbours(VALID_BED_ID)
    body = _error(ei)
    assert body["error"] == "unavailable"
    assert "search_bed" in body["hint"]


# --- get_bed: trimmed record by default, full on request -------------------- #
def test_get_bed_default_is_trimmed_record(backend_ml):
    bed = tools.get_bed(VALID_BED_ID)
    assert isinstance(bed, BedSummary)
    assert bed.number_of_regions == 100
    assert bed.downloads["bed_file"].startswith("https://")
    assert bed.sizes.bed_file.bytes == 1000
    assert bed.sizes.full_record.approx_tokens > 0
    assert bed.bedsets == ["set0", "set1", "set2", "set3", "set4"]
    assert bed.bedsets_total == 7
    assert len(compact_json(bed.model_dump(mode="json"))) < 8000


def test_get_bed_full_has_stats_files_and_reference_fit(backend_ml):
    bed = tools.get_bed(VALID_BED_ID, view="full")
    assert isinstance(bed, BedFull)
    assert bed.stats.gc_content == 0.5
    assert bed.files.bed_file.path == "files/x.bed.gz"
    assert bed.reference_validation.compared_genome[0].tier_ranking == 1


def test_get_bed_full_size_is_declared_in_record(backend_ml):
    declared = tools.get_bed(VALID_BED_ID).sizes.full_record.approx_tokens
    full = tools.get_bed(VALID_BED_ID, view="full")
    actual = len(compact_json(full.model_dump(mode="json"))) // 4
    assert declared == actual


def test_get_bedset_default_names_the_first_members(backend_ml):
    rec = tools.get_bedset(BIG_BEDSET_ID)
    assert isinstance(rec, BedSetSummary)
    assert len(rec.members) == 20
    assert rec.members_total == BIG_BEDSET_SIZE
    full = tools.get_bedset(BIG_BEDSET_ID, view="full")
    assert len(full.bed_ids) == BIG_BEDSET_SIZE


def test_get_bedset_members_carry_names(backend_ml):
    backend_ml.bedset.extra_member = VALID_BED_ID
    rec = tools.get_bedset("set0")
    assert [(m.id, m.name) for m in rec.members] == [(VALID_BED_ID, "A")]


def test_search_bedset_rows_have_no_empty_member_list(backend_ml):
    row = tools.search_bedset().rows[0]
    assert "bed_ids" not in row.model_dump()
    assert row.bedfile_count is None or row.bedfile_count >= 0


# --- the text block a chatbot reads ----------------------------------------- #
def test_text_block_is_compact_json_without_nulls(backend_ml):
    res = _call("search_bed", {"query": "liver"})
    text = res.content[0].text
    assert "\n" not in text and '": ' not in text and "null" not in text
    data = json.loads(text)
    assert data["summary"].startswith("Semantic search")
    assert res.structured_content["summary"] == data["summary"]


def test_union_return_text_block_is_the_record(backend_ml):
    res = _call("get_bed", {"id": VALID_BED_ID})
    assert json.loads(res.content[0].text)["id"] == VALID_BED_ID


def test_regions_text_block_is_raw_bed_text(backend_ml, monkeypatch):
    backend_ml.bed.bigbed = True
    monkeypatch.setattr(tools, "run_bigbed_to_bed", lambda *a: "chr1\t1\t2\n")
    res = _call("get_regions", {"id": VALID_BED_ID, "chrom": "chr1"})
    assert res.content[0].text == "chr1\t1\t2\n"


# --- per-call logging --------------------------------------------------------- #
def test_each_call_is_logged(backend_ml, caplog):
    with caplog.at_level(logging.INFO, logger="bedhost"):
        tools.search_bed("liver " * 50, page_size=2)
        with pytest.raises(ToolError):
            tools.get_bed("short")
    lines = [r.getMessage() for r in caplog.records if "mcp tool=" in r.getMessage()]
    assert "mcp tool=search_bed" in lines[0] and "rows=2" in lines[0]
    assert len(lines[0]) < 250  # the long query is cut to 100 characters
    assert "mcp tool=get_bed" in lines[1] and "error=invalid_input" in lines[1]


# --- caching of the whole-catalog tools ------------------------------------- #
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
    assert page.summary.startswith("Export snapshots")


# --- region queries ------------------------------------------------------------ #
def test_get_regions_rejects_inverted_range(backend_ml):
    with pytest.raises(ToolError) as ei:
        tools.get_regions(VALID_BED_ID, "chr1", start=100, end=50)
    assert _error(ei)["error"] == "invalid_input"


def test_get_regions_without_bigbed_is_unavailable(backend_ml):
    with pytest.raises(ToolError) as ei:
        tools.get_regions(VALID_BED_ID, "chr1")
    body = _error(ei)
    assert body["error"] == "unavailable"
    assert "get_bed" in body["hint"]


@pytest.mark.parametrize(
    "exc, code",
    [
        (RegionOutputTooLarge("big"), "too_large"),
        (subprocess.TimeoutExpired("bigBedToBed", 1), "timeout"),
        (FileNotFoundError("bigBedToBed"), "unavailable"),
        (subprocess.CalledProcessError(1, "bigBedToBed"), "unavailable"),
    ],
)
def test_get_regions_failures_have_codes(backend_ml, monkeypatch, exc, code):
    backend_ml.bed.bigbed = True

    def fail(*args):
        raise exc

    monkeypatch.setattr(tools, "run_bigbed_to_bed", fail)
    with pytest.raises(ToolError) as ei:
        tools.get_regions(VALID_BED_ID, "chr1")
    assert _error(ei)["error"] == code


def test_too_large_regions_point_to_the_download(backend_ml, monkeypatch):
    backend_ml.bed.bigbed = True

    def fail(*args):
        raise RegionOutputTooLarge("big")

    monkeypatch.setattr(tools, "run_bigbed_to_bed", fail)
    with pytest.raises(ToolError) as ei:
        tools.get_regions(VALID_BED_ID, "chr1")
    assert f'get_bed(id="{VALID_BED_ID}")' in _error(ei)["hint"]
