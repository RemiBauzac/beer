/// <reference lib="WebWorker" />

import { handleFetch } from './fetch-handler';
import { registerBook, unregisterBook } from './zip-manager';

declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = 'v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION && !k.startsWith('epub-'))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(handleFetch(event.request));
});

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as { type?: string; id?: string; blob?: Blob; url?: string } | null;
  if (!data?.type) return;

  switch (data.type) {
    case 'REGISTER_BOOK':
      if (data.id && data.blob) {
        event.waitUntil(registerBook(data.id, { type: 'blob', blob: data.blob }));
      }
      break;
    case 'REGISTER_URL':
      if (data.id && data.url) {
        event.waitUntil(registerBook(data.id, { type: 'url', url: data.url }));
      }
      break;
    case 'UNREGISTER_BOOK':
      if (data.id) {
        event.waitUntil(unregisterBook(data.id));
      }
      break;
    case 'PING':
      void event.source?.postMessage({ type: 'PONG' });
      break;
    case 'SKIP_WAITING':
      void self.skipWaiting();
      break;
  }
});
