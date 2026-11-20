"""
Opaque, query-bound token paging for the MCP list/search tools.

A page token encodes the next offset (or a keyset cursor) *plus a hash of the
tool name and its filters*, so a token issued for one query is refused by a
different query instead of silently paging the wrong list. Decode failures come
back as a ``bad_token`` tool error, which the chatbot reads and recovers from.

This module knows nothing about BEDbase. Besides an offset, a token can carry a
keyset cursor (the last id returned), which list_bed uses so deep pages stay
fast. Tokens are not secrets — they only guard against accidental cross-query
reuse, not tampering — so a plain base64(JSON) envelope is enough.
"""

import base64
import hashlib
import json

from .errors import tool_error

# Ranked results (search, neighbours): a chatbot rarely needs more than the top
# few, and deep pages of ranked hits are mostly noise.
SEARCH_PAGE_DEFAULT = 10
SEARCH_PAGE_CAP = 50
# Plain lists (browse by filter, export index).
LIST_PAGE_DEFAULT = 20
LIST_PAGE_CAP = 100


def clamp(n: int | None, default: int, cap: int) -> tuple[int, bool]:
    """Clamp a requested page_size into [1, cap], defaulting when unset.

    Returns ``(page_size, clamped)``; ``clamped`` is True when the request was
    out of range and changed, so the page can report it.
    """
    size = max(1, min(n or default, cap))
    return size, n is not None and size != n


def filters_hash(tool: str, **filters) -> str:
    """Stable short hash of the tool + its non-None filters, binding a token to its query."""
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
    """Decode a token into ``(offset, after)``; raise a bad_token error if it isn't ours or isn't for this query.

    Returns ``(0, None)`` for an empty/absent token (the first page).
    """
    if not token:
        return 0, None
    hint = "Call again with the same arguments and no token to get the first page."
    try:
        padded = token + "=" * (-len(token) % 4)
        p = json.loads(base64.urlsafe_b64decode(padded))
        offset = int(p["o"])
        if p.get("v") != 1 or offset < 0:
            raise ValueError
    except Exception:
        raise tool_error(
            "bad_token", "This token is not one this server issued.", hint
        ) from None
    if p.get("h") != fh:
        # Say which rows it was for: a chatbot told only "different query"
        # tends to give up and ask the user for the original arguments.
        raise tool_error(
            "bad_token",
            "This token was issued for a different query, filters, or server "
            f"session, so it can't be used here. It asked for rows {offset + 1} on.",
            f"Call again with the same arguments and no token, then pass each "
            f"page's pagination.next_page_token back until you reach row "
            f"{offset + 1}.",
        )
    return offset, p.get("a")
