import * as Comlink from 'comlink';
import { BlobReader, BlobWriter, ZipReader } from '@zip.js/zip.js';
import { parseContainer, parseOpf } from '@/model/opf';
import { parseEncryption } from '@/model/encryption';
import type { EncryptionItem, ManifestItem, SpineItem, BookMetadata } from '@/model/types';

export interface EpubParseResult {
  hash: string;
  metadata: BookMetadata;
  manifest: ManifestItem[];
  spine: SpineItem[];
  encryptionItems: EncryptionItem[];
}

async function readZipEntry(reader: ZipReader<unknown>, path: string): Promise<string | null> {
  const entries = await reader.getEntries();
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const entry = entries.find((e) => e.filename === normalized);
  if (!entry) return null;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const blob = (await (entry as any).getData(new BlobWriter())) as Blob;
  return blob.text();
}

async function computeHash(blob: Blob): Promise<string> {
  const chunk = blob.slice(0, 64 * 1024);
  const buffer = await chunk.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const worker = {
  async parseEpub(
    blob: Blob,
    onProgress: (step: number, total: number, label: string) => void,
  ): Promise<EpubParseResult> {
    const total = 3;

    onProgress(1, total, 'computing hash');
    const hash = await computeHash(blob);

    onProgress(2, total, 'parsing epub structure');
    const zipReader = new ZipReader(new BlobReader(blob));
    try {
      const containerXml = await readZipEntry(zipReader, 'META-INF/container.xml');
      if (!containerXml) throw new Error('Missing META-INF/container.xml');

      const opfPath = await parseContainer(containerXml);
      const opfXml = await readZipEntry(zipReader, opfPath);
      if (!opfXml) throw new Error(`Missing OPF at ${opfPath}`);

      const opfData = await parseOpf(opfXml, opfPath);

      onProgress(3, total, 'parsing encryption');
      let encryptionItems: EncryptionItem[] = [];
      const encXml = await readZipEntry(zipReader, 'META-INF/encryption.xml');
      if (encXml) encryptionItems = parseEncryption(encXml);

      return {
        hash,
        metadata: opfData.metadata,
        manifest: opfData.manifest,
        spine: opfData.spine,
        encryptionItems,
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error parsing EPUB:', err);
      throw err;
    } finally {
      await zipReader.close();
    }
  },

  async extractCover(blob: Blob, manifest: ManifestItem[]): Promise<Blob | undefined> {
    const coverItem =
      manifest.find((m) => m.properties === 'cover-image') ??
      manifest.find((m) => m.mediaType.startsWith('image/'));

    if (!coverItem) return undefined;

    const zipReader = new ZipReader(new BlobReader(blob));
    try {
      const entries = await zipReader.getEntries();
      const href = coverItem.href.startsWith('/') ? coverItem.href.slice(1) : coverItem.href;
      const entry = entries.find((e) => e.filename === href || e.filename.endsWith(href));
      if (!entry) return undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      return (await (entry as any).getData(new BlobWriter())) as Blob;
    } finally {
      await zipReader.close();
    }
  },
};

Comlink.expose(worker);
