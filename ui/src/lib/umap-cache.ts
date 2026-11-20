// Persistent cache for the UMAP JSON used by the embedding atlas.
// Stores the raw bytes in IndexedDB so navigations within the SPA — and
// reloads within the TTL window — don't re-fetch the (multi-MB) file from
// the remote host.

const DB_NAME = 'bedbase-umap-cache';
const STORE = 'files';
const RECORD_KEY = 'umap';

export const UMAP_CACHE_TTL_MS = 10 * 24 * 60 * 60 * 1000; // 10 days

type CacheRecord = {
  url: string;
  fetchedAt: number;
  data: ArrayBuffer;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      }),
  );
}

export async function getCachedUmap(
  url: string,
  ttlMs: number = UMAP_CACHE_TTL_MS,
): Promise<ArrayBuffer | null> {
  try {
    const rec = await withStore<CacheRecord | undefined>('readonly', (s) =>
      s.get(RECORD_KEY) as IDBRequest<CacheRecord | undefined>,
    );
    if (!rec) return null;
    if (rec.url !== url) return null;
    if (Date.now() - rec.fetchedAt > ttlMs) return null;
    return rec.data;
  } catch {
    return null;
  }
}

export async function setCachedUmap(url: string, data: ArrayBuffer): Promise<void> {
  try {
    const rec: CacheRecord = { url, fetchedAt: Date.now(), data };
    await withStore('readwrite', (s) => s.put(rec, RECORD_KEY));
  } catch {
    // Quota / private mode — silently ignore; we'll just refetch next time.
  }
}
