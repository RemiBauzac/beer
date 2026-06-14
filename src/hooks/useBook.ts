import { useEffect, useRef, useState } from 'react';
import { getBook, getBookBlob } from '@/store/book-store';
import { computeHash, useSw } from './useSw';
import { parseContainer, parseOpf } from '@/model/opf';
import { parseEncryption } from '@/model/encryption';
import { createBook } from '@/model/book';
import type { EncryptionItem } from '@/model/types';
import type { Book } from '@/model/book';
import type { StoredBook } from '@/model/types';

interface UseBookResult {
  book: Book | null;
  storedBook: StoredBook | null;
  loading: boolean;
  error: string | null;
}

export function useBook(bookId: string): UseBookResult {
  const [book, setBook] = useState<Book | null>(null);
  const [storedBook, setStoredBook] = useState<StoredBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { ready, registerBook, unregisterBook } = useSw();
  const hashRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const stored = await getBook(bookId);
      if (!stored) {
        if (!cancelled) {
          setError('Book not found');
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setStoredBook(stored);

      const blob = await getBookBlob(bookId);
      if (!blob) {
        if (!cancelled) {
          setError('Book file not found');
          setLoading(false);
        }
        return;
      }

      const hash = await computeHash(blob);
      hashRef.current = hash;

      await registerBook(hash, blob);

      const base = `/___/${hash}`;

      const containerXml = await fetch(`${base}/META-INF/container.xml`).then((r) => r.text());
      const opfPath = await parseContainer(containerXml);

      const opfXml = await fetch(`${base}/${opfPath}`).then((r) => r.text());
      const opfData = await parseOpf(opfXml, opfPath);

      let encItems: EncryptionItem[] = [];
      const encPath = opfData.encryptionHref ?? 'META-INF/encryption.xml';
      const encRes = await fetch(`${base}/${encPath}`);
      if (encRes.ok) {
        const encXml = await encRes.text();
        encItems = parseEncryption(encXml);
      }

      const result = createBook(hash, opfData, encItems);

      if (!cancelled) {
        setBook(result);
        setLoading(false);
      }
    }

    load().catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load book');
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      if (hashRef.current) {
        void unregisterBook(hashRef.current);
        hashRef.current = null;
      }
    };
  }, [bookId, ready, registerBook, unregisterBook]);

  return { book, storedBook, loading, error };
}
