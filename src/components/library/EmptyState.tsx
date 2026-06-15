import { BookOpen } from 'lucide-react';
import { ImportButton } from './ImportButton';
import type { StoredBook } from '@/model/types';

interface EmptyStateProps {
  onImported: (book: StoredBook) => void;
}

export function EmptyState({ onImported }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center p-8">
      <BookOpen className="w-16 h-16 text-muted-foreground/40" />
      <div>
        <h2 className="text-xl font-semibold">Your library is empty</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Import an epub file to get started, or drag and drop one anywhere.
        </p>
      </div>
      <ImportButton onImported={onImported} size="lg" />
    </div>
  );
}
