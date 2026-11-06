"""
Console-script entry point for the bedhost MCP server over stdio.

Installed as ``bedhost-mcp`` by every install (even without the ``mcp`` extra),
so it must degrade to a one-line message rather than a traceback when the SDK is
absent. Point BEDBASE_CONFIG at a bedbase config file before launching; the tools
build a single BedBaseAgent from it on first use.
"""

import sys


def main() -> None:
    try:
        from bedhost.mcp.tools import mcp
    except ImportError as e:
        # Names the missing 'mcp' extra and the fix (see tools.py's import guard).
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
