<h1 align="center">bedhost</h1>

[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Github badge](https://img.shields.io/badge/source-github-354a75?logo=github)](https://github.com/databio/bedhost)


`bedhost` is a Python FastAPI module for the API that powers BEDbase.
It needs a path to the *bedbase configuration file*, which can be provided either via `-c`/`--config` argument or read from `$BEDBASE_CONFIG` environment variable. 

---

## Links of interest

- **Deployed public instance**: <a href="https://bedbase.org/" target="_blank">https://bedbase.org/</a>
- **Documentation**: <a href="https://docs.bedbase.org/" target="_blank">https://docs.bedbase.org/bedhost</a>
- **API**: <a href="https://api.bedbase.org/" target="_blank">https://api.bedbase.org/</a>
- **DEV API**: <a href="https://dev.bedbase.org/" target="_blank">https://api-dev.bedbase.org/</a>
- **UI**: <a href="https://bedbase.org/" target="_blank">https://bedbase.org/</a>
- **DEV UI**: <a href="https://dev.bedbase.org/" target="_blank">https://dev.bedbase.org/</a>
- **Source Code**: <a href="https://github.com/databio/bedhost/" target="_blank">https://github.com/databio/bedhost/</a>

## Developer quick-start

```
source environment/production.env
BEDBASE_CONFIG=deployment/config/api.bedbase.org.yaml uvicorn bedhost.main:app --reload
```

## Embeddings

Search, `/v1/bed/embed`, and `/v1/bed/umap` need embedding models. By default
bbconf loads them in-process, which needs `uv pip install -e ".[local]" --torch-backend cpu`.
The production configs instead set bbconf's `embedding_server:` block (see the
bbconf README), so the Docker image has no torch, fastembed, or
sentence-transformers. The servers come from these environment variables, which
production reads from AWS SSM:

| Variable | Config key |
|---|---|
| `EMBEDDING_DENSE_URL` | `embedding_server.text_url` |
| `EMBEDDING_SPARSE_URL` | `embedding_server.sparse_url` |
| `EMBEDDING_REGION_URL` | `embedding_server.region_url` |
| `EMBEDDING_API_KEY` | `embedding_server.api_key` |

If a server is down, bedhost still starts and the routes that need it return 503.

UI development:
```terminal
export VITE_API_HOST=http://localhost:8000
```

## Testing

Black-box compliance tests (against any deployment):

```
pytest tests/api/ --api_root=https://api.bedbase.org
```

Integration tests (ephemeral Postgres + Qdrant + in-process TestClient, ~30s):

```
./tests/scripts/test-integration.sh
```

Manual service control:

```
./tests/scripts/services.sh start
RUN_INTEGRATION_TESTS=true pytest tests/integration/ tests/api/
./tests/scripts/services.sh stop
```

Integration tests require network access on first boot (bbconf downloads a
licenses CSV from GitHub and may pull HuggingFace models unless
`BEDHOST_INIT_ML=false` is set; `test-integration.sh` sets it).
`BEDHOST_LOG_LEVEL` (default `INFO`) sets the log level for bedhost, bbconf, and geniml.
