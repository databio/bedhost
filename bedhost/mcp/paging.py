"""
Opaque, query-bound token paging for the MCP list/search tools.

A page token encodes the next offset (or a keyset cursor) *plus a hash of the
tool name and its filters*, so a token issued for one query is refused by a
different query instead of silently paging the wrong list. Decode failures come
back as ToolError, which the chatbot reads and recovers from.

This module is domain-independent: it is the skill's reference paging module,
lightly adapted to also carry an optional keyset cursor (used by list_bed's
``after=`` paging). Tokens are not secrets — they only guard against accidental
cross-query reuse, not tampering — so a plain base64(JSON) envelope is enough.
"""

import base64
import json

from mcp.server.mcpserver.exceptions import ToolError

PAGE_SIZE_DEFAULT = 20
# Matches BEDbase's own MAX_SEARCH_LIMIT: the search/neighbour endpoints cap at 100.
PAGE_SIZE_CAP = 100


def clamp(n: int | None) -> int:
    """Clamp a requested page_size into [1, PAGE_SIZE_CAP], defaulting when unset."""
    return max(1, min(n or PAGE_SIZE_DEFAULT, PAGE_SIZE_CAP))


def filters_hash(tool: str, **filters) -> str:
    """Stable short hash of the tool + its non-None filters, binding a token to its query."""
    import hashlib

    kept = {k: v for k, v in sorted(filters.items()) if v is not None}
    raw = json.dumps([tool, kept], sort_keys=True, default=str).encode()
    return hashlib.sha256(raw).hexdigest()[:10]


def encode(offset: int, fh: str, *, after: str | None = None) -> str:
    """Encode the next-page cursor as an opaque token bound to ``fh``.

    ``offset`` is the offset-paging cursor; ``after`` carries a keyset cursor
    (last-seen id) for deep paging where offset paging is too slow.
    """
    payload = {"v": 1, "o": int(offset), "h": fh}
    if after is not None:
        payload["a"] = after
    raw = json.dumps(payload, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def decode(token: str | None, fh: str) -> tuple[int, str | None]:
    """Decode a token into ``(offset, after)``; raise ToolError if it isn't ours or isn't for this query.

    Returns ``(0, None)`` for an empty/absent token (the first page).
    """
    if not token:
        return 0, None
    try:
        padded = token + "=" * (-len(token) % 4)
        p = json.loads(base64.urlsafe_b64decode(padded))
        offset = int(p["o"])
        if p.get("v") != 1 or offset < 0:
            raise ValueError
    except Exception:
        raise ToolError(
            "token is not one this server issued; start again without a token"
        ) from None
    if p.get("h") != fh:
        raise ToolError("token does not match this query; start again without a token")
    return offset, p.get("a")
