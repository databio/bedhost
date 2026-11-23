"""
Logic shared by the REST routers and the MCP server.

Must not import fastapi, starlette, or any other bedhost module except const.
The MCP package imports this module, and the MCP package has to work without
the web stack installed (tests/mcp/test_layering.py checks both rules).
"""

import logging
import subprocess
import tempfile
import threading
from dataclasses import dataclass
from enum import Enum

from bbconf.exceptions import BEDFileNotFoundError
from bbconf.models.bed_models import BedListSearchResult, QdrantSearchResult
from pydantic import BaseModel

from .const import EXPORTS_URL_BASE, PKG_NAME

_LOGGER = logging.getLogger(PKG_NAME)


class BaseListResponse(BaseModel):
    count: int
    limit: int
    offset: int
    results: list


# --------------------------------------------------------------------------- #
# Region queries (bigBedToBed)                                                  #
# --------------------------------------------------------------------------- #
class RegionOutputTooLarge(Exception):
    """bigBedToBed produced more output than the allowed ceiling."""


def run_bigbed_to_bed(cmd: list[str], timeout: int, max_bytes: int) -> str:
    """Run bigBedToBed, wait for it, return only the first 3 BED columns.

    Output is read line by line and trimmed as it arrives, so memory is bounded
    by ``max_bytes`` rather than by the size of the bigBed file.

    Args:
        cmd: Full argv for the ``bigBedToBed`` invocation (no shell).
        timeout: Wall-clock timeout in seconds.
        max_bytes: Ceiling on the trimmed output size.

    Returns:
        The first three tab-separated columns of each output line,
        newline-terminated. Empty string if there is no output.

    Raises:
        FileNotFoundError: If the binary is missing.
        RegionOutputTooLarge: If the output exceeds ``max_bytes``. The child is
            killed before this is raised.
        subprocess.TimeoutExpired: If the process exceeds ``timeout``. The
            child is killed before this is raised.
        subprocess.CalledProcessError: If the process exits non-zero.
    """
    timed_out = threading.Event()
    rows: list[str] = []
    total = 0
    # stderr goes to a file so a chatty child can never block on a full pipe.
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
                    raise RegionOutputTooLarge(
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


def build_exports_url(file_path: str) -> str:
    """
    Build a public HTTPS CDN URL for an export / analysis-file S3 key.

    Uses explicit string concatenation rather than ``os.path.join``: the latter
    is a filesystem operation and, given an absolute ``file_path`` (leading
    ``/``), silently discards the base URL entirely — dropping the scheme and
    host. Stripping a trailing slash off the base and a leading slash off the
    key guarantees exactly one separator and always preserves the host.

    Args:
        file_path: The S3 key (relative or absolute) of the artifact.

    Returns:
        The absolute ``https://data2.bedbase.org/...`` URL for the artifact.
    """
    return f"{EXPORTS_URL_BASE.rstrip('/')}/{file_path.lstrip('/')}"


# --------------------------------------------------------------------------- #
# BED text search                                                               #
# --------------------------------------------------------------------------- #
class SearchKind(str, Enum):
    """Which path search_bed took to answer a query."""

    EXACT_ID = "exact_id"
    ACCESSION = "accession"
    SEMANTIC = "semantic"


class MLUnavailable(Exception):
    """Semantic search was needed but the dense encoder is not loaded."""


@dataclass
class BedSearchOutcome:
    kind: SearchKind
    result: BedListSearchResult
    # ACCESSION only: files the accession matched that the genome/assay filters
    # removed. Lets callers explain an empty page.
    filtered_out: int = 0


_ACCESSION_PREFIXES = ("gsm", "gse", "encff", "encsr", "geo:", "encode:")


def _parse_accession(query: str) -> tuple[str, str] | None:
    """Return ``(source, accession)`` for a GEO/ENCODE accession, else None."""
    low = query.replace(" ", "").lower()
    if not low.startswith(_ACCESSION_PREFIXES):
        return None
    acc = low.replace("geo:", "").replace("encode:", "")
    if acc.startswith(("gsm", "gse")):
        return "geo", acc
    if acc.startswith(("encff", "encsr")):
        return "encode", acc.upper()
    return None


def _exact_id_result(agent, bed_id: str, limit: int, offset: int):
    """The file itself first, then its nearest neighbours; None if no such file.

    The file takes slot 0, so a page at ``offset`` holds neighbours starting at
    ``offset - 1``. If the vector index is not loaded or the neighbour lookup
    fails, the result is just the file.

    ``count`` does not depend on ``limit`` or ``offset``: when neighbours can be
    ranked it is bbconf's neighbour count (the catalog size, the same number
    /bed/{id}/neighbours reports); when they cannot, it is 1.
    """
    try:
        meta = agent.bed.get(bed_id)
    except BEDFileNotFoundError:
        return None
    hit = QdrantSearchResult(id=bed_id, payload={}, score=1.0, metadata=meta)
    first = [hit] if offset == 0 else []

    def result(count, rows):
        return BedListSearchResult(
            count=count, limit=limit, offset=offset, results=rows
        )

    if getattr(agent.config, "qdrant_file_backend", None) is None:
        return result(1, first)

    n_limit = limit - 1 if offset == 0 else limit
    if n_limit == 0:  # limit 1 at offset 0: the page is just the file
        return result(agent.get_stats().bedfiles_number, first)
    n_offset = 0 if offset == 0 else offset - 1
    try:
        neighbours = agent.bed.get_neighbours(bed_id, limit=n_limit, offset=n_offset)
    except Exception as e:  # the file exists; neighbours are a bonus
        _LOGGER.warning(f"Neighbour lookup failed for {bed_id}: {e}")
        return result(1, first)
    # A page past the last neighbour is empty but the count stays the same.
    return result(max(neighbours.count, 1), first + list(neighbours.results or []))


def _matches_filters(row, genome: str | None, assay: str | None) -> bool:
    """True if a search row passes the genome/assay filters.

    Same exact-match rule hybrid_search applies (genome_alias, annotation.assay).
    """
    meta = row.metadata
    if meta is None:
        return False
    if genome and meta.genome_alias != genome:
        return False
    if assay and (meta.annotation is None or meta.annotation.assay != assay):
        return False
    return True


def search_bed(
    agent,
    query: str,
    genome: str | None = None,
    assay: str | None = None,
    limit: int = 10,
    offset: int = 0,
) -> BedSearchOutcome:
    """Exact BED id -> GEO/ENCODE accession -> hybrid semantic search.

    The first two paths need no ML models. Only the semantic path needs the
    dense encoder; without it this raises MLUnavailable.

    Args:
        agent: The bbconf BedBaseAgent.
        query: Free text, a GEO/ENCODE accession, or a 32-character BED id.
        genome: Genome filter (e.g. "hg38") for accession and semantic search.
            Ignored when query is a BED id: that file is always returned.
        assay: Assay filter (e.g. "ATAC-seq") for accession and semantic
            search. Ignored when query is a BED id.
        limit: Rows to return.
        offset: Rows to skip.

    Raises:
        MLUnavailable: If the query needs semantic search and ML is off.
    """
    spaceless = query.replace(" ", "")
    if len(spaceless) == 32 and spaceless == query:
        result = _exact_id_result(agent, query, limit, offset)
        if result is not None:
            return BedSearchOutcome(SearchKind.EXACT_ID, result)

    if parsed := _parse_accession(query):
        source, accession = parsed
        _LOGGER.info(f"Searching for {source} accession {accession}")
        found = agent.bed.search_external_file(source=source, accession=accession)
        if found.count:
            # A GEO series or ENCODE experiment can hold files from several
            # genomes and assays. If the filters remove them all, the answer is
            # still "this accession, nothing matching": semantic search on an
            # accession string would only return noise.
            kept = [
                r for r in found.results or [] if _matches_filters(r, genome, assay)
            ]
            return BedSearchOutcome(
                SearchKind.ACCESSION,
                BedListSearchResult(
                    count=len(kept),
                    limit=limit,
                    offset=offset,
                    results=kept[offset : offset + limit],
                ),
                filtered_out=len(found.results or []) - len(kept),
            )

    if getattr(agent.config, "dense_encoder", None) is None:
        raise MLUnavailable("Text search unavailable (ML models disabled)")
    result = agent.bed.hybrid_search(
        query,
        genome_alias=genome or "",
        assay=assay or "",
        limit=limit,
        offset=offset,
    )
    return BedSearchOutcome(SearchKind.SEMANTIC, result)
