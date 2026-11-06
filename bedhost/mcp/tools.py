"""
The bedhost MCP server: builds the MCPServer, its instructions, the single-agent
backend injection, the TTL cache, and every tool.

Tools reuse the same ``BedBaseAgent`` code path the REST routers use, so MCP and
REST can never drift. Return types reuse bbconf models (wrapped in a ToolPage for
list/search pages — see schemas.py). This module must not import the web stack
(fastapi/starlette/bedhost.routers/bedhost.main); it imports only bbconf, the pure
bedhost.const, the MCP SDK, and the stdlib. tests/mcp/test_layering.py enforces it.
"""

import functools
import inspect
import os
import subprocess
import tempfile
import threading

# The MCP SDK ships only in the `mcp` extra; make its absence a clear message.
try:
    from mcp.server.mcpserver import MCPServer
    from mcp.server.mcpserver.exceptions import ToolError
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
from bbconf.models.bed_models import QdrantSearchResult

from bedhost._version import __version__ as bedhost_version
from bedhost.const import (
    BIGBED_TIMEOUT_SECONDS,
    EXPORTS_URL_BASE,
    MAX_REGIONS_OUTPUT_BYTES,
)

from .paging import clamp, decode, encode, filters_hash
from .schemas import NameList, Pagination, ToolPage

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
            raise ToolError(
                "Set BEDBASE_CONFIG to a bedbase config file to use this server."
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
# Server + instructions (short; the usual path, the id rule, do-what-results-say) #
# --------------------------------------------------------------------------- #
INSTRUCTIONS = """\
BEDbase is a catalog of genomic interval datasets (BED files) and curated
collections (BEDsets), each with QC stats and download links.
Start with search_bed(query=...) for natural-language discovery; then get_bed(id)
for the full record, get_bed_stats(id) for QC, get_bed_files(id) for download URLs,
get_bed_neighbours(id) for similar files. search_bedset(query=...) + get_bedset(id)
cover collections. list_bed() browses with genome/compliance filters;
list_genomes()/list_assays() show valid filter values.
A BED id is a 32-character md5 digest; a BEDset id is a short slug. Pass id= as
returned — never guess one. search_bed also accepts a GEO/ENCODE accession or a BED id.
List tools return 20 rows/page (page_size up to 100); pass the returned
pagination.next_page_token back as token. Every tool is read-only.
"""

# tool name -> its declared parameter names, for the unknown-argument guard.
_PARAMS: dict[str, tuple[str, ...]] = {}


class _StrictMCP(MCPServer):
    """Refuse arguments a tool doesn't declare (the SDK silently drops them)."""

    async def call_tool(self, name, arguments, context=None):
        params = _PARAMS.get(name)
        if params is not None and (unknown := sorted(set(arguments) - set(params))):
            import difflib

            msg = (
                f"{name} has no argument {', '.join(map(repr, unknown))}. "
                f"Its arguments: {', '.join(params)}."
            )
            for a in unknown:
                if close := difflib.get_close_matches(a, params, n=1):
                    msg += f" Did you mean '{close[0]}'?"
            raise ToolError(msg)
        return await super().call_tool(name, arguments, context)


mcp = _StrictMCP("bedbase", version=bedhost_version, instructions=INSTRUCTIONS)


# --------------------------------------------------------------------------- #
# Registration decorator: record params + turn expected failures into ToolError  #
# whose hint is a safe, literal next command (never one that restarts the flow). #
# --------------------------------------------------------------------------- #
_HINTS: tuple[tuple[type[Exception], str], ...] = (
    (
        BEDFileNotFoundError,
        'No BED with that id. search_bed(query="...") or list_bed() return valid '
        "32-character ids.",
    ),
    (
        BedSetNotFoundError,
        'No BEDset with that id. search_bedset(query="...") returns valid ids.',
    ),
    (
        TokenizeFileNotExistError,
        "That file has no tokenized form for this universe.",
    ),
    (
        SnapshotNotFoundError,
        "No such export. list_exports() shows the available snapshots.",
    ),
    (
        AnalysisFileNotFoundError,
        "No such analysis file.",
    ),
)


def _tool(fn):
    """Register fn as a tool; surface its expected failures as ToolError + a hint."""
    _PARAMS[fn.__name__] = tuple(inspect.signature(fn).parameters)

    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except ToolError:
            raise
        except (BedBaseConfError, ValueError) as e:
            hint = next((h for t, h in _HINTS if isinstance(e, t)), "")
            raise ToolError(f"{e} {hint}".strip()) from e

    return mcp.tool()(wrapper)


# --------------------------------------------------------------------------- #
# Small shared helpers                                                          #
# --------------------------------------------------------------------------- #
def _require_bed_id(bed_id: str) -> str:
    """Reject an obviously-wrong BED id before it reaches the database."""
    cleaned = (bed_id or "").strip()
    if len(cleaned) != 32:
        raise ToolError(
            "A BED id is a 32-character md5 digest; pass one from search_bed or "
            "list_bed, not a name."
        )
    return cleaned


def _build_exports_url(file_path: str) -> str:
    """Absolute HTTPS CDN URL for an S3 key (mirror of bedhost.helpers.build_exports_url,
    reimplemented here so the MCP package stays free of the fastapi-importing helpers)."""
    return f"{EXPORTS_URL_BASE.rstrip('/')}/{file_path.lstrip('/')}"


def _offset_page(rows, page_size, offset, fh, total, hint=None):
    """Build a ToolPage for offset-based bbconf results."""
    next_token = encode(offset + page_size, fh) if len(rows) == page_size else None
    return ToolPage(
        rows=rows,
        pagination=Pagination(
            page_size=page_size, next_page_token=next_token, total=total
        ),
        hint=hint,
    )


# =========================================================================== #
# v1 — search & inspect                                                        #
# =========================================================================== #
_ACCESSION_PREFIXES = ("gsm", "gse", "encff", "encsr", "geo:", "encode:")


@_tool
def search_bed(
    query: str,
    genome: str | None = None,
    assay: str | None = None,
    page_size: int = 20,
    token: str | None = None,
) -> ToolPage[QdrantSearchResult]:
    """
    Find BED files by a natural-language description (the primary discovery tool).

    Also accepts a GEO/ENCODE accession (e.g. "GSM123", "ENCFF123ABC") or a 32-char
    BED id, which resolve without ML. Next: get_bed(id) on a hit for the full record,
    or get_bed_neighbours(id) for more like it.

    Args:
        query: Free text ("ATAC-seq peaks in liver"), a GEO/ENCODE accession, or a BED id.
        genome: Optional genome filter, e.g. "hg38". list_genomes() shows valid values.
        assay: Optional assay filter. list_assays() shows valid values.
        page_size: Rows per page (1-100, default 20).
        token: pagination.next_page_token from a previous call for the same query.
    """
    page_size = clamp(page_size)
    fh = filters_hash("search_bed", query=query, genome=genome, assay=assay)
    offset, _ = decode(token, fh)
    agent = backend()

    spaceless = query.replace(" ", "")

    # Fast path 1: an exact 32-char BED id.
    if len(spaceless) == 32 and spaceless == query:
        try:
            meta = agent.bed.get(query)
        except BEDFileNotFoundError:
            meta = None
        if meta is not None:
            row = QdrantSearchResult(id=query, payload={}, score=1.0, metadata=meta)
            return _offset_page(
                [row] if offset == 0 else [],
                page_size,
                offset,
                fh,
                total=1,
                hint=f'Exact id match. get_bed_neighbours(id="{query}") for similar files.',
            )

    # Fast path 2: a GEO/ENCODE accession.
    low = spaceless.lower()
    if any(low.startswith(p) for p in _ACCESSION_PREFIXES):
        acc = low.replace("geo:", "").replace("encode:", "")
        source, accession = None, None
        if acc.startswith(("gsm", "gse")):
            source, accession = "geo", acc
        elif acc.startswith(("encff", "encsr")):
            source, accession = "encode", acc.upper()
        if source:
            result = agent.bed.search_external_file(source=source, accession=accession)
            if result.count:
                return _offset_page(
                    result.results, page_size, offset, fh, total=result.count
                )

    # Semantic/hybrid search needs the dense encoder; degrade gracefully if disabled.
    if getattr(agent.config, "dense_encoder", None) is None:
        return _offset_page(
            [],
            page_size,
            offset,
            fh,
            total=0,
            hint=(
                "Semantic search needs ML models, which are disabled here. Query by a "
                "GEO/ENCODE accession or a 32-character BED id (no ML needed), try "
                "list_bed(genome=...), or run with BEDHOST_INIT_ML=true."
            ),
        )

    result = agent.bed.hybrid_search(
        query,
        genome_alias=genome or "",
        assay=assay or "",
        limit=page_size,
        offset=offset,
    )
    hint = None
    if not result.results and offset == 0:
        hint = (
            "No matches. Search is semantic — try a tissue, assay, or cell-line term, "
            "or a GEO/ENCODE accession."
        )
    return _offset_page(
        result.results, page_size, offset, fh, total=result.count, hint=hint
    )


@_tool
def get_bed(id: str):
    """
    Get the full record for one BED file: metadata, QC stats, files, and bedset
    memberships. Next: get_bed_files(id) for download URLs, get_bed_neighbours(id)
    for similar files.

    Args:
        id: The 32-character BED id, from search_bed or list_bed.
    """
    return backend().bed.get(_require_bed_id(id), full=True)


@_tool
def get_bed_stats(id: str):
    """
    Get the full QC statistics for one BED file: region count, GC content, TSS
    distance, and the exon/intron/intergenic genomic-context distribution.

    Args:
        id: The 32-character BED id, from search_bed or list_bed.
    """
    return backend().bed.get_stats(_require_bed_id(id))


@_tool
def get_bed_files(id: str):
    """
    Get download information for one BED file: the BED and bigBed artifacts with
    their access URLs. Paste a URL into a browser or curl to download.

    Args:
        id: The 32-character BED id, from search_bed or list_bed.
    """
    return backend().bed.get_files(_require_bed_id(id))


@_tool
def get_bed_neighbours(
    id: str,
    page_size: int = 20,
    token: str | None = None,
) -> ToolPage[QdrantSearchResult]:
    """
    Get BED files most similar to this one (vector nearest neighbours). Next:
    get_bed(id) on any row for its full record.

    Args:
        id: The 32-character BED id, from search_bed or list_bed.
        page_size: Rows per page (1-100, default 20).
        token: pagination.next_page_token from a previous call for the same id.
    """
    bed_id = _require_bed_id(id)
    page_size = clamp(page_size)
    fh = filters_hash("get_bed_neighbours", id=bed_id)
    offset, _ = decode(token, fh)
    result = backend().bed.get_neighbours(bed_id, limit=page_size, offset=offset)
    return _offset_page(result.results, page_size, offset, fh, total=result.count)


@_tool
def search_bedset(
    query: str | None = None,
    page_size: int = 20,
    token: str | None = None,
):
    """
    Find BEDsets (curated collections of BED files) by text, or list them all when
    query is omitted. Next: get_bedset(id) for a collection's details and members.

    Args:
        query: Optional free-text filter over BEDset names/descriptions.
        page_size: Rows per page (1-100, default 20).
        token: pagination.next_page_token from a previous call for the same query.
    """
    page_size = clamp(page_size)
    fh = filters_hash("search_bedset", query=query)
    offset, _ = decode(token, fh)
    result = backend().bedset.get_ids_list(query=query, limit=page_size, offset=offset)
    hint = None
    if not result.results and offset == 0:
        hint = "No BEDsets matched. Try a broader term or omit query to list all."
    return _offset_page(
        result.results, page_size, offset, fh, total=result.count, hint=hint
    )


@_tool
def get_bedset(id: str):
    """
    Get the full record for one BEDset: description, member BED ids, and aggregate
    statistics. Next: get_bed(id) on a member id for that file's record.

    Args:
        id: The BEDset id (a short slug), from search_bedset.
    """
    try:
        return backend().bedset.get(id, full=True)
    except BedSetNotFoundError:
        raise ToolError(
            f'No BEDset with id "{id}". search_bedset(query="...") returns valid ids.'
        ) from None


# =========================================================================== #
# v2 — browse, ground, bulk (the first four are cached; see _cached)           #
# =========================================================================== #
@_tool
def list_bed(
    genome: str | None = None,
    bed_compliance: str | None = None,
    page_size: int = 20,
    token: str | None = None,
) -> ToolPage:
    """Browse BED files without a search query, optionally filtered. Ordered by id.
    Next: get_bed(id) for a row's full record. For discovery by description use
    search_bed instead.

    Args:
        genome: Optional genome filter, e.g. "hg38". list_genomes() shows valid values.
        bed_compliance: Optional BED-type filter, e.g. "bed6+4".
        page_size: Rows per page (1-100, default 20).
        token: pagination.next_page_token from a previous call for the same filters.
    """
    page_size = clamp(page_size)
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
    rows = result.results
    # Keyset paging: the next page continues after the last id we returned.
    next_token = encode(0, fh, after=rows[-1].id) if len(rows) == page_size else None
    return ToolPage(
        rows=rows,
        pagination=Pagination(
            page_size=page_size, next_page_token=next_token, total=result.count
        ),
    )


@_tool
def list_genomes() -> NameList:
    """List the genome assemblies present in BEDbase (valid values for the genome=
    filter on search_bed and list_bed)."""
    genomes = _cached("list_genomes", backend().get_list_genomes)
    return NameList(count=len(genomes), results=genomes)


@_tool
def list_assays() -> NameList:
    """List the assay types present in BEDbase (valid values for the assay= filter
    on search_bed)."""
    assays = _cached("list_assays", backend().get_list_assays)
    return NameList(count=len(assays), results=assays)


@_tool
def get_platform_stats():
    """Get BEDbase totals: number of BED files, number of BEDsets, number of genomes."""
    return _cached("get_platform_stats", backend().get_stats)


@_tool
def list_exports(page_size: int = 20, token: str | None = None) -> ToolPage:
    """List published bulk-metadata export snapshots (Parquet) for offline analysis,
    newest first. Each row's file_path is an absolute HTTPS download URL.

    Args:
        page_size: Rows per page (1-100, default 20).
        token: pagination.next_page_token from a previous call.
    """
    page_size = clamp(page_size)
    fh = filters_hash("list_exports", page_size=page_size)
    offset, _ = decode(token, fh)
    result = backend().snapshot.list(limit=page_size, offset=offset)
    rows = [
        row.model_copy(update={"file_path": _build_exports_url(row.file_path)})
        for row in result.results
    ]
    return _offset_page(
        rows, page_size, offset, fh, total=getattr(result, "count", None)
    )


@_tool
def get_bed_classification(id: str):
    """
    Get the BED-compliance classification of one file: its BED type, data format,
    and which columns are standard vs extra.

    Args:
        id: The 32-character BED id, from search_bed or list_bed.
    """
    return backend().bed.get_classification(_require_bed_id(id))


@_tool
def get_reference_validation(id: str):
    """
    Get reference-genome compatibility results for one BED file: which assemblies
    its regions fit, with tier rankings.

    Args:
        id: The 32-character BED id, from search_bed or list_bed.
    """
    return backend().bed.get_reference_validation(_require_bed_id(id))


@_tool
def get_regions(
    id: str,
    chrom: str,
    start: int | None = None,
    end: int | None = None,
) -> str:
    """
    Get the intervals in one BED file that fall on a chromosome (optionally within
    a coordinate range), as BED text (chrom/start/end per line). Needs the file's
    bigBed artifact.

    Args:
        id: The 32-character BED id, from search_bed or list_bed.
        chrom: Chromosome name, e.g. "chr1".
        start: Optional 0-based start of the query range.
        end: Optional end of the query range (must be > start).
    """
    bed_id = _require_bed_id(id)
    if start is not None and end is not None and end <= start:
        raise ToolError("end must be greater than start.")

    bigbed = backend().bed.get_files(bed_id).bigbed_file
    if not bigbed:
        raise ToolError(
            "This BED has no bigBed artifact, so region queries aren't available for it."
        )
    path = _build_exports_url(bigbed.path)

    cmd = ["bigBedToBed", f"-chrom={chrom}"]
    if start is not None:
        cmd.append(f"-start={start}")
    if end is not None:
        cmd.append(f"-end={end}")
    cmd.extend([path, "stdout"])

    try:
        return _run_bigbed_to_bed(cmd, BIGBED_TIMEOUT_SECONDS, MAX_REGIONS_OUTPUT_BYTES)
    except _RegionOutputTooLarge:
        raise ToolError(
            f"Too many regions in that range (over "
            f"{MAX_REGIONS_OUTPUT_BYTES // (1024 * 1024)} MB). Narrow it with start and end."
        ) from None
    except FileNotFoundError:
        raise ToolError(
            "Region queries are unavailable on this server (bigBedToBed is not installed)."
        ) from None
    except subprocess.TimeoutExpired:
        raise ToolError(
            "Region query timed out; narrow the range with start and end."
        ) from None
    except subprocess.CalledProcessError:
        raise ToolError("Failed to query the bigBed file.") from None


# --------------------------------------------------------------------------- #
# Region subprocess runner — ported from bedhost.helpers.run_bigbed_to_bed so   #
# the MCP package stays free of the fastapi-importing helpers module. Keep in    #
# sync with the REST twin.                                                       #
# --------------------------------------------------------------------------- #
class _RegionOutputTooLarge(Exception):
    """bigBedToBed produced more output than the allowed ceiling."""


def _run_bigbed_to_bed(cmd: list[str], timeout: int, max_bytes: int) -> str:
    timed_out = threading.Event()
    rows: list[str] = []
    total = 0
    with (
        tempfile.TemporaryFile() as err,
        subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=err, text=True) as proc,
    ):

        def _kill_on_timeout():
            timed_out.set()
            proc.kill()

        timer = threading.Timer(timeout, _kill_on_timeout)
        timer.start()
        try:
            for line in proc.stdout:
                row = "\t".join(line.rstrip("\n").split("\t", 3)[:3]) + "\n"
                total += len(row)
                if total > max_bytes:
                    proc.kill()
                    raise _RegionOutputTooLarge(
                        f"bigBedToBed output exceeded {max_bytes} bytes"
                    )
                rows.append(row)
            proc.wait()
        finally:
            timer.cancel()

        if timed_out.is_set():
            raise subprocess.TimeoutExpired(cmd, timeout)
        if proc.returncode != 0:
            err.seek(0)
            raise subprocess.CalledProcessError(
                proc.returncode, cmd, stderr=err.read().decode(errors="replace")
            )
    return "".join(rows)
