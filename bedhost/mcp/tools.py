"""
The bedhost MCP server: builds the MCPServer, its instructions, the single-agent
backend injection, the TTL cache, and every tool.

Tools call the same ``BedBaseAgent`` methods the REST routers call, and logic
both sides need (BED text search, region queries, export URLs) lives in
bedhost.core, so MCP and REST cannot drift. This module must not import the web
stack (fastapi/starlette/bedhost.routers/bedhost.main); it imports only bbconf,
bedhost.core, the pure bedhost.const, the MCP SDK, and the stdlib.
tests/mcp/test_layering.py enforces it.
"""

import functools
import inspect
import os
import re
import subprocess
import threading
import time
from typing import Literal

# The MCP SDK ships only in the `mcp` extra; make its absence a clear message.
try:
    from mcp.server.mcpserver import MCPServer
    from mcp.server.mcpserver.exceptions import ToolError, UnexpectedToolError
    from mcp.types import CallToolResult, TextContent, ToolAnnotations
except ImportError as e:  # pragma: no cover - exercised via the missing-extra test
    raise ImportError(
        "The 'mcp' extra is not installed. Install bedhost with the 'mcp' extra "
        "(pip install 'bedhost[mcp]') to use the MCP server."
    ) from e

from bbconf.exceptions import (
    AnalysisFileNotFoundError,
    BedBaseConfError,
    BEDFileNotFoundError,
    BedSetNotFoundError,
    SnapshotNotFoundError,
    TokenizeFileNotExistError,
)
from bbconf.models.base_models import BedSnapshotResult, StatsReturn
from bbconf.models.bedset_models import BedSetMetadata
from pydantic import ValidationError

from bedhost import _LOGGER
from bedhost._version import __version__ as bedhost_version
from bedhost.const import BIGBED_TIMEOUT_SECONDS
from bedhost.core import (
    BaseListResponse,
    MLUnavailable,
    RegionOutputTooLarge,
    SearchKind,
    build_exports_url,
    run_bigbed_to_bed,
)
from bedhost.core import search_bed as core_search_bed

from .errors import error_code, tool_error
from .paging import (
    LIST_PAGE_CAP,
    LIST_PAGE_DEFAULT,
    SEARCH_PAGE_CAP,
    SEARCH_PAGE_DEFAULT,
    clamp,
    decode,
    encode,
    filters_hash,
)
from .schemas import (
    BedFull,
    BedHit,
    BedSetSummary,
    BedSummary,
    Pagination,
    ToolPage,
    approx_tokens,
    compact_json,
)

# --------------------------------------------------------------------------- #
# Backend: exactly ONE bbconf BedBaseAgent per process (see package docstring). #
# --------------------------------------------------------------------------- #
_backend = None
_serves_downloads = False


def set_backend(agent, *, serves_downloads=False) -> None:
    """Inject the agent the process already has (HTTP mode: app.state.bbagent).

    Idempotent; call once at startup, before any tool can run, so backend() never
    lazily builds a second agent.
    """
    global _backend, _serves_downloads
    _backend, _serves_downloads = agent, serves_downloads


def _init_ml_from_env() -> bool:
    return os.environ.get("BEDHOST_INIT_ML", "true").lower() not in ("0", "false", "no")


def backend():
    """Return the single BedBaseAgent for this process.

    Builds one lazily ONLY in stdio mode, where this process has no FastAPI app and
    nothing has injected an agent. In HTTP mode set_backend() has already run, so
    this returns that instance and never builds a second connection.
    """
    global _backend
    if _backend is None:
        from bbconf.bbagent import BedBaseAgent

        cfg = os.environ.get("BEDBASE_CONFIG")
        if not cfg:
            raise tool_error(
                "unavailable",
                "This server has no BEDbase database configured.",
                "Set BEDBASE_CONFIG to a bedbase config file and restart the server.",
            )
        _backend = BedBaseAgent(cfg, init_ml=_init_ml_from_env())
    return _backend


