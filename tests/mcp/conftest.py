"""Fixtures for the MCP tool tests.

These tests check the behaviors a chatbot relies on (unknown args refused,
query-bound paging tokens, coded errors with hints, trimmed records, graceful
degradation without ML) using the in-memory agent from tests/fakes.py, so they
need no Postgres/Qdrant and run in CI with only the `mcp` extra installed.
"""

import pytest

from tests.fakes import FakeAgent


@pytest.fixture(autouse=True)
def _reset_backend():
    """Clear the injected backend and cache around every test."""
    from bedhost.mcp import tools

    yield
    tools._backend = None
    tools._serves_downloads = False
    if tools._cache is not None:
        tools._cache.clear()


@pytest.fixture
def backend_ml():
    from bedhost.mcp import tools

    agent = FakeAgent(ml=True)
    tools.set_backend(agent)
    return agent


@pytest.fixture
def backend_no_ml():
    from bedhost.mcp import tools

    agent = FakeAgent(ml=False)
    tools.set_backend(agent)
    return agent
