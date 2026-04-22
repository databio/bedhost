"""Integration test fixtures for bedhost.

Uses FastAPI's ``TestClient`` with ephemeral PostgreSQL + Qdrant services.
All services are started/stopped by ``./tests/scripts/test-integration.sh``.

Prerequisites:
    ./tests/scripts/test-integration.sh

Or manually:
    1. Start services: ./tests/scripts/services.sh start
    2. Run tests:      RUN_INTEGRATION_TESTS=true pytest tests/integration/
    3. Stop services:  ./tests/scripts/services.sh stop
"""

import os
import signal as _signal_mod
import threading as _threading_mod
from pathlib import Path

import pytest

# yacman (pulled in transitively by bbconf/bedhost) registers SIGINT/SIGTERM
# handlers in YacAttMap.__enter__, which raises ``ValueError: signal only
# works in main thread of the main interpreter`` under FastAPI TestClient
# (lifespan runs on an AnyIO worker thread). Swallow those so bbconf can
# finish loading its config. Tests don't need graceful signal handling.
_real_signal = _signal_mod.signal


def _signal_main_thread_only(signum, handler):
    try:
        return _real_signal(signum, handler)
    except ValueError:
        return handler


_signal_mod.signal = _signal_main_thread_only


def pytest_collection_modifyitems(config, items):
    """Skip every test collected under ``tests/integration/`` unless
    ``RUN_INTEGRATION_TESTS=true``.

    ``pytestmark = pytest.mark.skipif(...)`` only applies to the module it
    is declared in; in a conftest it does NOT propagate to sibling test
    modules. This hook is the reliable way to gate an entire directory.
    """
    if os.getenv("RUN_INTEGRATION_TESTS") == "true":
        return
    skip_marker = pytest.mark.skip(
        reason="Integration tests disabled. Run ./tests/scripts/test-integration.sh"
    )
    integration_dir = Path(__file__).parent.resolve()
    for item in items:
        try:
            item_path = Path(str(item.fspath)).resolve()
        except Exception:
            continue
        try:
            item_path.relative_to(integration_dir)
        except ValueError:
            continue
        item.add_marker(skip_marker)


TEMPLATE_PATH = (
    Path(__file__).parent.parent / "fixtures" / "bedbase_test_config.template.yaml"
)


@pytest.fixture(scope="session")
def bedbase_config_path(tmp_path_factory):
    """Render the bedbase config template with ephemeral service ports."""
    db_port = os.environ["BEDHOST_TEST_DB_PORT"]
    qdrant_port = os.environ["BEDHOST_TEST_QDRANT_PORT"]

    template = TEMPLATE_PATH.read_text()
    rendered = template.replace("{DB_PORT}", str(db_port)).replace(
        "{QDRANT_PORT}", str(qdrant_port)
    )

    config_dir = tmp_path_factory.mktemp("bedbase_config")
    config_path = config_dir / "bedbase_test_config.yaml"
    config_path.write_text(rendered)
    return config_path


@pytest.fixture(scope="session")
def bedhost_app(bedbase_config_path):
    """Import bedhost.main.app with BEDBASE_CONFIG pointing at the ephemeral stack.

    Env vars MUST be set before import; clearing them on the way out keeps
    the session pristine for any other fixtures that might follow.
    """
    prior_config = os.environ.get("BEDBASE_CONFIG")
    prior_init_ml = os.environ.get("BEDHOST_INIT_ML")

    os.environ["BEDBASE_CONFIG"] = str(bedbase_config_path)
    os.environ.setdefault("BEDHOST_INIT_ML", "false")

    try:
        from bedhost.main import app  # noqa: WPS433 (deliberate late import)

        yield app
    finally:
        if prior_config is None:
            os.environ.pop("BEDBASE_CONFIG", None)
        else:
            os.environ["BEDBASE_CONFIG"] = prior_config
        if prior_init_ml is None:
            os.environ.pop("BEDHOST_INIT_ML", None)
        else:
            os.environ["BEDHOST_INIT_ML"] = prior_init_ml


@pytest.fixture(scope="session")
def test_client(bedhost_app):
    """Session-scoped TestClient. Entering the context runs FastAPI lifespan,
    which constructs ``BedBaseAgent`` and triggers bbconf's
    ``Base.metadata.create_all`` against the ephemeral Postgres.
    """
    from fastapi.testclient import TestClient

    with TestClient(bedhost_app) as c:
        yield c


@pytest.fixture(scope="session")
def integration_api_root(test_client):
    """The integration-mode ``api_root`` fixture value.

    Named distinctly from ``api_root`` to avoid a fixture name collision
    with the top-level ``tests/conftest.py``; the top-level fixture
    delegates via ``request.getfixturevalue`` when integration mode is on.
    """
    from tests.client import TestClientAdapter

    return TestClientAdapter(test_client)
