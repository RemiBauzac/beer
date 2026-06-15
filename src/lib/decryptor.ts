const ALGO_IDPF = 'http://www.idpf.org/2008/embedding';
const ALGO_ADOBE = 'http://ns.adobe.com/pdf/enc#RC';

export function needsDecryption(algo: string): 'idpf' | 'adobe' | null {
  if (algo === ALGO_IDPF) return 'idpf';
  if (algo === ALGO_ADOBE) return 'adobe';
  return null;
}

export async function decryptIdpf(data: ArrayBuffer, uid: string): Promise<ArrayBuffer> {
  // SHA-1 of UID with whitespace stripped, XOR first 1040 bytes
  const stripped = uid.replace(/[\t\n\r ]/g, '');
  const keyBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(stripped));
  const key = new Uint8Array(keyBuffer);
  return xorPrefix(data, key, 1040);
}

export function decryptAdobe(data: ArrayBuffer, uid: string): Promise<ArrayBuffer> {
  // UUID hex bytes → 16-byte key, XOR first 1024 bytes
  const key = urnUuidToBytes(uid);
  if (!key) return Promise.resolve(data);
  return Promise.resolve(xorPrefix(data, key, 1024));
}

function xorPrefix(data: ArrayBuffer, key: Uint8Array, prefixLen: number): ArrayBuffer {
  const arr = new Uint8Array(data.slice(0));
  const klen = key.length;
  for (let i = 0; i < prefixLen && i < arr.length; i++) {
    arr[i] = arr[i]! ^ key[i % klen]!;
  }
  return arr.buffer;
}

function urnUuidToBytes(uid: string): Uint8Array | null {
  const m =
    /(urn:uuid:)?([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})/i.exec(uid);
  if (!m) return null;
  const hex = m[2]! + m[3]! + m[4]! + m[5]! + m[6]!;
  if (hex.length !== 32) return null;
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}
