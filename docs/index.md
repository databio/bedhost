# BEDbase API

Welcome to the BEDbase API. You might be looking for:

- [API OpenAPI documentation](/v1/docs)
- [BEDbase API changelog](https://docs.bedbase.org/bedhost/changelog)
- [Developer Guide and FAQ](https://docs.bedbase.org/bedhost)
- [bedbase.org user interface](https://bedbase.org)
- [Sheffield lab of computational biology](https://databio.org)

## Bulk metadata export

If you want metadata for every BED file or BEDset, do not crawl the list
endpoints. Download the monthly Parquet snapshot instead. It is one request,
it is served from a CDN, and it does not touch the database.

- `/v1/exports` lists the published snapshots, newest first. Each entry has
  a `file_path` (an HTTPS URL), `file_type`, `record_count`, `file_size`,
  `checksum`, and `creation_date`.
- `/v1/objects/exports` lists the same files as GA4GH DRS objects, and
  `/v1/objects/exports/{filename}` resolves one of them.
- [bedbase.org/downloads](https://bedbase.org/downloads) shows the same
  index in the web interface.

Each snapshot is three Parquet files plus a JSON manifest, all dated the same
day:

- `bedbase_metadata_<date>.parquet`: one row per BED file, with its
  classification, stats, and annotations. This is what `/v1/bed/list` and
  `/v1/bed/{id}/metadata` serve.
- `bedbase_bedsets_<date>.parquet`: one row per BEDset.
- `bedbase_bedset_membership_<date>.parquet`: one row per (bedset, bed) pair.
- `manifest_<date>.json`: the file names, row counts, sizes, and sha256 sums.

Pick the newest `metadata` entry and read it directly with pandas:

    import pandas as pd
    import requests

    exports = requests.get("https://api.bedbase.org/v1/exports").json()["results"]
    url = next(e["file_path"] for e in exports if e["file_type"] == "metadata")
    df = pd.read_parquet(url)

Resolve the file through `/v1/exports` rather than hardcoding a name. Files
are dated and immutable, so a new one appears each month.

## Paging

`/v1/bed/list` returns records ordered by id. Two ways to page:

- `offset`: the usual `limit` and `offset` pair. It is capped at
  `offset=10000` because Postgres has to read and throw away `offset` rows on
  every page, so deep pages get slow. Requests above the cap return a 422.
- `after`: keyset paging. Pass the last id of the previous page as
  `after=<id>` and you get the next `limit` records with a greater id. Each
  page costs the same no matter how far in you are. When `after` is set,
  `offset` is ignored.

The `count` field (the total number of matching records) is only filled in on
the first page (`offset=0` and no `after`). On every other page it is `null`.

To walk every BED file for one genome:

    import requests

    base = "https://api.bedbase.org/v1/bed/list"
    after = None
    while True:
        params = {"genome": "hg38", "limit": 1000}
        if after:
            params["after"] = after
        page = requests.get(base, params=params).json()
        if not page["results"]:
            break
        for record in page["results"]:
            ...  # do something with each record
        after = page["results"][-1]["id"]

If you find yourself doing this for the whole database, use the
[bulk export](#bulk-metadata-export) above instead.

`/v1/bedset/list` is also ordered by id, and pages with `limit` (max 10000)
and `offset`.
