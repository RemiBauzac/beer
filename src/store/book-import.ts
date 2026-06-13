import { BlobReader, BlobWriter, ZipReader } from '@zip.js/zip.js';
import { parseContainer, parseOpf } from '@/model/opf';
import { parseEncryption } from '@/model/encryption';
import { createBook } from '@/model/book';
import { computeHash } from '@/hooks/useSw';
import { addBook, getBook, listBooks, storeCover } from './book-store';
import { extractCover } from './cover-extractor';
import type { EncryptionItem, StoredBook } from '@/model/types';

export interface ImportProgress {
  step: number;
  total: number;
  label: string;
}

export class DuplicateBookError extends Error {
  existingId: string;
  constructor(existingId: string) {
    super(`Book already imported: ${existingId}`);
    this.name = 'DuplicateBookError';
    this.existingId = existingId;
  }
}

type ProgressCallback = (progress: ImportProgress) => void;

async function readZipEntry(reader: ZipReader<unknown>, path: string): Promise<string | null> {
  const entries = await reader.getEntries();
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const entry = entries.find((e) => e.filename === normalized);
  if (!entry) return null;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const blob = (await (entry as any).getData(new BlobWriter())) as Blob;
  return blob.text();
}

export async function importBook(file: File, onProgress?: ProgressCallback): Promise<StoredBook> {
  const total = 6;

  onProgress?.({ step: 1, total, label: 'computing hash' });
  const hash = await computeHash(file);

  onProgress?.({ step: 2, total, label: 'checking duplicate' });
  const existing = (await listBooks()).find((b) => b.uid === hash);
  if (existing) throw new DuplicateBookError(existing.id);

  const zipReader = new ZipReader(new BlobReader(file));

  try {
    onProgress?.({ step: 3, total, label: 'parsing epub' });
    const containerXml = await readZipEntry(zipReader, 'META-INF/container.xml');
    if (!containerXml) throw new Error('Missing META-INF/container.xml');

    const opfPath = await parseContainer(containerXml);
    const opfXml = await readZipEntry(zipReader, opfPath);
    if (!opfXml) throw new Error(`Missing OPF at ${opfPath}`);

    const opfData = await parseOpf(opfXml, opfPath);

    let encryptionItems: EncryptionItem[] = [];
    const encXml = await readZipEntry(zipReader, 'META-INF/encryption.xml');
    if (encXml) encryptionItems = parseEncryption(encXml);

    const book = createBook(hash, opfData, encryptionItems);

    onProgress?.({ step: 4, total, label: 'extracting cover' });
    const coverBlob = await extractCover(file, book);

    onProgress?.({ step: 5, total, label: 'storing book' });
    const id = await addBook(file, { ...book.metadata, uid: hash });

    if (coverBlob) {
      await storeCover(id, coverBlob);
    }

    onProgress?.({ step: 6, total, label: 'registering with service worker' });
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({ type: 'REGISTER_BOOK', id: hash, blob: file });
    }

    const stored = await getBook(id);
    if (!stored) throw new Error('Book not found after import');
    return stored;
  } finally {
    await zipReader.close();
  }
}
