"""API test fixtures and constants."""

import pytest


@pytest.fixture(scope="session")
def example_bed_id(api_root):
    """Get an example BED ID from the server."""
    try:
        res = api_root.get("/v1/bed/example", timeout=10)
        if res.status_code == 200:
            return res.json().get("id")
    except Exception:
        pass
    return None


@pytest.fixture(scope="session")
def example_bedset_id(api_root):
    """Get an example BEDSET ID from the server."""
    try:
        res = api_root.get("/v1/bedset/example", timeout=10)
        if res.status_code == 200:
            return res.json().get("id")
    except Exception:
        pass
    return None
