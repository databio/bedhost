"""Route handlers must not block the event loop.

FastAPI runs an ``async def`` handler on the event loop itself, so a handler
that calls blocking code (bbconf's SQLAlchemy sessions) stalls every other
request on the process, health checks included. A plain ``def`` handler runs in
the threadpool instead. These tests keep it that way.
"""

import ast
import asyncio
import threading
import time
from pathlib import Path

import httpx
import pytest
from bbconf.models.bedset_models import BedSetDistributions
from fastapi import FastAPI

from bedhost.dependencies import get_bbagent
from bedhost.routers import bed_api
from tests.fakes import FakeAgent

PKG = Path(__file__).parent.parent / "bedhost"
ROUTE_FILES = sorted((PKG / "routers").glob("*.py")) + [PKG / "main.py"]
METHODS = {"get", "post", "put", "delete", "patch", "head", "api_route"}


def _is_route(decorator: ast.expr) -> bool:
    return (
        isinstance(decorator, ast.Call)
        and isinstance(decorator.func, ast.Attribute)
        and isinstance(decorator.func.value, ast.Name)
        and decorator.func.value.id in ("router", "app")
        and decorator.func.attr in METHODS
    )


def _async_handlers_without_await():
    for path in ROUTE_FILES:
        for node in ast.walk(ast.parse(path.read_text())):
            if not isinstance(node, ast.AsyncFunctionDef):
                continue
            if not any(_is_route(d) for d in node.decorator_list):
                continue
            if not any(
                isinstance(n, (ast.Await, ast.AsyncFor, ast.AsyncWith))
                for n in ast.walk(node)
            ):
                yield f"{path.name}:{node.lineno} {node.name}"


def test_async_route_handlers_actually_await():
    bad = list(_async_handlers_without_await())
    assert not bad, (
        "These async route handlers never await, so their sync calls block the "
        f"event loop. Make them plain `def`: {bad}"
    )


@pytest.fixture
def slow_agent():
    agent = FakeAgent()
    started = threading.Event()

    def aggregate_distributions(ids):
        started.set()
        time.sleep(1)
        return BedSetDistributions(n_files=0)

    agent.bed.aggregate_distributions = aggregate_distributions
    return agent, started


def test_slow_request_does_not_block_others(slow_agent):
    agent, started = slow_agent
    app = FastAPI()
    app.include_router(bed_api.router)
    app.dependency_overrides[get_bbagent] = lambda: agent

    async def run():
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(
            transport=transport, base_url="http://test"
        ) as client:
            t0 = time.monotonic()
            slow = asyncio.create_task(
                client.post("/v1/bed/collection/stats", json={"ids": ["x"]})
            )
            while not started.is_set():
                await asyncio.sleep(0.01)
            cheap = await client.get("/v1/bed/example")
            cheap_elapsed = time.monotonic() - t0
            return cheap, cheap_elapsed, await slow

    cheap, cheap_elapsed, slow = asyncio.run(run())
    assert cheap.status_code == 200
    assert slow.status_code == 200
    assert cheap_elapsed < 0.5, f"cheap request waited {cheap_elapsed:.2f}s"