# --------------------------------------------------------------------------- #
# Cache for the slow whole-catalog tools (list_bed/list_genomes/list_assays/     #
# get_platform_stats). Process-local, TTL-based, lock-guarded (HTTP mode runs    #
# sync tools in a threadpool). BEDHOST_MCP_CACHE_TTL seconds; 0 disables.        #
# --------------------------------------------------------------------------- #
_CACHE_TTL = int(os.environ.get("BEDHOST_MCP_CACHE_TTL", "3600"))
_cache_lock = threading.Lock()
if _CACHE_TTL > 0:
    from cachetools import TTLCache

    _cache = TTLCache(maxsize=256, ttl=_CACHE_TTL)
else:
    _cache = None


def _cached(key, producer):
    """
    Memoize ``producer()`` under ``key`` with the module TTL cache.

    The DB call runs outside the lock; a concurrent miss may compute twice, which
    is fine for idempotent reads.
    """
    if _cache is None:
        return producer()
    with _cache_lock:
        if key in _cache:
            return _cache[key]
    value = producer()
    with _cache_lock:
        _cache[key] = value
    return value


# --------------------------------------------------------------------------- #
# Server + instructions: the usual call order, the id format, and paging.        #
# --------------------------------------------------------------------------- #
INSTRUCTIONS = """\
BEDbase is a catalog of genomic interval datasets (BED files) and curated
collections (BEDsets). Start with search_bed(query=...); then get_bed(id) for a
file's record and download links, or get_bed_neighbours(id) for similar files.
search_bedset(query=...) + get_bedset(id) cover collections. list_bed() browses
by genome; list_genomes()/list_assays() show valid filter values.
A BED id is a 32-character digest and a BEDset id is a short slug; pass ids as
returned (bedbase.org URLs also work). Each page opens with a summary; pass
pagination.next_page_token back as token for more. Every tool is read-only.
"""

READ = ToolAnnotations(readOnlyHint=True, openWorldHint=False)

# tool name -> its declared parameter names, for the unknown-argument guard.
_PARAMS: dict[str, tuple[str, ...]] = {}


class _StrictMCP(MCPServer):
    """Three changes to the SDK's tool calls.

    1. Refuse arguments a tool doesn't declare (the SDK silently drops them).
    2. Keep error text pure JSON. The SDK prefixes a tool's error with
       "Error executing tool <name>: ", which breaks parsing, and reports a
       wrong argument type as free text; both come back as coded errors.
    3. Write the text block as compact JSON without null fields. The SDK
       pretty-prints the full model, which costs a chatbot 30-50% more tokens
       for the same data. structuredContent is left as the SDK built it.
    """

    async def call_tool(self, name, arguments, context=None):
        params = _PARAMS.get(name)
        if params is not None and (unknown := sorted(set(arguments) - set(params))):
            import difflib

            hint = None
            for a in unknown:
                if close := difflib.get_close_matches(a, params, n=1):
                    hint = f"Did you mean '{close[0]}'?"
            _LOGGER.info(f"mcp tool={name} error=invalid_input unknown={unknown}")
            raise tool_error(
                "invalid_input",
                f"{name} has no argument {', '.join(map(repr, unknown))}.",
                hint,
                valid=list(params),
            )
        try:
            result = await super().call_tool(name, arguments, context)
        except UnexpectedToolError:
            raise
        except ToolError as exc:
            cause = exc.__cause__
            if isinstance(cause, ToolError) and error_code(cause):
                raise cause from None
            if isinstance(cause, ValidationError):
                problems = "; ".join(
                    f"{'.'.join(map(str, e['loc']))}: {e['msg']}"
                    for e in cause.errors()
                )
                _LOGGER.info(f"mcp tool={name} error=invalid_input {problems}")
                raise tool_error(
                    "invalid_input", f"Bad arguments to {name}: {problems}."
                ) from None
            raise
        if isinstance(result, CallToolResult) and not result.is_error:
            data = result.structured_content
            if isinstance(data, dict) and set(data) == {"result"}:
                data = data["result"]  # the SDK wraps non-object returns
            if data is not None and not isinstance(data, str):
                result.content = [TextContent(type="text", text=compact_json(data))]
        return result


