import { Skeleton } from '@/components/ui/skeleton';
import { BookCard } from './BookCard';
import { EmptyState } from './EmptyState';
import type { StoredBook } from '@/model/types';

interface BookGridProps {
  books: StoredBook[];
  loading: boolean;
  onOpen: (book: StoredBook) => void;
  onDelete: (book: StoredBook) => void;
  onImported: (book: StoredBook) => void;
}

function SkeletonCard() {
  return (
    <div className="min-w-[140px] max-w-[200px] w-full space-y-2">
      <Skeleton className="w-full rounded-md" style={{ aspectRatio: '2/3' }} />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function BookGrid({ books, loading, onOpen, onDelete, onImported }: BookGridProps) {
  if (loading) {
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!books.length) {
    return <EmptyState onImported={onImported} />;
  }

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
    >
      {books.map((book) => (
        <BookCard key={book.id} book={book} onOpen={onOpen} onDelete={onDelete} />
      ))}
    </div>
  );
}
