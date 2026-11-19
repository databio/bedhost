"""The chatbot eval task files pass agentxp's schema check (no network, no model).

Uses an installed agentxp if there is one, else the pinned release through uvx;
skips when neither is available.
"""

import pathlib
import shutil
import subprocess

import pytest

AGENTXP = "git+https://github.com/databio/agentxp@v0.1.1"
TASK_FILES = sorted(pathlib.Path(__file__).parent.glob("mcp_tasks*.yaml"))


@pytest.mark.parametrize("path", TASK_FILES, ids=lambda p: p.name)
def test_task_file_is_valid(path):
    try:
        from agentxp import spec
    except ImportError:
        spec = None
    if spec is not None:
        errors, _ = spec.validate(spec.load(path))
        assert not errors, errors
        return
    if shutil.which("uvx") is None:
        pytest.skip("agentxp is not installed and uvx is not available")
    out = subprocess.run(
        ["uvx", "--from", AGENTXP, "agentxp", "validate", str(path)],
        capture_output=True,
        text=True,
        timeout=300,
    )
    assert out.returncode == 0, out.stdout + out.stderr
