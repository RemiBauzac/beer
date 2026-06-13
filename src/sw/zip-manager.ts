import { BlobReader, BlobWriter, HttpRangeReader, ZipReader } from '@zip.js/zip.js';

export type ZipSource = { type: 'blob'; blob: Blob } | { type: 'url'; url: string };

const readers = new Map<string, ZipReader<unknown>>();

export async function registerBook(hash: string, source: ZipSource): Promise<void> {
  if (readers.has(hash)) await unregisterBook(hash);
  const reader =
    source.type === 'blob' ? new BlobReader(source.blob) : new HttpRangeReader(source.url);
  readers.set(hash, new ZipReader(reader));
}

export async function getEntry(hash: string, path: string): Promise<Blob | null> {
  const reader = readers.get(hash);
  if (!reader) return null;

  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const entries = await reader.getEntries();
  const entry = entries.find((e) => e.filename === normalizedPath);
  if (!entry) return null;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  return entry.getData(new BlobWriter()) as Promise<Blob>;
}

export async function unregisterBook(hash: string): Promise<void> {
  const reader = readers.get(hash);
  if (reader) {
    await reader.close();
    readers.delete(hash);
  }
}

export function isRegistered(hash: string): boolean {
  return readers.has(hash);
}
