"""
Logic shared by the REST routers and the MCP server.

Must not import fastapi, starlette, or any other bedhost module except const.
The MCP package imports this module, and the MCP package has to work without
the web stack installed (tests/mcp/test_layering.py checks both rules).
"""

import subprocess
import tempfile
import threading

from pydantic import BaseModel

from .const import EXPORTS_URL_BASE


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
