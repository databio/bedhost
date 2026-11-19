# Changelog

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

## [0.16.0] - Unreleased

### Added
- MCP server, so chatbots and agents can use BEDbase: 11 read-only tools to search and read BED files and BEDsets, list genomes, assays, and exports, and read regions. It is served at `/mcp` (Streamable HTTP) when the `mcp` extra is installed, and over stdio by the `bedhost-mcp` command (set `BEDBASE_CONFIG`).

### Changed
- `/v1/bed/search/text` answers exact BED ids and GEO/ENCODE accessions even when ML models are off. Only free-text queries return 503 then.
- `/v1/bed/search/text` with an exact BED id: the first page is the file followed by `limit - 1` similar files (before: `limit + 1` rows), and later pages continue the similar files (before: only the file again).
- `/v1/bed/search/text` with an accession honors `limit` and `offset` (before: every matching file at once).

## [0.15.0] - 2026-10-26

### Changed
- The Docker image preloads jemalloc as the memory allocator. In a replay of 240k production requests it kept memory flat (270 MB lower than glibc malloc at the end) with the same latency and errors.

## [0.14.0] - 2026-10-16

### Added
- `GET /v1/usage`: public per-key usage counts (bed/bedset views, file downloads, searches) for an optional date range, with paging.
- `GET /v1/ready` readiness probe, and `HEAD` on every `GET` route.
- `after=<last id>` keyset paging on `/v1/bed/list`.
- `BEDHOST_LOG_LEVEL` (default `INFO`) sets the log level; `BEDHOST_DISABLE_USAGE_SCHEDULER` turns off the background usage flush.
- The Docker image includes UCSC `bigBedToBed`, so `/v1/bed/{id}/regions/{chr}` works.

### Changed
- **Breaking:** the container runs as non-root user `10001` and serves on port 8000.
- **Breaking:** input limits. `/v1/bed/list` `offset` is capped at 10000 and `count` is `null` after the first page; list `limit` is capped; search and neighbour `limit` is capped at 100; offsets must be `>= 0`; `/regions` `start`/`end` are integers with `end > start`.
- **Breaking:** uploads must send `Content-Length` (411 otherwise). Files over the size limit return 413, including gzip files that decompress past 200 MB; corrupt gzip returns 415; too many regions returns 413.
- Upload and ML routes return 503 when ML models are off.
- `/regions` output is streamed with a 20 MB cap (413) and a timeout (504).
- Deploys build the base image from the checkout and run a container smoke test before pushing.
- Requires bbconf 0.16.0.

### Security
- Uploads are saved safely with size caps checked while streaming.
- bbconf and geniml no longer log at DEBUG level in production.