mcp = _StrictMCP("bedbase", version=bedhost_version, instructions=INSTRUCTIONS)


# --------------------------------------------------------------------------- #
# Registration decorator: record params, log each call, and turn expected       #
# failures into coded tool errors whose hint names the exact call that fixes    #
# the problem (e.g. search_bed for a bad id), never one that starts over.       #
# --------------------------------------------------------------------------- #
_NOT_FOUND_HINTS: tuple[tuple[type[Exception], str], ...] = (
    (
        BEDFileNotFoundError,
        'search_bed(query="...") or list_bed() return valid 32-character BED ids.',
    ),
    (BedSetNotFoundError, 'search_bedset(query="...") returns valid BEDset ids.'),
    (TokenizeFileNotExistError, None),
    (SnapshotNotFoundError, "list_exports() shows the available snapshots."),
    (AnalysisFileNotFoundError, None),
)
_NOT_FOUND = tuple(t for t, _ in _NOT_FOUND_HINTS)


def _log_args(bound: dict) -> str:
    """key=value for each argument given; text values cut to 100 characters."""
    return " ".join(
        f"{k}={v[:100]!r}" if isinstance(v, str) else f"{k}={v}"
        for k, v in bound.items()
        if v is not None
    )


def _tool(fn):
    """Register fn as a read-only tool, with per-call logging and coded errors."""
    sig = inspect.signature(fn)
    _PARAMS[fn.__name__] = tuple(sig.parameters)

    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        outcome = "error=unexpected"
        try:
            result = fn(*args, **kwargs)
            outcome = (
                f"rows={len(result.rows)}" if isinstance(result, ToolPage) else "ok"
            )
            return result
        except ToolError as e:
            outcome = f"error={error_code(e)}"
            raise
        except _NOT_FOUND as e:
            outcome = "error=not_found"
            hint = next((h for t, h in _NOT_FOUND_HINTS if isinstance(e, t)), None)
            raise tool_error("not_found", str(e), hint) from e
        except (BedBaseConfError, ValueError) as e:
            outcome = "error=invalid_input"
            raise tool_error("invalid_input", str(e)) from e
        finally:
            ms = (time.perf_counter() - start) * 1000
            try:
                bound = sig.bind_partial(*args, **kwargs).arguments
            except TypeError:
                bound = kwargs
            _LOGGER.info(
                f"mcp tool={fn.__name__} {_log_args(bound)} {outcome} ms={ms:.0f}"
            )

    return mcp.tool(annotations=READ)(wrapper)


# --------------------------------------------------------------------------- #
# Small shared helpers                                                          #
# --------------------------------------------------------------------------- #
_BEDBASE_URL = re.compile(
    r"^https?://(?:www\.)?bedbase\.org/(bed|bedset)/([^/?#]+)/?(?:[?#].*)?$",
    re.IGNORECASE,
)


def _id_from(value: str, kind: Literal["bed", "bedset"]) -> str:
    """Accept a bare id or a bedbase.org page URL for it; return the bare id."""
    cleaned = (value or "").strip()
    if m := _BEDBASE_URL.match(cleaned):
        url_kind, cleaned = m.group(1).lower(), m.group(2)
        if url_kind != kind:
            right = "get_bed" if url_kind == "bed" else "get_bedset"
            raise tool_error(
                "invalid_input",
                f"That is a bedbase.org {url_kind} URL, not a {kind} URL.",
                f'{right}(id="{cleaned}")',
            )
    return cleaned


def _require_bed_id(value: str) -> str:
    """Return a bare BED id from an id or URL; reject an obviously wrong one early."""
    bed_id = _id_from(value, "bed")
    if len(bed_id) != 32:
        raise tool_error(
            "invalid_input",
            "A BED id is a 32-character digest, not a name.",
            'search_bed(query="...") or list_bed() return valid BED ids.',
        )
    return bed_id


