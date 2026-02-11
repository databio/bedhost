import init, {
  bedParserNew,
  bedParserUpdate,
  bedParserFinish,
  bedParserFree,
} from '@databio/gtars';

let wasmReady = false;

async function ensureWasm() {
  if (wasmReady) return;
  await init();
  wasmReady = true;
}

async function processStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  totalSize: number,
  parser: number,
) {
  let bytesProcessed = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    bedParserUpdate(parser, value);

    bytesProcessed += value.length;
    self.postMessage({
      type: 'progress',
      bytesProcessed,
      totalSize,
      percent: totalSize > 0 ? Math.round((100 * bytesProcessed) / totalSize) : -1,
    });
  }
}

async function processFile(file: File) {
  self.postMessage({ type: 'status', message: 'Loading WASM module...' });
  await ensureWasm();

  const parser = bedParserNew();

  try {
    self.postMessage({ type: 'status', message: 'Processing file...' });

    const stream = file.stream();
    const reader = stream.getReader();
    await processStream(reader, file.size, parser);

    self.postMessage({ type: 'status', message: 'Building RegionSet...' });
    const entries = bedParserFinish(parser);

    self.postMessage({ type: 'result', entries });
  } catch (err) {
    bedParserFree(parser);
    throw err;
  }
}

async function processUrl(url: string) {
  self.postMessage({ type: 'status', message: 'Loading WASM module...' });
  await ensureWasm();

  self.postMessage({ type: 'status', message: 'Fetching file...' });

  const fetchUrl =
    url.length === 32 && !url.startsWith('http')
      ? `https://api.bedbase.org/v1/files/files/${url[0]}/${url[1]}/${url}.bed.gz`
      : url;

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch BED file: ${response.statusText}`);
  }

  const parser = bedParserNew();

  try {
    self.postMessage({ type: 'status', message: 'Processing file...' });

    const contentLength = response.headers.get('content-length');
    const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
    const reader = response.body!.getReader();
    await processStream(reader, totalSize, parser);

    self.postMessage({ type: 'status', message: 'Building RegionSet...' });
    const entries = bedParserFinish(parser);

    self.postMessage({ type: 'result', entries });
  } catch (err) {
    bedParserFree(parser);
    throw err;
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { file, url } = e.data;

  try {
    if (file) {
      await processFile(file);
    } else if (url) {
      await processUrl(url);
    } else {
      throw new Error('No file or URL provided');
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: (error as Error).message });
  }
};
