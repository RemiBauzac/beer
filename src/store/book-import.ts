import * as Comlink from 'comlink';
import { createBook } from '@/model/book';
import { addBook, getBook, listBooks, storeCover } from './book-store';
import type { StoredBook } from '@/model/types';
import type { EpubParseResult } from '@/workers/import-worker';

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

type ImportWorker = {
  parseEpub(
    blob: Blob,
    onProgress: (step: number, total: number, label: string) => void,
  ): Promise<EpubParseResult>;
  extractCover(blob: Blob, manifest: EpubParseResult['manifest']): Promise<Blob | undefined>;
};

let workerInstance: Comlink.Remote<ImportWorker> | null = null;

function getWorker(): Comlink.Remote<ImportWorker> {
  if (!workerInstance) {
    const raw = new Worker(new URL('../workers/import-worker', import.meta.url), {
      type: 'module',
    });
    workerInstance = Comlink.wrap<ImportWorker>(raw);
  }
  return workerInstance;
}

export async function importBook(file: File, onProgress?: ProgressCallback): Promise<StoredBook> {
  const total = 4;
  const worker = getWorker();

  onProgress?.({ step: 1, total, label: 'checking duplicate' });

  const workerProgress = Comlink.proxy((step: number, workerTotal: number, label: string) => {
    onProgress?.({ step: 1 + Math.round((step / workerTotal) * 2), total, label });
  });

  const result = await worker.parseEpub(file, workerProgress);

  const existing = (await listBooks()).find((b) => b.uid === result.hash);
  if (existing) throw new DuplicateBookError(existing.id);

  onProgress?.({ step: 3, total, label: 'extracting cover' });
  const coverBlob = await worker.extractCover(file, result.manifest);

  const book = createBook(
    result.hash,
    {
      metadata: result.metadata,
      manifest: result.manifest,
      spine: result.spine,
      encryptionHref: null,
      layout: 'reflowable',
      spreadMode: 'auto',
    },
    result.encryptionItems,
  );

  onProgress?.({ step: 4, total, label: 'storing book' });
  const id = await addBook(file, { ...book.metadata, uid: result.hash });

  if (coverBlob) {
    await storeCover(id, coverBlob);
  }

  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: 'REGISTER_BOOK', id: result.hash, blob: file });
  }

  const stored = await getBook(id);
  if (!stored) throw new Error('Book not found after import');
  return stored;
}
