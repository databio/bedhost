"""API test fixtures and constants."""

import pytest

# Known test data - these should exist on any populated bedhost instance
# Update these if testing against a specific instance with different data
KNOWN_BED_ID = None  # Will be discovered dynamically via /v1/bed/example
KNOWN_BEDSET_ID = None  # Will be discovered dynamically via /v1/bedset/example


@pytest.fixture(scope="session")
def example_bed_id(api_root):
    """Get an example BED ID from the server."""
    import requests
    try:
        res = requests.get(f"{api_root}/v1/bed/example", timeout=10)
        if res.status_code == 200:
            return res.json().get("id")
    except Exception:
        pass
    return None


@pytest.fixture(scope="session")
def example_bedset_id(api_root):
    """Get an example BEDSET ID from the server."""
    import requests
    try:
        res = requests.get(f"{api_root}/v1/bedset/example", timeout=10)
        if res.status_code == 200:
            return res.json().get("id")
    except Exception:
        pass
    return None
