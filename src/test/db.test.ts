import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { getDb, resetDb } from '@/store/db';

beforeEach(() => {
  (globalThis as Record<string, unknown>)['indexedDB'] = new IDBFactory();
  resetDb();
});

describe('getDb', () => {
  it('opens database successfully', async () => {
    const db = await getDb();
    expect(db).toBeDefined();
    expect(db.objectStoreNames).toContain('books');
    expect(db.objectStoreNames).toContain('blobs');
    expect(db.objectStoreNames).toContain('covers');
  });

  it('returns singleton on repeated calls', async () => {
    const a = await getDb();
    const b = await getDb();
    expect(a).toBe(b);
  });

  it('books store has by-title and by-addedAt indexes', async () => {
    const db = await getDb();
    const tx = db.transaction('books', 'readonly');
    expect(tx.store.indexNames).toContain('by-title');
    expect(tx.store.indexNames).toContain('by-addedAt');
  });
});
