"""HTTP client adapters for bedhost compliance tests.

Two implementations share the same call surface so a single test body
can run either against a live HTTP server (``RequestsClient``) or
in-process via FastAPI's ``TestClient`` (``TestClientAdapter``).

Both ``.get`` / ``.post`` return a response object exposing
``.status_code``, ``.json()``, ``.text``, and ``.headers`` -- the subset
used by the compliance suite.
"""


class RequestsClient:
    """Thin wrapper around the ``requests`` library for black-box testing."""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    def get(self, path, **kw):
        import requests

        return requests.get(f"{self.base_url}{path}", **kw)

    def post(self, path, **kw):
        import requests

        return requests.post(f"{self.base_url}{path}", **kw)


class TestClientAdapter:
    """Wrap a ``fastapi.testclient.TestClient`` with the requests-like API.

    FastAPI's TestClient uses ``follow_redirects`` while ``requests`` uses
    ``allow_redirects``; this adapter translates so tests stay portable.
    """

    def __init__(self, client):
        self._client = client

    @staticmethod
    def _translate_kwargs(kw):
        if "allow_redirects" in kw:
            kw["follow_redirects"] = kw.pop("allow_redirects")
        return kw

    def get(self, path, **kw):
        return self._client.get(path, **self._translate_kwargs(kw))

    def post(self, path, **kw):
        return self._client.post(path, **self._translate_kwargs(kw))
