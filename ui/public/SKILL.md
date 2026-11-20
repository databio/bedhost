---
name: bedbase-api
description: >-
  Search and download genomic region datasets (BED files) from BEDbase over
  its HTTP API: find BED files by free text ("CTCF ChIP-seq in K562"), by
  GEO/ENCODE accession, or by a BED file you upload; read a file's metadata,
  statistics, and regions; find similar files; browse curated collections
  (BEDsets); and download BED or bigBed files. Use whenever you need public
  genomic region data, or have a bedbase.org link. Needs nothing installed.
homepage: https://bedbase.org
---

# BEDbase HTTP API

BEDbase is a catalog of genomic region datasets. Each **BED file** has a
32-character id (a digest of its contents), metadata (genome, assay, cell
line, target, and more), summary statistics, and downloadable `.bed.gz` and
`.bigBed` files. A **BEDset** is a named collection of BED files, with a short
slug id such as `encode_batch_1`.

Everything below is a plain HTTP request. The API base is:

```bash
API=https://api.bedbase.org/v1
```

A web page `https://bedbase.org/bed/{id}` has its data at
`$API/bed/{id}/metadata?full=true`, and `https://bedbase.org/bedset/{id}` at
`$API/bedset/{id}/metadata`.

An MCP server with the same read-only abilities is at
`https://api.bedbase.org/mcp` (Streamable HTTP). If your client supports MCP,
connecting it is easier than calling the API by hand.

---

## Step 1: find BED files

### By text

```bash
curl -s "$API/bed/search/text?query=CTCF%20ChIP-seq%20K562&genome=hg38&limit=5"
```

- `query`: free text. Also accepts an exact BED id, or a GEO/ENCODE accession
  (for example `GSE105587`), which return exact matches.
- `genome` (optional): a genome alias such as `hg38`, `hg19`, `mm10`. See
  `$API/genomes` for valid values.
- `assay` (optional): such as `ATAC-seq` or `TF ChIP-seq`. See `$API/assays`.
- `limit` and `offset` page the results.

The response is `{"count", "limit", "offset", "results": [...]}`. Each result
has `id`, `score`, and `metadata` (name, description, genome, and an
`annotation` block with assay, cell line, tissue, target, treatment, and
species). Search is semantic, so check `metadata` to confirm each hit fits.

### By a BED file you have

```bash
curl -s -X POST "$API/bed/search/bed?limit=5" -F "file=@my_regions.bed"
```

Returns BED files whose regions are most similar to yours, in the same
`count`/`results` shape as text search.

### Files similar to one you already found

```bash
curl -s "$API/bed/{id}/neighbours?limit=5"
```

### Browse

```bash
curl -s "$API/bed/list?genome=hg38&limit=20"
```

Pages through every BED file. For the next page, pass the last `id` of this
page as `after` (`offset` works too, but only up to 10000). For the whole
catalog, download a bulk export instead (see `$API/exports` below).

## Step 2: read a BED file

| What | Request |
|---|---|
| All metadata, stats, and file links | `GET $API/bed/{id}/metadata?full=true` |
| Basic metadata only | `GET $API/bed/{id}/metadata` |
| Summary statistics (region count, mean width, GC content, share in promoters, exons, introns, intergenic) | `GET $API/bed/{id}/metadata/stats` |
| Download links | `GET $API/bed/{id}/metadata/files` |
| Format and compliance (for example `bed6+4`, `encode_narrowpeak`) | `GET $API/bed/{id}/metadata/classification` |
| Metadata for up to 1000 files at once | `POST $API/bed/batch` with body `{"ids": [...]}` |

## Step 3: get the regions

### Regions in one window (plain text, no download needed)

```bash
curl -s "$API/bed/{id}/regions/chr1?start=1000000&end=1100000"
```

Returns tab-separated `chrom start end ...` lines. Only files with a bigBed
file support this. A window with too many regions is refused; narrow it, or
download the whole file.

### The whole file

`$API/bed/{id}/metadata/files` lists each file with `size` and
`access_methods`. Use the `http` access URL:

```bash
curl -sLO "https://api.bedbase.org/v1/files/files/0/2/025632a0aad9b01543f6415c471995bd.bed.gz"
```

The URL redirects to the storage host, so keep `-L`.

`bed_file` is the gzipped BED file; `bigbed_file` is the indexed bigBed. The
same files are also on S3 (the `s3` access method).

## BEDsets (collections)

| What | Request |
|---|---|
| Search or list BEDsets | `GET $API/bedset/list?query=encode&limit=10` |
| One BEDset's metadata | `GET $API/bedset/{bedset_id}/metadata` |
| The BED files in it | `GET $API/bedset/{bedset_id}/bedfiles` |
| Statistics across its files | `GET $API/bedset/{bedset_id}/metadata/stats` |

## Whole-catalog information

| What | Request |
|---|---|
| Counts of BED files, BEDsets, and genomes | `GET $API/stats` |
| Valid genome names | `GET $API/genomes` |
| Valid assay names | `GET $API/assays` |
| Bulk metadata exports (Parquet) for offline analysis | `GET $API/exports` |
| Every endpoint | `GET $API/openapi.json` (or browse `$API/docs`) |

## Tips

- Pass ids exactly as returned. A BED id is 32 lowercase hex characters.
- To work with many files in code, the clients download and cache them for
  you: `geniml` (Python), `gtars` (Rust), and `bedbaser` (R).
- Link people to `https://bedbase.org/bed/{id}` so they can see the file's
  page, plots, and genome browser view.
- The API is read-only and needs no key.
