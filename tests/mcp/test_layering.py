"""Enforce the layering contract: bedhost/mcp must not import the web stack.

Two checks: a static ast scan of the package's import statements, and a runtime
check (in a clean subprocess) that importing the tools does not pull fastapi or
the server wiring in transitively. starlette is intentionally *not* forbidden —
the MCP SDK's Streamable HTTP transport is built on it, so importing the SDK
unavoidably imports starlette; the contract is about bedhost's own web layer.
"""

import ast
import pathlib
import subprocess
import sys

MCP_DIR = pathlib.Path(__file__).resolve().parents[2] / "bedhost" / "mcp"

# Direct imports that would couple the MCP package to the web stack.
FORBIDDEN = (
    "fastapi",
    "starlette",
    "bedhost.routers",
    "bedhost.main",
    "bedhost.helpers",
    "bedhost.data_models",
)


def _absolute_imports(path: pathlib.Path):
    tree = ast.parse(path.read_text())
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                yield alias.name
        elif isinstance(node, ast.ImportFrom):
            # level > 0 is a relative import within the package; always allowed.
            if node.module and node.level == 0:
                yield node.module


def test_mcp_package_has_no_web_stack_imports():
    offenders = {}
    for py in sorted(MCP_DIR.glob("*.py")):
        bad = [
            mod
            for mod in _absolute_imports(py)
            if any(mod == f or mod.startswith(f + ".") for f in FORBIDDEN)
        ]
        if bad:
            offenders[py.name] = bad
    assert not offenders, f"web-stack imports found in bedhost/mcp: {offenders}"


def test_importing_tools_does_not_pull_in_fastapi():
    code = (
        "import bedhost.mcp.tools, sys\n"
        "leaked = [m for m in "
        "('fastapi','bedhost.routers','bedhost.main','bedhost.data_models','bedhost.helpers') "
        "if m in sys.modules]\n"
        "assert not leaked, leaked\n"
        "print('clean')\n"
    )
    result = subprocess.run(
        [sys.executable, "-c", code], capture_output=True, text=True
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_missing_extra_gives_a_friendly_error():
    # Block `import mcp` in a clean interpreter and confirm tools.py re-raises a
    # message that names the 'mcp' extra, rather than a bare ImportError.
    code = (
        "import sys\n"
        "sys.modules['mcp'] = None\n"  # any `import mcp[...]` now raises ImportError
        "try:\n"
        "    import bedhost.mcp.tools\n"
        "    print('NO ERROR'); sys.exit(2)\n"
        "except ImportError as e:\n"
        "    assert \"'mcp' extra\" in str(e), str(e)\n"
        "    print('friendly')\n"
    )
    result = subprocess.run(
        [sys.executable, "-c", code], capture_output=True, text=True
    )
    assert result.returncode == 0, result.stdout + result.stderr
