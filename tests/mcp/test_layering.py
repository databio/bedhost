"""Enforce the layering contract: bedhost/mcp and bedhost/core.py must not
import the web stack.

Checks: a static ast scan of the MCP package's import statements, a static scan
that bedhost/core.py imports only the stdlib, pydantic, bbconf, and
bedhost.const, and a runtime check (in a clean subprocess) that importing the
tools or core does not pull fastapi or the server wiring in transitively. The
MCP package may import bedhost.core; that is how it shares logic with REST.
starlette is intentionally *not* forbidden: the MCP SDK's Streamable HTTP
transport is built on it, so importing the SDK unavoidably imports starlette;
the contract is about bedhost's own web layer.
"""

import ast
import pathlib
import subprocess
import sys

BEDHOST_DIR = pathlib.Path(__file__).resolve().parents[2] / "bedhost"
MCP_DIR = BEDHOST_DIR / "mcp"
CORE = BEDHOST_DIR / "core.py"

# Direct imports that would couple the MCP package to the web stack.
FORBIDDEN = (
    "fastapi",
    "starlette",
    "bedhost.routers",
    "bedhost.main",
    "bedhost.helpers",
    "bedhost.data_models",
    "bedhost.utils",
)
# Everything bedhost.core may import besides the standard library.
CORE_ALLOWED = ("pydantic", "bbconf", "bedhost.const")


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


def _core_imports():
    """Every module core.py imports, with relative imports made absolute."""
    tree = ast.parse(CORE.read_text())
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                yield alias.name
        elif isinstance(node, ast.ImportFrom):
            if node.level:
                yield "bedhost" + (f".{node.module}" if node.module else "")
            else:
                yield node.module


def test_core_imports_only_stdlib_pydantic_bbconf_and_const():
    bad = [
        mod
        for mod in _core_imports()
        if mod.split(".")[0] not in sys.stdlib_module_names
        and not any(mod == a or mod.startswith(a + ".") for a in CORE_ALLOWED)
    ]
    assert not bad, f"bedhost/core.py imports {bad}"


def test_importing_tools_does_not_pull_in_fastapi():
    code = (
        "import bedhost.core, bedhost.mcp.tools, sys\n"
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