def _page(
    rows,
    summary,
    page_size,
    clamped,
    offset,
    fh,
    total=None,
    hint=None,
    search_mode=None,
):
    """Build a ToolPage for offset-paged results."""
    next_token = encode(offset + page_size, fh) if len(rows) == page_size else None
    return ToolPage(
        summary=summary,
        search_mode=search_mode,
        rows=rows,
        pagination=Pagination(
            page_size=page_size,
            next_page_token=next_token,
            total=total,
            limit_applied=page_size if clamped else None,
        ),
        hint=hint,
    )


def _span(offset: int, n: int) -> str:
    return f"rows {offset + 1}-{offset + n}" if n else "no rows"


def _hits(result) -> list[BedHit]:
    return [
        BedHit.from_metadata(r.metadata, score=r.score)
        for r in (result.results or [])
        if r.metadata is not None
    ]


def _next_get_bed(rows: list[BedHit]) -> str | None:
    if not rows:
        return None
    return (
        f'get_bed(id="{rows[0].id}") for a file\'s record and download links; '
        "get_bed_neighbours(id=...) for files like it."
    )


# =========================================================================== #
# Search and inspect                                                           #
# =========================================================================== #
@_tool
def search_bed(
    query: str,
    genome: str | None = None,
    assay: str | None = None,
    page_size: int = SEARCH_PAGE_DEFAULT,
    token: str | None = None,
) -> ToolPage[BedHit]:
    """
    Search BEDbase BED files by description (the main way to find files).

    Also takes a GEO/ENCODE accession ("GSM5258952", "ENCFF522FNJ") or a BED id,
    which need no ML. A page of 10 rows is about 1K tokens; summary says which
    search ran. Next: get_bed(id) on a hit for its record and download links, or
    get_bed_neighbours(id) for more like it.

    Args:
        query: Free text ("ATAC-seq peaks in liver"), a GEO/ENCODE accession, or a BED id.
        genome: Optional genome filter, e.g. "hg38". list_genomes() shows valid values.
        assay: Optional assay filter, e.g. "ATAC-seq". list_assays() shows valid values.
        page_size: Rows per page, default 10, at most 50.
        token: pagination.next_page_token from a previous call for the same query.
    """
    page_size, clamped = clamp(page_size, SEARCH_PAGE_DEFAULT, SEARCH_PAGE_CAP)
    fh = filters_hash("search_bed", query=query, genome=genome, assay=assay)
    offset, _ = decode(token, fh)
    try:
        outcome = core_search_bed(
            backend(), query, genome=genome, assay=assay, limit=page_size, offset=offset
        )
    except MLUnavailable:
        return _page(
            [],
            "Semantic search is off on this server (no ML models), so nothing "
            "was searched.",
            page_size,
            clamped,
            offset,
            fh,
            hint=(
                "Query by a GEO/ENCODE accession or a 32-character BED id (no ML "
                "needed), or browse with list_bed(genome=...)."
            ),
            search_mode=SearchKind.SEMANTIC,
        )

    rows = _hits(outcome.result)
    total = None
    if outcome.kind is SearchKind.EXACT_ID:
        similar = len(rows) - 1 if offset == 0 else len(rows)
        summary = (
            f"Exact id match, followed by {similar} similar files."
            if offset == 0
            else f"Files similar to {query}: {_span(offset - 1, len(rows))}."
        )
    elif outcome.kind is SearchKind.ACCESSION:
        total = outcome.result.count
        summary = (
            f"Accession {query}: {_span(offset, len(rows))} of {total} matching files."
        )
    else:
        # bbconf's count for semantic search is the catalog size, not a hit
        # count (every file gets a score), so it is not reported as a total.
        where = "".join(
            f" {k}={v}" for k, v in (("genome", genome), ("assay", assay)) if v
        )
        summary = (
            f"Semantic search for '{query}'{where}: {_span(offset, len(rows))}, "
            "ranked by similarity."
            if rows
            else f"Semantic search for '{query}'{where}: no matches."
        )
    hint = _next_get_bed(rows)
    if not rows and offset == 0:
        hint = (
            "Try a tissue, assay, or cell-line term, drop the genome/assay filter, "
            "or query by a GEO/ENCODE accession."
        )
    return _page(
        rows,
        summary,
        page_size,
        clamped,
        offset,
        fh,
        total=total,
        hint=hint,
        search_mode=outcome.kind,
    )


