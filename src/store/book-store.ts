import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db';
import type { BookMetadata, StoredBook } from '@/model/types';

export async function addBook(blob: Blob, metadata: BookMetadata): Promise<string> {
  const id = uuidv4();
  const db = await getDb();
  const tx = db.transaction(['books', 'blobs'], 'readwrite');
  await Promise.all([
    tx.objectStore('books').put({
      ...metadata,
      id,
      addedAt: new Date(),
      progress: 0,
      fileSize: blob.size,
    } satisfies StoredBook),
    tx.objectStore('blobs').put({ id, blob }),
    tx.done,
  ]);
  return id;
}

export async function listBooks(): Promise<StoredBook[]> {
  const db = await getDb();
  const books = await db.getAllFromIndex('books', 'by-addedAt');
  return books.reverse();
}

export async function getBook(id: string): Promise<StoredBook | undefined> {
  const db = await getDb();
  return db.get('books', id);
}

export async function getBookBlob(id: string): Promise<Blob | undefined> {
  const db = await getDb();
  const entry = await db.get('blobs', id);
  return entry?.blob;
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['books', 'blobs', 'covers'], 'readwrite');
  await Promise.all([
    tx.objectStore('books').delete(id),
    tx.objectStore('blobs').delete(id),
    tx.objectStore('covers').delete(id),
    tx.done,
  ]);
}

export async function updateProgress(id: string, cfi: string, progress: number): Promise<void> {
  const db = await getDb();
  const book = await db.get('books', id);
  if (!book) return;
  await db.put('books', { ...book, lastReadCfi: cfi, lastReadAt: new Date(), progress });
}

export async function getCover(id: string): Promise<Blob | undefined> {
  const db = await getDb();
  const entry = await db.get('covers', id);
  return entry?.blob;
}

export async function storeCover(id: string, blob: Blob): Promise<void> {
  const db = await getDb();
  await db.put('covers', { id, blob });
}
