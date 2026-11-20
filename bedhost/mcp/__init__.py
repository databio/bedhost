"""
MCP server exposing BEDbase (genomic interval datasets) to LLM tools.

tools.py builds the server (instructions + tool registrations), holds the
single-agent backend injection and the TTL cache; schemas.py holds the wire
models (the ToolPage paging envelope and the trimmed BED/BEDset views; other
returns reuse bbconf models); paging.py does opaque, query-bound token paging
for the list/search tools; errors.py builds coded tool errors; stdio.py is the
``bedhost-mcp`` console script for local stdio use. The HTTP server
(bedhost.main) mounts the same tool set over Streamable HTTP at /mcp.

The ``mcp`` dependency ships only in the ``mcp`` extra, so importing tools.py
without it raises a clear ImportError. This package must stay free of the web
stack: it is installable and usable without the server, and it imports only the
domain layer (bbconf) plus web-free bedhost modules (bedhost.core,
bedhost.const) — never bedhost.routers, bedhost.main, bedhost.helpers, fastapi,
or starlette. tests/mcp/test_layering.py enforces that.

Every tool failure is a ToolError whose text is compact JSON,
``{"error": <code>, "message": ..., "hint": ...}``, with ``<code>`` one of:

- ``not_found``: the id is well formed but no BED file, BEDset, or export has it.
- ``invalid_input``: an argument is malformed or unknown (``valid`` lists the
  tool's arguments).
- ``unavailable``: this server cannot do it (ML models off, no bigBed for the
  file, bigBedToBed missing, no database configured).
- ``too_large``: the answer is over the size cap; narrow the request.
- ``timeout``: the work took too long; narrow the request.
- ``bad_token``: the paging token is not ours or belongs to another query.
- ``internal``: the server failed (a bug or a stored record it cannot read);
  the message carries no detail and retrying will not help.

There is exactly ONE bbconf BedBaseAgent per process: in HTTP mode the FastAPI
app injects its own app.state.bbagent via set_backend(); in stdio mode backend()
lazily builds the single agent from BEDBASE_CONFIG. The two paths are mutually
exclusive — see tools.py.
"""