@_tool
def get_bed(
    id: str, view: Literal["record", "full"] = "record"
) -> BedSummary | BedFull:
    """
    Get one BEDbase BED file. The default record (~0.2K tokens) has its
    annotation, region count, BEDsets, download URLs, and file sizes.
    view="full" (~1-5K tokens; see sizes.full_record) adds QC stats,
    genomic-context distributions, plot files, every access method, and
    reference-genome fit. Next: download from downloads.bed_file, or
    get_regions(id, chrom) to read intervals.

    Args:
        id: The 32-character BED id from search_bed or list_bed, or its
            https://bedbase.org/bed/<id> URL.
        view: "record" (default) or "full".
    """
    bed_id = _require_bed_id(id)
    agent = backend()
    full = agent.bed.get(bed_id, full=True)
    try:
        validation = agent.bed.get_reference_validation(bed_id)
    except BedBaseConfError:
        validation = None
    record = BedFull(**dict(full), reference_validation=validation)
    if view == "full":
        return record
    # The default record still reads the full one, so it can state its size.
    return BedSummary.from_full(full, full_tokens=approx_tokens(record))


@_tool
def get_bed_neighbours(
    id: str,
    page_size: int = SEARCH_PAGE_DEFAULT,
    token: str | None = None,
) -> ToolPage[BedHit]:
    """
    Get BEDbase BED files most similar to one file (nearest neighbours by
    region content). Same rows as search_bed, ~1K tokens per 10. Next:
    get_bed(id) on a row.

    Args:
        id: The 32-character BED id, or its https://bedbase.org/bed/<id> URL.
        page_size: Rows per page, default 10, at most 50.
        token: pagination.next_page_token from a previous call for the same id.
    """
    bed_id = _require_bed_id(id)
    page_size, clamped = clamp(page_size, SEARCH_PAGE_DEFAULT, SEARCH_PAGE_CAP)
    fh = filters_hash("get_bed_neighbours", id=bed_id)
    offset, _ = decode(token, fh)
    agent = backend()
    if getattr(agent.config, "qdrant_file_backend", None) is None:
        raise tool_error(
            "unavailable",
            "Similar-file search is off on this server (no ML models).",
            f'search_bed(query="{bed_id}") still returns the file itself.',
        )
    result = agent.bed.get_neighbours(bed_id, limit=page_size, offset=offset)
    rows = _hits(result)
    return _page(
        rows,
        f"Files most similar to {bed_id}: {_span(offset, len(rows))}."
        if rows
        else f"No more files similar to {bed_id}.",
        page_size,
        clamped,
        offset,
        fh,
        hint=_next_get_bed(rows),
    )


@_tool
def search_bedset(
    query: str | None = None,
    page_size: int = SEARCH_PAGE_DEFAULT,
    token: str | None = None,
) -> ToolPage[BedSetMetadata]:
    """
    Search BEDbase BEDsets (curated collections of BED files) by words in their
    name or description, or list them all when query is omitted. About 0.1K
    tokens per row. Next: get_bedset(id) for a collection's members.

    Args:
        query: Optional text to match in BEDset names/descriptions (substring match).
        page_size: Rows per page, default 10, at most 50.
        token: pagination.next_page_token from a previous call for the same query.
    """
    page_size, clamped = clamp(page_size, SEARCH_PAGE_DEFAULT, SEARCH_PAGE_CAP)
    fh = filters_hash("search_bedset", query=query)
    offset, _ = decode(token, fh)
    result = backend().bedset.get_ids_list(query=query, limit=page_size, offset=offset)
    rows = result.results
    what = f"BEDsets matching '{query}'" if query else "BEDsets"
    summary = (
        f"{what}: {_span(offset, len(rows))} of {result.count}."
        if rows
        else f"No {what}."
    )
    hint = (
        f'get_bedset(id="{rows[0].id}") for its members and statistics.'
        if rows
        else None
    )
    if not rows and offset == 0:
        hint = "Try a broader word, or omit query to list all BEDsets."
    return _page(
        rows, summary, page_size, clamped, offset, fh, total=result.count, hint=hint
    )


