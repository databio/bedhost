"""
Tool errors with a stable, machine-readable code.

Every failure a tool reports is a ToolError whose text is compact JSON:
``{"error": <code>, "message": ..., "hint": ...}`` plus optional extra fields
(for example ``valid`` for an unknown argument). The chatbot reads ``hint`` as
its next step, so a hint always names a call that fixes the problem.
"""

import json

from mcp.server.mcpserver.exceptions import ToolError

ERROR_CODES = (
    "not_found",  # the id is well formed but nothing has it
    "invalid_input",  # an argument is malformed or unknown
    "unavailable",  # this server cannot do it (ML off, no bigBed, no config)
    "too_large",  # the answer is over the size cap; narrow the request
    "timeout",  # the work took too long; narrow the request
    "bad_token",  # the paging token is not ours or belongs to another query
)


def tool_error(code: str, message: str, hint: str | None = None, **extra) -> ToolError:
    """Build a ToolError carrying ``code`` (one of ERROR_CODES) as JSON."""
    if code not in ERROR_CODES:
        raise ValueError(f"unknown tool error code {code!r}")
    body = {"error": code, "message": message, "hint": hint, **extra}
    return ToolError(json.dumps(body, separators=(",", ":")))


def error_code(err: ToolError) -> str | None:
    """Read the code back out of a ToolError built by tool_error (for logs)."""
    try:
        return json.loads(str(err)).get("error")
    except (ValueError, AttributeError):
        return None
