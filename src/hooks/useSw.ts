import { useEffect, useState } from 'react';

export async function computeHash(blob: Blob): Promise<string> {
  const chunk = blob.slice(0, 64 * 1024);
  const buffer = await chunk.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sendMessage(sw: ServiceWorker, message: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    sw.postMessage(message, [channel.port2]);
  });
}

interface UseSwResult {
  ready: boolean;
  registerBook: (hash: string, blob: Blob) => Promise<void>;
  unregisterBook: (hash: string) => Promise<void>;
}

export function useSw(): UseSwResult {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void navigator.serviceWorker.ready.then(() => setReady(true));
  }, []);

  async function registerBook(hash: string, blob: Blob): Promise<void> {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) return;
    await sendMessage(reg.active, { type: 'REGISTER_BOOK', id: hash, blob });
  }

  async function unregisterBook(hash: string): Promise<void> {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.active) return;
    await sendMessage(reg.active, { type: 'UNREGISTER_BOOK', id: hash });
  }

  return { ready, registerBook, unregisterBook };
}
