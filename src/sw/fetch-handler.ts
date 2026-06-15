import { getEntry, isRegistered } from './zip-manager';
import { decryptIdpf, decryptAdobe, needsDecryption } from '@/lib/decryptor';
import type { EncryptionItem } from '@/model/types';

export const EPUB_ROUTE = /^\/___\/([a-f0-9]+)\/(.+)$/;

const MIME: Record<string, string> = {
  css: 'text/css',
  js: 'application/javascript',
  html: 'text/html',
  xhtml: 'application/xhtml+xml',
  xml: 'application/xml',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  ttf: 'application/x-font-truetype',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  ncx: 'application/x-dtbncx+xml',
  opf: 'application/oebps-package+xml',
};

const CACHE_EXTS = new Set([
  'css',
  'js',
  'ttf',
  'otf',
  'woff',
  'woff2',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'svg',
  'webp',
  'mp3',
  'mp4',
]);

interface BookCrypto {
  encryptionItems: EncryptionItem[];
  uid: string;
}

const cryptoRegistry = new Map<string, BookCrypto>();

export function registerCrypto(hash: string, crypto: BookCrypto): void {
  cryptoRegistry.set(hash, crypto);
}

export function unregisterCrypto(hash: string): void {
  cryptoRegistry.delete(hash);
}

export function shouldCache(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return CACHE_EXTS.has(ext);
}

export async function handleFetch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const match = EPUB_ROUTE.exec(url.pathname);
  if (!match) return fetch(request);

  const hash = match[1]!;
  const path = match[2]!;

  if (!isRegistered(hash)) {
    return new Response('Book not registered', { status: 404 });
  }

  const cache = await caches.open(`epub-${hash}`);
  const cached = await cache.match(request);
  if (cached) return cached;

  const blob = await getEntry(hash, path);
  if (!blob) {
    return new Response('Entry not found', { status: 404 });
  }

  let data: ArrayBuffer = await blob.arrayBuffer();

  const crypto = cryptoRegistry.get(hash);
  if (crypto) {
    const encItem = crypto.encryptionItems.find((e) => e.href === path || e.href === `/${path}`);
    if (encItem) {
      const type = needsDecryption(
        encItem.algorithm === 'idpf'
          ? 'http://www.idpf.org/2008/embedding'
          : 'http://ns.adobe.com/pdf/enc#RC',
      );
      if (type === 'idpf') data = await decryptIdpf(data, crypto.uid);
      else if (type === 'adobe') data = await decryptAdobe(data, crypto.uid);
    }
  }

  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const contentType = MIME[ext] ?? 'application/octet-stream';

  const response = new Response(data, {
    status: 200,
    headers: { 'Content-Type': contentType },
  });

  if (shouldCache(path)) {
    await cache.put(request, response.clone());
  }

  return response;
}
