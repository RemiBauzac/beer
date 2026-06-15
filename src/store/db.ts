import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { StoredBook } from '@/model/types';

interface BeerDB extends DBSchema {
  books: {
    key: string;
    value: StoredBook;
    indexes: { 'by-title': string; 'by-addedAt': Date };
  };
  blobs: {
    key: string;
    value: { id: string; blob: Blob };
  };
  covers: {
    key: string;
    value: { id: string; blob: Blob };
  };
}

let dbPromise: Promise<IDBPDatabase<BeerDB>> | null = null;

export async function getDb(): Promise<IDBPDatabase<BeerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BeerDB>('beer', 1, {
      upgrade(db) {
        const bookStore = db.createObjectStore('books', { keyPath: 'id' });
        bookStore.createIndex('by-title', 'title');
        bookStore.createIndex('by-addedAt', 'addedAt');
        db.createObjectStore('blobs', { keyPath: 'id' });
        db.createObjectStore('covers', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export function resetDb(): void {
  dbPromise = null;
}
