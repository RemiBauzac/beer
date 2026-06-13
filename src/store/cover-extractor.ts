import { BlobReader, BlobWriter, ZipReader } from '@zip.js/zip.js';
import type { Book } from '@/model/book';

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

export function guessMimeFromHref(href: string): string {
  const ext = href.split('.').pop()?.toLowerCase() ?? '';
  return MIME_MAP[ext] ?? 'image/jpeg';
}

export async function extractCover(epubBlob: Blob, book: Book): Promise<Blob | undefined> {
  const coverItem =
    book.manifest.find((m) => m.properties === 'cover-image') ??
    book.manifest.find((m) => m.href === book.metadata.coverHref) ??
    book.manifest.find((m) => m.mediaType.startsWith('image/'));

  if (!coverItem) return undefined;

  const reader = new ZipReader(new BlobReader(epubBlob));
  try {
    const entries = await reader.getEntries();
    const href = coverItem.href.startsWith('/') ? coverItem.href.slice(1) : coverItem.href;
    const entry = entries.find((e) => e.filename === href || e.filename.endsWith(href));
    if (!entry) return undefined;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const blob = (await (entry as any).getData(new BlobWriter())) as Blob;
    const mime = coverItem.mediaType || guessMimeFromHref(coverItem.href);
    return new Blob([blob], { type: mime });
  } finally {
    await reader.close();
  }
}
