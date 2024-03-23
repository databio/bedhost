export const PRIMARY_COLOR = '#008080';
export const SECONDARY_COLOR = '#fdba74';
export const BEDBASE_PYTHON_CODE_MD = `
\`\`\`python
import requests

res = requests.get('http://localhost:8000/api/bed/example')

print(res.json())
\`\`\`
`;
export const BEDBASE_PYTHON_CODE_RAW = `
import requests

res = requests.get('http://localhost:8000/api/bed/example')

print(res.json())
`;

export const BEDBASE_R_CODE_MD = `
\`\`\`r
library(httr)

res <- GET('http://localhost:8000/api/bed/example')

print(content(res, 'text'))
\`\`\`
`;

export const BEDBASE_R_CODE_RAW = `
library(httr)

res <- GET('http://localhost:8000/api/bed/example')

print(content(res, 'text'))
`;

export const BEDBASE_CURL_CODE_MD = `
\`\`\`bash
curl http://localhost:8000/api/bed/example \\
    -H 'Accept: application/json' \\

\`\`\`
`;

export const BEDBASE_CURL_CODE_RAW = `
curl http://localhost:8000/api/bed/example \\
    -H 'Accept: application/json' \\
`;

export const BEDBASE_JAVASCRIPT_CODE_MD = `
\`\`\`javascript
fetch('http://localhost:8000/api/bed/example')
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
