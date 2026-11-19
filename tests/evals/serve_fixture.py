"""Start the bedhost MCP server on seeded fixture data, for agentxp.

    python tests/evals/serve_fixture.py --port 8765          # HTTP, prints the ready line
    python tests/evals/serve_fixture.py --port 8765 --no-ml  # as a server with ML models off
    python tests/evals/serve_fixture.py --vars               # just the fixture names

Run it with bedhost's own Python (it needs bbconf and the `mcp` extra). It
serves the real tools from bedhost.mcp.tools over Streamable HTTP, backed by
tests/evals/fixture_agent.FixtureAgent instead of Postgres and Qdrant, and puts
a fake bigBedToBed (tests/evals/bin) first on PATH so region queries work
offline. Once the port accepts connections it prints one JSON line:
{"url": ..., "vars": {...}}. Every start serves identical data.
"""

import argparse
import json
import os
import socket
import sys
import tempfile
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.dirname(os.path.dirname(HERE)))  # the repo root


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument(
        "--no-ml", action="store_true", help="serve as if ML models are off"
    )
    ap.add_argument(
        "--vars", action="store_true", help="print the fixture names and exit"
    )
    args = ap.parse_args()

    os.environ.setdefault("BEDHOST_MCP_CACHE_TTL", "0")
    from fixture_agent import FixtureAgent

    agent = FixtureAgent(ml=not args.no_ml)
    if args.vars:
        print(json.dumps({"vars": agent.vars()}))
        return

    regions = os.path.join(tempfile.mkdtemp(prefix="bedhost-evals-"), "regions.json")
    with open(regions, "w") as f:
        json.dump(agent.region_specs(), f)
    os.environ["BEDHOST_FAKE_REGIONS"] = regions
    os.environ["PATH"] = os.path.join(HERE, "bin") + os.pathsep + os.environ["PATH"]

    import uvicorn

    from bedhost.mcp import tools

    tools.set_backend(agent)
    app = tools.mcp.streamable_http_app()
    server = uvicorn.Server(
        uvicorn.Config(app, host="127.0.0.1", port=args.port, log_level="warning")
    )
    threading.Thread(target=server.run, daemon=True).start()
    while True:
        try:
            socket.create_connection(("127.0.0.1", args.port), timeout=1).close()
            break
        except OSError:
            time.sleep(0.05)
    url = f"http://127.0.0.1:{args.port}/mcp"
    print(json.dumps({"url": url, "vars": agent.vars()}), flush=True)
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
