from fastapi.testclient import TestClient
import os
import pytest

# os.environ.setdefault("BEDBASE_CONFIG", os.path.abspath("test_config.yaml"))
# from bedhost.main import app
#
#
# client = TestClient(app)


@pytest.mark.skipif(True, reason="Database is not available")
def test_read_main():
    response = client.get("/v1/docs/changelog")
    assert response.status_code == 200
    assert response.json() == {"msg": "Hello World"}
