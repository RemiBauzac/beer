import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { importBook } from '@/store/book-import';
import { DuplicateBookError } from '@/store/book-import';
import type { StoredBook } from '@/model/types';

interface ImportButtonProps {
  onImported: (book: StoredBook) => void;
  size?: 'default' | 'lg';
}

export function ImportButton({ onImported, size = 'default' }: ImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const epubs = Array.from(files).filter((f) => f.name.endsWith('.epub'));
      if (!epubs.length) return;

      setImporting(true);
      for (const file of epubs) {
        try {
          const book = await importBook(file);
          onImported(book);
          toast.success(`Imported "${book.title}"`);
        } catch (err) {
          if (err instanceof DuplicateBookError) {
            toast.info(`"${file.name}" already in library`);
          } else {
            toast.error(`Failed to import "${file.name}"`);
          }
        }
      }
      setImporting(false);
    },
    [onImported],
  );

  useEffect(() => {
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.files) void processFiles(e.dataTransfer.files);
    };
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [processFiles]);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".epub"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void processFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <Button size={size} disabled={importing} onClick={() => inputRef.current?.click()}>
        {importing ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Upload className="w-4 h-4 mr-2" />
        )}
        {importing ? 'Importing…' : 'Import epub'}
      </Button>
    </>
  );
}
