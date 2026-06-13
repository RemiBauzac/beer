import { useEffect, useState } from 'react';
import { BookOpen, Trash2, BookMarked } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getCover } from '@/store/book-store';
import type { StoredBook } from '@/model/types';

interface BookCardProps {
  book: StoredBook;
  onOpen: (book: StoredBook) => void;
  onDelete: (book: StoredBook) => void;
}

function relativeTime(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff = (date.getTime() - Date.now()) / 1000;
  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second');
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

export function BookCard({ book, onOpen, onDelete }: BookCardProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverLoaded, setCoverLoaded] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    getCover(book.id)
      .then((blob) => {
        if (blob) {
          url = URL.createObjectURL(blob);
          setCoverUrl(url);
        }
        setCoverLoaded(true);
      })
      .catch(() => setCoverLoaded(true));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [book.id]);

  return (
    <Card className="group relative min-w-[140px] max-w-[200px] w-full overflow-hidden cursor-pointer select-none">
      <CardContent className="p-0">
        <div
          className="relative w-full bg-muted"
          style={{ aspectRatio: '2/3' }}
          onClick={() => onOpen(book)}
        >
          {!coverLoaded && <Skeleton className="absolute inset-0" />}
          {coverLoaded && coverUrl ? (
            <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
          ) : coverLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <BookMarked className="w-12 h-12 text-muted-foreground/40" />
            </div>
          ) : null}

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(book);
              }}
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Open
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" onClick={(e) => e.stopPropagation()}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete book?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{book.title}&rdquo; will be removed from your library.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(book)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="p-2 space-y-1" onClick={() => onOpen(book)}>
          <p className="font-semibold text-sm leading-tight line-clamp-2">{book.title}</p>
          <p className="text-xs text-muted-foreground truncate">{book.author}</p>

          {book.progress > 0 && <Progress value={book.progress * 100} className="h-1" />}

          {book.lastReadAt && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              {relativeTime(book.lastReadAt)}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
