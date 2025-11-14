import * as pako from 'pako';

type ObjectType = 'bed' | 'bedset';

export const makeHttpDownloadLink = (md5: string) => {
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  return `${API_BASE}/objects/bed.${md5}.bed_file/access/http`;
};

export const makeS3DownloadLink = (md5: string) => {
  const API_BASE = import.meta.env.VITE_BEDHOST_API_URL || '';
  return `${API_BASE}/objects/bed.${md5}.bed_file/access/s3`;
};

export const formatNumberWithCommas = (n: number) => {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const roundToTwoDecimals = (n: number) => {
  return Math.round(n * 100) / 100;
};

export const makeThumbnailImageLink = (md5: string, plotName: string, type: ObjectType) => {
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  return `${API_BASE}/objects/${type}.${md5}.${plotName}/access/http/thumbnail`;
};

export const makePDFImageLink = (md5: string, plotName: string, type: ObjectType) => {
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  return `${API_BASE}/objects/${type}.${md5}.${plotName}/access/http/bytes`;
};

export const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString();
};

export const bytesToSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))));
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
};

export const generateBEDsetPEPMd = (md5List: string[]) => {
  const script = `
  \`\`\`text
  sample_name\n${md5List.join('\n')}
  \`\`\`
  `;
  return script;
};

export const generateBEDsetPEPDownloadRaw = (md5List: string[]) => {
  const script = `sample_name\n${md5List.join('\n')}`;
  return script;
};


export const generateCurlScriptForCartDownloadMd = (md5List: string[]) => {
  const wgetCommands = md5List.map((md5, index) => {
    const downloadLink = makeHttpDownloadLink(md5);
    return `wget -O \\
      "file${index + 1}.bed" \\
      "${downloadLink}"`;
  });

  const script = `
  \`\`\`sh
  #!/bin/bash\n\n${wgetCommands.join('\n')}\n\ntar -czf beds.tar.gz *.bed
  \`\`\`
  `;

  return script;
};

export const generateCurlScriptForCartDownloadRaw = (md5List: string[]) => {
  const wgetCommands = md5List.map((md5, index) => {
    const downloadLink = makeHttpDownloadLink(md5);
    return `wget -O \\
      "file${index + 1}.bed" \\
      "${downloadLink}"`;
  });

  const script = `#!/bin/bash\n\n${wgetCommands.join('\n')}\n\ntar -czf beds.tar.gz *.bed`;

  return script;
};

export const generateDownloadBedSetScriptMd = (id: string) => {
  const script = `
  \`\`\`python
  import geniml.bbclient
  
  bbclient.load_bedset('${id}')
  \`\`\`
  `;
  return script;
};

export const generateDownloadBedSetScriptRaw = (id: string) => {
  return `
  from geniml.bbclient import bbclient
  
  bbclient.load_bedset('${id}')
    `;
};

export const chunkArray = <T>(arr: T[], chunkSize: number) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

export const snakeToTitleCase = (str: string) => {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const convertStatusCodeToMessage = (statusCode: number | undefined) => {
  if (statusCode === undefined) {
    return 'Unknown Error';
  }
  switch (statusCode) {
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 500:
      return 'Internal Server Error';
    default:
      return 'Unknown Error';
  }
};

export const tableau20 = [
    '#1f77b4',
    '#aec7e8',
    '#ff7f0e',
    '#ffbb78',
    '#2ca02c',
    '#98df8a',
    '#d62728',
    '#ff9896',
    '#9467bd',
    '#c5b0d5',
    '#8c564b',
    '#c49c94',
    '#e377c2',
    '#f7b6d3',
    '#7f7f7f',
    '#c7c7c7',
    '#bcbd22',
    '#dbdb8d',
    '#17becf',
    '#9edae5',
  ];

// Point-in-polygon test using ray casting algorithm
export const isPointInPolygon = (point: {x: number, y: number}, polygon: {x: number, y: number}[]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};
// gtars bedfile handler
export type BedEntry = [string, number, number, string];

export async function parseBedFile(file: File): Promise<BedEntry[]> {
  let text: string;
  if (file.name.endsWith('.gz')) {
    const arrayBuffer = await file.arrayBuffer();
    const decompressed = pako.ungzip(new Uint8Array(arrayBuffer), { to: 'string' });
    text = decompressed;
  } else {
    text = await file.text();
  }
  const lines = text.split('\n');
  const bedEntries: BedEntry[] = [];

// export async function parseBedFile(file: File): Promise<BedEntry[]> {
//   const text = await file.text();
//   const lines = text.split('\n');
//   const bedEntries: BedEntry[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // skip!
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const columns = trimmedLine.split('\t');

    // check for at least 3 columns (chr, start, end)
    if (columns.length >= 3) {
      const chr = columns[0];
      const start = parseInt(columns[1], 10);
      const end = parseInt(columns[2], 10);
      const rest = columns.slice(3).join('\t'); // join remaining columns if any

      // Validate that start and end are valid numbers
      if (!isNaN(start) && !isNaN(end)) {
        bedEntries.push([chr, start, end, rest]);
      }
    }
  }

  return bedEntries;
}

// helper function to handle file input change event
export function handleBedFileInput(
  event: Event,
  callback: (entries: BedEntry[]) => void
): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (file) {
    parseBedFile(file)
      .then(callback)
      .catch((error) => console.error('Error parsing BED file:', error));
  }
}
