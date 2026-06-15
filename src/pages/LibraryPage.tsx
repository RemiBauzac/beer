import { useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ImportButton } from '@/components/library/ImportButton';
import { BookGrid } from '@/components/library/BookGrid';
import { useLibrary } from '@/hooks/useLibrary';
import type { StoredBook } from '@/model/types';

export function LibraryPage() {
  const navigate = useNavigate();
  const { books, loading, addBook, deleteBook } = useLibrary();

  const handleOpen = (book: StoredBook) => {
    void navigate(`/reader/${book.id}`);
  };

  const handleDelete = (book: StoredBook) => {
    void deleteBook(book);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h1 className="text-xl font-bold tracking-tight">BEER</h1>
        <ImportButton onImported={addBook} />
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <BookGrid
          books={books}
          loading={loading}
          onOpen={handleOpen}
          onDelete={handleDelete}
          onImported={addBook}
        />
      </main>

      <Toaster />
    </div>
  );
}
