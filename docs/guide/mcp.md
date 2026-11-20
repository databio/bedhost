# Use BEDbase with an AI assistant

AI assistants such as Claude, ChatGPT, and Cursor can search BEDbase and read
BED files for you. There are two ways to connect them, and you can use either
or both:

1. **Connect the MCP server.** The assistant gets read-only BEDbase tools and
   can answer questions like "find CTCF ChIP-seq files in K562" directly.
2. **Give it the SKILL.md file.** One page that teaches any assistant that can
   fetch a URL or run `curl` how to use the BEDbase API.

## Option 1: connect the MCP server

BEDbase runs a public, read-only MCP server at:

**`https://api.bedbase.org/mcp`** (Streamable HTTP, no key needed)

**Claude Code:**

```bash
claude mcp add --transport http bedbase https://api.bedbase.org/mcp
```

**Claude Desktop or claude.ai:** open Settings, then Connectors, choose
"Add custom connector", and enter `https://api.bedbase.org/mcp`.

**Cursor and other clients** that take a JSON config:

```json
{
  "mcpServers": {
    "bedbase": { "url": "https://api.bedbase.org/mcp" }
  }
}
```

Then ask things like:

> Find ATAC-seq BED files from human liver on hg38.

> What is in BED file 025632a0aad9b01543f6415c471995bd, and which files are most similar to it?

> Which BEDsets come from ENCODE, and how many files are in each?

> Show me the regions of that file in chr1:1,000,000-1,100,000.

### Tools

Every tool is read-only.

| Tool | What it does |
|---|---|
| `search_bed` | Search BED files by description, BED id, or GEO/ENCODE accession |
| `get_bed` | One BED file: annotation, region count, BEDsets, download links (`view="full"` adds statistics and plots) |
| `get_bed_neighbours` | The BED files most similar to one file, by region content |
| `get_regions` | The regions of one BED file on a chromosome or in a range, as BED text |
| `list_bed` | Browse BED files by genome or BED type, without a query |
| `search_bedset` | Search or list BEDsets (curated collections) |
| `get_bedset` | One BEDset: description, statistics, and members |
| `list_genomes` | Valid genome names for the `genome` filter |
| `list_assays` | Valid assay names for the `assay` filter |
| `get_platform_stats` | Totals of BED files, BEDsets, and genomes |
| `list_exports` | Bulk metadata exports (Parquet) for offline analysis |

Results come in pages. Each page starts with a short summary, and the
assistant passes `next_page_token` back to get more.

## Option 2: give the assistant SKILL.md

**<https://bedbase.org/SKILL.md>** covers searching, reading metadata and
statistics, reading regions, and downloading files with the HTTP API. Tell the
assistant to read it:

> Read https://bedbase.org/SKILL.md, then find CTCF ChIP-seq BED files in K562 on hg38 and download the top one.

This works with any assistant that can fetch a web page or run shell
commands. It is also the better choice when you want the assistant to download
files or write code against the API, since the MCP tools only read.

For a short index of everything BEDbase offers AI agents, see
<https://bedbase.org/llms.txt>.

## Run the MCP server yourself

The MCP server is part of bedhost, in the optional `mcp` extra:

```bash
pip install "bedhost[mcp]"
```

- Running the bedhost API with the extra installed serves MCP at `/mcp`.
- `bedhost-mcp` runs it over stdio instead. Set `BEDBASE_CONFIG` to your
  bbconf config file first:

```bash
claude mcp add bedbase --env BEDBASE_CONFIG=/path/to/bedbase.yaml -- bedhost-mcp
```
