"""Smoke test: prove the ephemeral stack actually boots.

Independent of the full compliance suite; if this passes, the TestClient
lifespan ran, bbconf loaded the ephemeral config, and the database schema
was created. If this fails, diagnose the stack before worrying about the
37 compliance tests.
"""


def test_service_info_live(api_root):
    res = api_root.get("/v1/service-info")
    assert res.status_code == 200
