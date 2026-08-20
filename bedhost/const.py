import os

PKG_NAME: str = "bedhost"

TEMPLATES_DIRNAME: str = "templates"
STATIC_DIRNAME: str = "../docs"
STATIC_PATH: str = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), STATIC_DIRNAME
)

EXAMPLE_BED: str = "bbad85f21962bb8d972444f7f9a3a932"
EXAMPLE_BEDSET: str = "gse218680"

# how often to save usage data (in hours)
USAGE_SAVE_HOURS: int = 1
# For how many days record usage data (every month this will be reset)
USAGE_RECORD_DAYS: int = 30


MAX_FILE_SIZE: int = 1024 * 1024 * 20
MAX_REGION_NUMBER: int = 5000000
MIN_REGION_WIDTH: int = 10

# Public CDN base for bulk metadata export artifacts. These live directly on the
# storage CDN (Backblaze B2 fronted by Cloudflare), NOT behind the API's
# /v1/files/ redirect proxy — so export URLs must use this base rather than the
# config's http access-method prefix (which points at api.bedbase.org/v1/files/
# and, notably, 405s on HEAD, breaking DuckDB range probing).
EXPORTS_URL_BASE: str = "https://data2.bedbase.org/"
