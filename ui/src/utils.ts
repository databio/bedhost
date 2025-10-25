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