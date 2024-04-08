export const PRIMARY_COLOR = '#008080';
export const SECONDARY_COLOR = '#fdba74';
const API_BASE = import.meta.env.VITE_API_BASE || '';

const EXAMPLE_URL = `${API_BASE}/bed/example`;

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

regionset = bbclient.load_bed("bbad85f21962bb8d972444f7f9a3a932")
print(regionset)
\`\`\`
`;

export const CLIENT_R_CODE_RAW = `
\`\`\`r

# BBClient is not yet available in R
# R package is under development

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
];