@_tool
def get_bedset(
    id: str, view: Literal["record", "full"] = "record"
) -> BedSetSummary | BedSetMetadata:
    """
    Get one BEDbase BEDset: description, aggregate statistics, and member BED
    ids. The default record (~0.2-0.3K tokens) lists the first 20 member ids and
    bed_ids_total. view="full" lists every member id; for large sets that is
    over 100K tokens (see full_record.approx_tokens first). Next: get_bed(id) on
    a member id.

    Args:
        id: The BEDset id (a short slug) from search_bedset, or its
            https://bedbase.org/bedset/<id> URL.
        view: "record" (default) or "full".
    """
    bedset_id = _id_from(id, "bedset")
    full = backend().bedset.get(bedset_id, full=True)
    return full if view == "full" else BedSetSummary.from_full(full)


# =========================================================================== #
# Browse, filter values, and bulk exports. list_bed, list_genomes, list_assays, #
# and get_platform_stats are cached; see _cached.                              #
# =========================================================================== #
@_tool
def list_bed(
    genome: str | None = None,
    bed_compliance: str | None = None,
    page_size: int = LIST_PAGE_DEFAULT,
    token: str | None = None,
) -> ToolPage[BedHit]:
    """List BEDbase BED files without a search query, optionally filtered by
    genome or BED type, ordered by id. Same rows as search_bed, ~2K tokens per
    20. For finding files by topic use search_bed instead. Next: get_bed(id).

    Args:
        genome: Optional genome filter, e.g. "hg38". list_genomes() shows valid values.
        bed_compliance: Optional BED-type filter, e.g. "bed6+4".
        page_size: Rows per page, default 20, at most 100.
        token: pagination.next_page_token from a previous call for the same filters.
    """
    page_size, clamped = clamp(page_size, LIST_PAGE_DEFAULT, LIST_PAGE_CAP)
    fh = filters_hash(
        "list_bed", genome=genome, bed_compliance=bed_compliance, page_size=page_size
    )
    offset, after = decode(token, fh)

    def produce():
        return backend().bed.get_ids_list(
            limit=page_size,
            offset=offset,
            genome=genome,
            bed_compliance=bed_compliance,
            after=after,
        )

    result = _cached(
        ("list_bed", genome, bed_compliance, page_size, offset, after), produce
    )
    rows = [BedHit.from_metadata(r) for r in result.results]
    # Keyset paging: the next page continues after the last id we returned.
    next_token = encode(0, fh, after=rows[-1].id) if len(rows) == page_size else None
    where = "".join(
        f" {k}={v}"
        for k, v in (("genome", genome), ("bed_compliance", bed_compliance))
        if v
    )
    of_total = f" of {result.count}" if result.count is not None else ""
    return ToolPage(
        summary=(
            f"BED files{where}, ordered by id: {len(rows)}{of_total}."
            if rows
            else f"No BED files{where}."
        ),
        rows=rows,
        pagination=Pagination(
            page_size=page_size,
            next_page_token=next_token,
            total=result.count,
            limit_applied=page_size if clamped else None,
        ),
        hint=_next_get_bed(rows),
    )


@_tool
def list_genomes() -> BaseListResponse:
    """List the genome assemblies in BEDbase (valid values for the genome=
    filter on search_bed and list_bed). Under 0.1K tokens."""
    genomes = _cached("list_genomes", backend().get_list_genomes)
    return BaseListResponse(
        count=len(genomes), limit=len(genomes), offset=0, results=genomes
    )


@_tool
def list_assays() -> BaseListResponse:
    """List the assay types in BEDbase (valid values for the assay= filter on
    search_bed). Under 0.2K tokens."""
    assays = _cached("list_assays", backend().get_list_assays)
    return BaseListResponse(
        count=len(assays), limit=len(assays), offset=0, results=assays
    )


