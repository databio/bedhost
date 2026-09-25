"""Safe handling of BED file uploads.

The client-supplied filename is never used to build a path on disk. Uploads are
written to a fresh temporary directory under a server-chosen name, capped at
``const.MAX_FILE_SIZE`` while streaming (gzip uploads are decompressed on the way
in and capped at ``const.MAX_UNCOMPRESSED_SIZE``), and parsed into a ``RegionSet`` in one
place so every upload route gets the same validation.
"""

import gzip
import os
import tempfile
import zlib
from contextlib import contextmanager
from typing import BinaryIO, Iterator, Optional

from fastapi import HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from gtars.models import RegionSet

from . import _LOGGER, const

GZIP_MAGIC = b"\x1f\x8b"


def _too_large_detail(max_bytes: int) -> str:
    return f"File too large. Maximum file size is {max_bytes // (1024 * 1024)} MB."


class _CappedReader:
    """File wrapper that raises HTTP 413 once more than ``max_bytes`` are read."""

    def __init__(self, src: BinaryIO, max_bytes: int):
        self._src = src
        self._max_bytes = max_bytes
        self.total = 0

    def read(self, size: int = -1) -> bytes:
        data = self._src.read(size)
        self.total += len(data)
        if self.total > self._max_bytes:
            raise HTTPException(
                status_code=413, detail=_too_large_detail(self._max_bytes)
            )
        return data


def save_upload(
    file: UploadFile,
    dirpath: str,
    max_bytes: Optional[int] = None,
    max_uncompressed: Optional[int] = None,
) -> str:
    """Copy an upload into ``dirpath`` as ``upload.bed``, a fixed, server-chosen name.

    Gzip uploads (detected by magic bytes) are decompressed while copying, so
    what lands on disk is always plain text. Raises HTTP 413 as soon as more than
    ``max_bytes`` of upload or more than ``max_uncompressed`` of decompressed data
    have been read, so a small, highly compressed file cannot expand without
    bound. Raises HTTP 415 for a corrupt gzip stream and HTTP 400 for an empty upload.

    :param file: the uploaded file
    :param dirpath: directory to write into (should be a fresh temp dir)
    :param max_bytes: upload size limit; defaults to ``const.MAX_FILE_SIZE`` read at call time
    :param max_uncompressed: decompressed size limit for gzip uploads; defaults to
        ``const.MAX_UNCOMPRESSED_SIZE`` read at call time
    :return: path of the written file
    """
    if max_bytes is None:
        max_bytes = const.MAX_FILE_SIZE
    if max_uncompressed is None:
        max_uncompressed = const.MAX_UNCOMPRESSED_SIZE

    src = file.file
    src.seek(0)
    is_gzip = src.read(len(GZIP_MAGIC)) == GZIP_MAGIC
    src.seek(0)

    reader = _CappedReader(src, max_bytes)
    if is_gzip:
        stream = gzip.GzipFile(fileobj=reader, mode="rb")
        limit = max_uncompressed
    else:
        stream = reader
        limit = max_bytes

    dest = os.path.join(dirpath, "upload.bed")
    total = 0
    fd = os.open(dest, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as out:
        try:
            while chunk := stream.read(const.UPLOAD_CHUNK_SIZE):
                total += len(chunk)
                if total > limit:
                    raise HTTPException(
                        status_code=413, detail=_too_large_detail(limit)
                    )
                out.write(chunk)
        except (OSError, EOFError, zlib.error) as e:
            _LOGGER.warning(f"Error decompressing uploaded file: {e}")
            raise HTTPException(
                status_code=415, detail="Uploaded file is not a valid gzip file."
            )

    if total == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    return dest


@contextmanager
def uploaded_region_set(
    file: Optional[UploadFile], *, validate_for_search: bool = False
) -> Iterator[RegionSet]:
    """Save an upload to a temp dir and yield a validated ``RegionSet``.

    The temp file exists for the lifetime of the ``with`` block, so callers can
    pass the region set to code that may still read its path.

    :param file: the uploaded file
    :param validate_for_search: also require mean region width >= MIN_REGION_WIDTH
    """
    if file is None:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    with tempfile.TemporaryDirectory(prefix="bedhost-upload-") as dirpath:
        path = save_upload(file, dirpath)
        try:
            region_set = RegionSet(path)
        except Exception as e:
            _LOGGER.warning(f"Error reading uploaded bed file: {e}")
            raise HTTPException(
                status_code=415,
                detail="Error reading bed file. Please make sure the file is a valid BED file.",
            )

        n_regions = len(region_set)
        if n_regions > const.MAX_REGION_NUMBER:
            raise HTTPException(
                status_code=413,
                detail=f"Too many regions in the BED file. Maximum is {const.MAX_REGION_NUMBER:,} regions.",
            )
        if n_regions == 0:
            raise HTTPException(status_code=415, detail="BED file contains no regions.")
        if (
            validate_for_search
            and region_set.mean_region_width() < const.MIN_REGION_WIDTH
        ):
            raise HTTPException(
                status_code=415,
                detail=f"Mean region width is too small. Please provide a BED file with mean region width of at least {const.MIN_REGION_WIDTH}.",
            )

        yield region_set


async def upload_size_guard(request: Request, call_next):
    """Reject oversized upload requests by Content-Length before the body is parsed.

    This is a cheap early check only; ``save_upload`` enforces the real limit
    while streaming, since Content-Length can be wrong.
    """
    if request.method == "POST" and request.url.path in const.UPLOAD_ROUTES:
        cl = request.headers.get("content-length")
        if cl is None:
            return JSONResponse({"detail": "Content-Length required."}, status_code=411)
        try:
            n = int(cl)
        except ValueError:
            return JSONResponse({"detail": "Invalid Content-Length."}, status_code=400)
        if n > const.MAX_FILE_SIZE + const.MULTIPART_OVERHEAD:
            return JSONResponse(
                {"detail": _too_large_detail(const.MAX_FILE_SIZE)}, status_code=413
            )
    return await call_next(request)
