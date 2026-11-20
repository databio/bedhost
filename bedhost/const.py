import os

PKG_NAME: str = "bedhost"

# Environment variables checked (in order) for the path to the bedhost config file.
CFG_ENV_VARS: list[str] = ["BEDBASE_CONFIG"]

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
# Decompressed size cap for gzip uploads, so a small gzip cannot expand without bound.
MAX_UNCOMPRESSED_SIZE: int = 1024 * 1024 * 200
MAX_REGION_NUMBER: int = 5000000
MIN_REGION_WIDTH: int = 10
# Chunk size used when copying an uploaded file to disk.
UPLOAD_CHUNK_SIZE: int = 1024 * 1024
# Slack for multipart boundaries and headers in the Content-Length pre-check.
MULTIPART_OVERHEAD: int = 64 * 1024
# Routes that accept BED file uploads (guarded by upload_size_guard).
UPLOAD_ROUTES: frozenset[str] = frozenset(
    {"/v1/bed/embed", "/v1/bed/umap", "/v1/bed/search/bed"}
)

# Upper bounds for request inputs (security review finding O1).
MAX_LIST_LIMIT: int = 10000  # paged list endpoints
MAX_SEARCH_LIMIT: int = 100  # search + neighbour endpoints (UI max is 100)
# hg38 with alts/decoys/unplaced is under 3,500 contigs (hs38DH ~3,366);
# mm10/mm39 are under 100. The UI only sends chromosomes that actually
# appear in the uploaded BED file, so 10,000 is a generous ceiling that
# still bounds the work.
MAX_CHROM_ENTRIES: int = 10000  # /analyze-genome dict size
MAX_CHROM_NAME_LENGTH: int = 256  # /analyze-genome dict key length
BIGBED_TIMEOUT_SECONDS: int = 60  # /regions bigBedToBed wall-clock cap
MAX_REGIONS_OUTPUT_BYTES: int = 1024 * 1024 * 20  # /regions response size cap

# Public CDN base for bulk metadata export artifacts. These live directly on the
# storage CDN (Backblaze B2 fronted by Cloudflare), NOT behind the API's
# /v1/files/ redirect proxy — so export URLs must use this base rather than the
# config's http access-method prefix (which points at api.bedbase.org/v1/files/
# and, notably, 405s on HEAD, breaking DuckDB range probing).
EXPORTS_URL_BASE: str = "https://data2.bedbase.org/"
