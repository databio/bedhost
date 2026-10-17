"""Tests for the bigBedToBed subprocess helper (no running services needed).

Covers ``run_bigbed_to_bed``: it waits for the child process (no zombie/fd
leak), enforces a timeout, surfaces non-zero exits, and trims output to the
first three BED columns, and stops the child once output passes a byte ceiling.
"""

import subprocess
import sys

import pytest

from bedhost.helpers import RegionOutputTooLarge, run_bigbed_to_bed

MAX = 1024 * 1024


def _py_cmd(code: str) -> list[str]:
    return [sys.executable, "-c", code]


def test_returns_first_three_columns():
    cmd = _py_cmd("import sys; sys.stdout.write('chr1\\t10\\t20\\tname\\t0\\t+\\n')")
    result = run_bigbed_to_bed(cmd, timeout=5, max_bytes=MAX)
    assert result == "chr1\t10\t20\n"


def test_multiple_lines():
    cmd = _py_cmd(
        "import sys; sys.stdout.write("
        "'chr1\\t10\\t20\\tname\\t0\\t+\\n'"
        "'chr1\\t30\\t40\\tname2\\t0\\t-\\n'"
        ")"
    )
    result = run_bigbed_to_bed(cmd, timeout=5, max_bytes=MAX)
    assert result == "chr1\t10\t20\nchr1\t30\t40\n"


def test_empty_output_returns_empty_string():
    cmd = _py_cmd("pass")
    result = run_bigbed_to_bed(cmd, timeout=5, max_bytes=MAX)
    assert result == ""


def test_nonzero_exit_raises_called_process_error():
    cmd = _py_cmd("import sys; sys.exit(1)")
    with pytest.raises(subprocess.CalledProcessError):
        run_bigbed_to_bed(cmd, timeout=5, max_bytes=MAX)


def test_timeout_raises_timeout_expired():
    cmd = _py_cmd("import time; time.sleep(5)")
    with pytest.raises(subprocess.TimeoutExpired):
        run_bigbed_to_bed(cmd, timeout=1, max_bytes=MAX)


def test_missing_binary_raises_file_not_found_error():
    with pytest.raises(FileNotFoundError):
        run_bigbed_to_bed(
            ["definitely-not-a-real-binary-xyz"], timeout=5, max_bytes=MAX
        )


def test_output_over_ceiling_kills_child_and_raises():
    # Endless output: without the ceiling this would never finish.
    cmd = _py_cmd(
        "import sys\nwhile True: sys.stdout.write('chr1\\t10\\t20\\tname\\n')"
    )
    with pytest.raises(RegionOutputTooLarge):
        run_bigbed_to_bed(cmd, timeout=30, max_bytes=10_000)


def test_output_at_ceiling_is_allowed():
    cmd = _py_cmd("import sys; sys.stdout.write('chr1\\t10\\t20\\tname\\n' * 10)")
    result = run_bigbed_to_bed(cmd, timeout=5, max_bytes=len("chr1\t10\t20\n") * 10)
    assert result == "chr1\t10\t20\n" * 10


def test_nonzero_exit_includes_stderr():
    cmd = _py_cmd("import sys; sys.stderr.write('boom'); sys.exit(2)")
    with pytest.raises(subprocess.CalledProcessError) as exc:
        run_bigbed_to_bed(cmd, timeout=5, max_bytes=MAX)
    assert "boom" in exc.value.stderr
