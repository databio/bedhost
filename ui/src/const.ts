export const PRIMARY_COLOR = '#008080';
export const SECONDARY_COLOR = '#fdba74';
const API_BASE = import.meta.env.VITE_API_BASE || '';

const EXAMPLE_URL = `${API_BASE}/bed/example`;

export const UMAP_PARQUET_URL =
  'https://huggingface.co/databio/bedbase-umap/resolve/main/hg38_umap_all_3_13.parquet';
// export const UMAP_PARQUET_URL = `${window.location.origin}/hg38_umap_all_3_13.parquet`;

// Legacy JSON URL (kept for backward compatibility)
export const UMAP_URL = 'https://huggingface.co/databio/bedbase-umap/resolve/main/hg38_umap_3_13.json';
// export const UMAP_URL = `${window.location.origin}/feb08_3_13.json`;

export const BEDBASE_PYTHON_CODE_MD = `
\`\`\`python
import requests

res = requests.get(
    '${EXAMPLE_URL}'
)

print(res.json())
\`\`\`
`;
export const BEDBASE_PYTHON_CODE_RAW = `
import requests

res = requests.get(
  '${EXAMPLE_URL}'
)

print(res.json())
`;

export const BEDBASE_R_CODE_MD = `
\`\`\`r
library(httr)

res <- GET('${EXAMPLE_URL}')

print(content(res, 'text'))
\`\`\`
`;

export const BEDBASE_R_CODE_RAW = `
library(httr)

res <- GET('${EXAMPLE_URL}')

print(content(res, 'text'))
`;

export const BEDBASE_CURL_CODE_MD = `
\`\`\`bash
curl ${EXAMPLE_URL} \\
    -H 'Accept: application/json' \\

\`\`\`
`;

export const BEDBASE_CURL_CODE_RAW = `
curl http://localhost:8000/api/bed/example \\
    -H 'Accept: application/json' \\
`;

export const BEDBASE_JAVASCRIPT_CODE_MD = `
\`\`\`javascript
fetch('${EXAMPLE_URL}')
  .then((res) => res.json())
  .then((data) => console.log(data));
\`\`\`
`;

export const BEDBASE_JAVASCRIPT_CODE_RAW = `
fetch('http://localhost:8000/api/bed/example')
  .then((res) => res.json())
  .then((data) => console.log(data));
`;

export const CODE_SNIPPETS = [
  {
    language: 'Python',
    code: BEDBASE_PYTHON_CODE_MD,
    raw: BEDBASE_PYTHON_CODE_RAW,
  },
  {
    language: 'R',
    code: BEDBASE_R_CODE_MD,
    raw: BEDBASE_R_CODE_RAW,
  },
  {
    language: 'Curl',
    code: BEDBASE_CURL_CODE_MD,
    raw: BEDBASE_CURL_CODE_RAW,
  },
  {
    language: 'JavaScript',
    code: BEDBASE_JAVASCRIPT_CODE_MD,
    raw: BEDBASE_JAVASCRIPT_CODE_RAW,
  },
];

export const CLIENT_PYTHON_CODE_MD = `
\`\`\`python
import requests

res = requests.get(
    '${EXAMPLE_URL}'
)

print(res.json())
\`\`\`
`;
export const CLIENT_PYTHON_CODE_RAW = `
\`\`\`python
from geniml.bbclient import BBClient

bbclient = BBClient()

regionset = bbclient.load_bed("02c7821a715f1f890ed2ae53d371072b")
print(regionset)
\`\`\`
`;

export const CLIENT_R_CODE_RAW = `
\`\`\`r
library(bedbaser)

api <- BEDbase()

bed_granges <- bb_to_granges(api, "02c7821a715f1f890ed2ae53d371072b")
print(bed_granges)

\`\`\`
`;

export const CLIENT_RUST_CODE_RAW = `
\`\`\`python
use gtars::bbclient::BBClient;

let mut bbc = BBClient::new(Some(cache_folder.clone()), None).expect("Failed to create BBClient");

let bed_id: String = bbc
            .add_local_bed_to_cache(PathBuf::from(_path/to.bed.gz), None)
            .unwrap();
\`\`\`
`;

export const BBCONF_SNIPPETS = [
  {
    language: 'Python',
    code: CLIENT_PYTHON_CODE_RAW,
    raw: CLIENT_PYTHON_CODE_RAW,
  },
  {
    language: 'R',
    code: CLIENT_R_CODE_RAW,
    raw: CLIENT_R_CODE_RAW,
  },
  {
    language: 'Rust',
    code: CLIENT_RUST_CODE_RAW,
    raw: CLIENT_RUST_CODE_RAW,
  },
];

// The API base ends in /v1; the MCP server is at the API root.
const MCP_API_ROOT = (import.meta.env.VITE_API_BASE || 'https://api.bedbase.org/v1').replace(/\/v1\/?$/, '');
export const MCP_URL = `${MCP_API_ROOT}/mcp`;

// Setup instructions for connecting the BEDbase MCP server to different AI assistants.
export const MCP_CLAUDE_CODE_RAW = `claude mcp add --transport http bedbase ${MCP_URL}`;
export const MCP_CLAUDE_CODE_MD = `
\`\`\`bash
claude mcp add --transport http bedbase ${MCP_URL}
\`\`\`
`;

export const MCP_CLAUDE_DESKTOP_RAW = `{
  "mcpServers": {
    "bedbase": {
      "command": "npx",
      "args": ["mcp-remote", "${MCP_URL}"]
    }
  }
}`;
export const MCP_CLAUDE_DESKTOP_MD = `
\`\`\`json
${MCP_CLAUDE_DESKTOP_RAW}
\`\`\`
`;

export const MCP_CURSOR_RAW = `{
  "mcpServers": {
    "bedbase": {
      "url": "${MCP_URL}"
    }
  }
}`;
export const MCP_CURSOR_MD = `
\`\`\`json
${MCP_CURSOR_RAW}
\`\`\`
`;

export const MCP_CODEX_RAW = `codex mcp add bedbase --url ${MCP_URL}`;
export const MCP_CODEX_MD = `
\`\`\`bash
codex mcp add bedbase --url ${MCP_URL}
\`\`\`
`;

export const AI_SNIPPETS = [
  {
    language: 'Claude Code',
    code: MCP_CLAUDE_CODE_MD,
    raw: MCP_CLAUDE_CODE_RAW,
  },
  {
    language: 'Claude Desktop',
    code: MCP_CLAUDE_DESKTOP_MD,
    raw: MCP_CLAUDE_DESKTOP_RAW,
  },
  {
    language: 'Cursor',
    code: MCP_CURSOR_MD,
    raw: MCP_CURSOR_RAW,
  },
  {
    language: 'Codex',
    code: MCP_CODEX_MD,
    raw: MCP_CODEX_RAW,
  },
];
