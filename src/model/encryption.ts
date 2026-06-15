import { domToJson, type DomNode } from '@/lib/dom-to-json';
import type { EncryptionItem } from './types';

const ALGO_IDPF = 'http://www.idpf.org/2008/embedding';
const ALGO_ADOBE = 'http://ns.adobe.com/pdf/enc#RC';

export function needsDecryption(algo: string): 'idpf' | 'adobe' | null {
  if (algo === ALGO_IDPF) return 'idpf';
  if (algo === ALGO_ADOBE) return 'adobe';
  return null;
}

export function parseEncryption(xml: string): EncryptionItem[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const root = doc.querySelector('encryption');
  if (!root) return [];

  const data = domToJson(root);
  const entries = data['EncryptedData'];
  const items = entries === undefined ? [] : Array.isArray(entries) ? entries : [entries];

  const result: EncryptionItem[] = [];
  for (const entry of items as DomNode[]) {
    const cipher = entry['CipherData'] as DomNode | undefined;
    const ref = cipher?.['CipherReference'] as DomNode | undefined;
    const method = entry['EncryptionMethod'] as DomNode | undefined;
    const href = ref?.['_URI'] as string | undefined;
    const algo = method?.['_Algorithm'] as string | undefined;
    if (!href || !algo) continue;
    const type = needsDecryption(algo);
    if (!type) continue;
    result.push({ href, algorithm: type });
  }

  return result;
}

export function findEncryption(items: EncryptionItem[], href: string): EncryptionItem | undefined {
  return items.find((item) => item.href === href);
}
