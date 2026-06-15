import { useCallback, useEffect, useState } from 'react';
import { listBooks, deleteBook as deleteBookFromStore } from '@/store/book-store';
import { importBook as importBookFn } from '@/store/book-import';
import type { StoredBook } from '@/model/types';
import type { ImportProgress } from '@/store/book-import';

interface UseLibraryResult {
  books: StoredBook[];
  loading: boolean;
  importing: boolean;
  importError: Error | null;
  addBook: (book: StoredBook) => void;
  deleteBook: (book: StoredBook) => Promise<void>;
  importBook: (file: File, onProgress?: (p: ImportProgress) => void) => Promise<StoredBook>;
}

export function useLibrary(): UseLibraryResult {
  const [books, setBooks] = useState<StoredBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<Error | null>(null);

  useEffect(() => {
    void listBooks()
      .then(setBooks)
      .finally(() => setLoading(false));
  }, []);

  const addBook = useCallback((book: StoredBook) => {
    setBooks((prev) => [book, ...prev]);
  }, []);

  const deleteBook = useCallback(async (book: StoredBook) => {
    setBooks((prev) => prev.filter((b) => b.id !== book.id));
    await deleteBookFromStore(book.id);
  }, []);

  const importBook = useCallback(
    async (file: File, onProgress?: (p: ImportProgress) => void): Promise<StoredBook> => {
      setImporting(true);
      setImportError(null);
      try {
        const book = await importBookFn(file, onProgress);
        setBooks((prev) => [book, ...prev]);
        return book;
      } catch (err) {
        setImportError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setImporting(false);
      }
    },
    [],
  );

  return { books, loading, importing, importError, addBook, deleteBook, importBook };
}
