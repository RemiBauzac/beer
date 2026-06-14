import { useParams } from 'react-router-dom';
import { useBook } from '@/hooks/useBook';
import { useReaderState } from '@/hooks/useReaderState';
import { ReaderShell } from '@/components/reader/ReaderShell';
import { Skeleton } from '@/components/ui/skeleton';

export function ReaderPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const { book, storedBook, loading, error } = useBook(bookId ?? '');
  const [state, actions] = useReaderState(bookId ?? '', book, storedBook?.lastReadCfi);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col gap-4 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="flex-1 w-full" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">{error ?? 'Book not found'}</p>
      </div>
    );
  }

  return (
    <ReaderShell
      title={book.metadata.title}
      progress={state.progress}
      tocOpen={state.tocOpen}
      settingsOpen={state.settingsOpen}
      onToc={actions.toggleToc}
      onSettings={actions.toggleSettings}
    >
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Renderer coming soon</p>
      </div>
    </ReaderShell>
  );
}
