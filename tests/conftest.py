"""Bedhost test suite configuration and shared fixtures.

The ``api_root`` fixture dispatches between two modes:

* Black-box mode (default): returns a ``RequestsClient`` pointing at whatever
  URL was passed via ``--api_root`` (``http://localhost:8000`` by default).
  Use for compliance testing live deployments.
* Integration mode (``RUN_INTEGRATION_TESTS=true``): delegates to
  ``tests/integration/conftest.py``'s ``integration_api_root`` fixture, which
  wraps an in-process FastAPI ``TestClient`` backed by ephemeral services.

All 37 compliance tests in ``tests/api/test_compliance.py`` run unchanged in
both modes because both client implementations expose the same
``.get(path, **kw)`` / ``.post(path, **kw)`` call surface.
"""

import os

import pytest

REQ_SERVICE_MARK = "require_service"


def pytest_addoption(parser):
    """Add CLI option to specify the API root."""
    parser.addoption(
        "--api_root",
        "-R",
        action="store",
        default="http://localhost:8000",
        help="API root URL for compliance tests (ignored in integration mode)",
    )


@pytest.fixture(scope="session")
def api_root(pytestconfig, request):
    """HTTP client pointed at a bedhost API.

    Returns a client object (not a bare URL). Use ``api_root.get("/v1/...")``
    in tests; never ``f"{api_root}/v1/..."``.
    """
    from tests.client import RequestsClient

    if os.getenv("RUN_INTEGRATION_TESTS") == "true":
        # Integration mode: delegate to tests/integration/conftest.py
        return request.getfixturevalue("integration_api_root")
    return RequestsClient(pytestconfig.getoption("api_root"))


def check_server_is_running(api_root_url: str) -> bool:
    """Check if a bedhost server is responding at the given URL."""
    import requests

    try:
        print(f"Checking if service is running at {api_root_url}")
        res = requests.get(f"{api_root_url}/v1/service-info", timeout=5)
        if res.status_code == 200:
            print("Server is running.")
            return True
        print(f"Server returned status {res.status_code}")
        return False
    except Exception as e:
        print(f"Server is not running: {e}")
        return False


def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line(
        "markers",
        f"{REQ_SERVICE_MARK}: mark test as requiring a running bedhost service",
    )


def pytest_collection_modifyitems(config, items):
    """Skip ``require_service`` tests when no backend is reachable.

    In integration mode (``RUN_INTEGRATION_TESTS=true``), the in-process
    TestClient is always live, so no skip is needed.
    """
    if os.getenv("RUN_INTEGRATION_TESTS") == "true":
        return

    api_root_url = config.getoption("api_root")
    if check_server_is_running(api_root_url):
        return

    print("Skipping tests that require a running server...")
    skip_missing_service = pytest.mark.skip(
        reason=f"Bedhost API not available at {api_root_url}"
    )
    for item in items:
        if REQ_SERVICE_MARK in item.keywords:
            item.add_marker(skip_missing_service)
