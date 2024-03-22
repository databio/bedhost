export const makeHttpDownloadLink = (md5: string) => {
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  return `${API_BASE}/objects/bed.${md5}.bedfile/access/http`;
};

export const makeS3DownloadLink = (md5: string) => {
  const API_BASE = import.meta.env.VITE_BEDHOST_API_URL || '';
  return `${API_BASE}/objects/bed.${md5}.bedfile/access/s3`;
};

export const formatNumberWithCommas = (n: number) => {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const roundToTwoDecimals = (n: number) => {
  return Math.round(n * 100) / 100;
};

export const makeThumbnailImageLink = (md5: string, plotName: string) => {
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  return `${API_BASE}/objects/bed.${md5}.${plotName}/access/http/thumbnail`;
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
