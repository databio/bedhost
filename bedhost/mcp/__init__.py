"""
MCP server exposing BEDbase (genomic interval datasets) to LLM tools.

tools.py builds the server (instructions + tool registrations), holds the
single-agent backend injection and the TTL cache; schemas.py holds the one new
wire model (the ToolPage/Pagination paging envelope) — every other tool return
type reuses an existing bbconf model; paging.py does opaque, query-bound token
paging for the list/search tools; stdio.py is the ``bedhost-mcp`` console script
for local stdio use. The HTTP server (bedhost.main) mounts the same tool set over
Streamable HTTP at /mcp.

The ``mcp`` dependency ships only in the ``mcp`` extra, so importing tools.py
without it raises a clear ImportError. This package must stay free of the web
stack: it is installable and usable without the server, and it imports only the
domain layer (bbconf) plus pure helpers (bedhost.const, bedhost.helpers) — never
bedhost.routers, bedhost.main, fastapi, or starlette. tests/mcp/test_layering.py
enforces that.

There is exactly ONE bbconf BedBaseAgent per process: in HTTP mode the FastAPI
app injects its own app.state.bbagent via set_backend(); in stdio mode backend()
lazily builds the single agent from BEDBASE_CONFIG. The two paths are mutually
exclusive — see tools.py.
"""