@_tool
def get_platform_stats() -> StatsReturn:
    """Get BEDbase totals: number of BED files, BEDsets, and genomes. Under 0.1K
    tokens."""
    return _cached("get_platform_stats", backend().get_stats)


@_tool
def list_exports(
    page_size: int = LIST_PAGE_DEFAULT, token: str | None = None
) -> ToolPage[BedSnapshotResult]:
    """List BEDbase bulk-metadata export snapshots (Parquet files of every BED
    file's metadata) for offline analysis, newest first. ~0.1K tokens per row;
    each row's file_path is an HTTPS download URL.

    Args:
        page_size: Rows per page, default 20, at most 100.
        token: pagination.next_page_token from a previous call.
    """
    page_size, clamped = clamp(page_size, LIST_PAGE_DEFAULT, LIST_PAGE_CAP)
    fh = filters_hash("list_exports", page_size=page_size)
    offset, _ = decode(token, fh)
    result = backend().snapshot.list(limit=page_size, offset=offset)
    rows = [
        row.model_copy(update={"file_path": build_exports_url(row.file_path)})
        for row in result.results
    ]
    total = getattr(result, "count", None)
    of_total = f" of {total}" if total is not None else ""
    return _page(
        rows,
        f"Export snapshots, newest first: {_span(offset, len(rows))}{of_total}."
        if rows
        else "No export snapshots.",
        page_size,
        clamped,
        offset,
        fh,
        total=total,
    )


# A chatbot reads region text in its context, so cap it near 20K tokens. The
# REST route allows far more (MAX_REGIONS_OUTPUT_BYTES) for programs.
MCP_REGIONS_MAX_BYTES = 80_000


@_tool
def get_regions(
    id: str,
    chrom: str,
    start: int | None = None,
    end: int | None = None,
) -> str:
    """
    Read the intervals of one BEDbase BED file on a chromosome, optionally
    within a range, as BED text (chrom, start, end per line). At most ~20K
    tokens (about 4,000 regions); a bigger answer is a too_large error, so pass
    start and end for dense files. Needs the file's bigBed (see get_bed's
    downloads.bigbed_file).

    Args:
        id: The 32-character BED id, or its https://bedbase.org/bed/<id> URL.
        chrom: Chromosome name, e.g. "chr1".
        start: Optional 0-based start of the range.
        end: Optional end of the range (must be > start).
    """
    bed_id = _require_bed_id(id)
    if start is not None and end is not None and end <= start:
        raise tool_error("invalid_input", "end must be greater than start.")

    bigbed = backend().bed.get_files(bed_id).bigbed_file
    if not bigbed:
        raise tool_error(
            "unavailable",
            "This BED file has no bigBed, so its regions can't be queried.",
            f'get_bed(id="{bed_id}") has the download link for the whole file.',
        )
    path = build_exports_url(bigbed.path)

    cmd = ["bigBedToBed", f"-chrom={chrom}"]
    if start is not None:
        cmd.append(f"-start={start}")
    if end is not None:
        cmd.append(f"-end={end}")
    cmd.extend([path, "stdout"])

    try:
        return run_bigbed_to_bed(cmd, BIGBED_TIMEOUT_SECONDS, MCP_REGIONS_MAX_BYTES)
    except RegionOutputTooLarge:
        raise tool_error(
            "too_large",
            f"More than {MCP_REGIONS_MAX_BYTES // 1000} KB of regions in that range.",
            "Call again with a narrower start and end.",
        ) from None
    except FileNotFoundError:
        raise tool_error(
            "unavailable",
            "Region queries are off on this server (bigBedToBed is not installed).",
            f'get_bed(id="{bed_id}") has the download link for the whole file.',
        ) from None
    except subprocess.TimeoutExpired:
        raise tool_error(
            "timeout",
            "The region query timed out.",
            "Call again with a narrower start and end.",
        ) from None
    except subprocess.CalledProcessError:
        raise tool_error(
            "unavailable",
            "Reading the bigBed file failed.",
            f'get_bed(id="{bed_id}") has the download link for the whole file.',
        ) from None
