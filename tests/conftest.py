"""Bedhost test suite configuration and shared fixtures."""

import pytest
import requests

REQ_SERVICE_MARK = "require_service"


def pytest_addoption(parser):
    """Add CLI option to specify the API root."""
    parser.addoption(
        "--api_root", "-R",
        action="store",
        default="http://localhost:8000",
        help="API root URL for compliance tests"
    )


@pytest.fixture(scope="session")
def api_root(pytestconfig):
    """Get the API root from --api_root CLI argument."""
    return pytestconfig.getoption("api_root")


def check_server_is_running(api_root: str) -> bool:
    """Check if a server is responding at the given API root."""
    try:
        print(f"Checking if service is running at {api_root}")
        res = requests.get(f"{api_root}/v1/service-info", timeout=5)
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
        f"{REQ_SERVICE_MARK}: mark test as requiring a running bedhost service"
    )


def pytest_collection_modifyitems(config, items):
    """Skip tests with require_service mark if server is not running."""
    api_root = config.getoption("api_root")
    skip_missing_service = pytest.mark.skip(
        reason=f"Bedhost API not available at {api_root}"
    )

    if not check_server_is_running(api_root):
        print("Skipping tests that require a running server...")
        for item in items:
            if REQ_SERVICE_MARK in item.keywords:
                item.add_marker(skip_missing_service)
