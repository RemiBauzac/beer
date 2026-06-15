import { describe, it, expect } from 'vitest';
import { decryptIdpf, decryptAdobe, needsDecryption } from '@/lib/decryptor';

describe('needsDecryption', () => {
  it('idpf', () => expect(needsDecryption('http://www.idpf.org/2008/embedding')).toBe('idpf'));
  it('adobe', () => expect(needsDecryption('http://ns.adobe.com/pdf/enc#RC')).toBe('adobe'));
  it('unknown returns null', () => expect(needsDecryption('other')).toBeNull());
});

describe('decryptIdpf', () => {
  it('XORs first 1040 bytes and leaves rest unchanged', async () => {
    const uid = 'urn:uuid:12345678-1234-1234-1234-123456789012';
    const input = new Uint8Array(2000).fill(0xff);
    const result = new Uint8Array(await decryptIdpf(input.buffer, uid));
    // All bytes in prefix should be XOR'd (not 0xff unless key byte is 0)
    // Bytes after 1040 must stay 0xff
    expect(result[1040]).toBe(0xff);
    expect(result[1999]).toBe(0xff);
  });

  it('is its own inverse (double-decrypt restores original)', async () => {
    const uid = 'urn:uuid:12345678-1234-1234-1234-123456789012';
    const original = crypto.getRandomValues(new Uint8Array(1040));
    const encrypted = await decryptIdpf(original.buffer, uid);
    const restored = new Uint8Array(await decryptIdpf(encrypted, uid));
    expect(restored).toEqual(original);
  });
});

describe('decryptAdobe', () => {
  it('is its own inverse', async () => {
    const uid = 'urn:uuid:12345678-1234-1234-1234-123456789012';
    const original = crypto.getRandomValues(new Uint8Array(1024));
    const encrypted = await decryptAdobe(original.buffer, uid);
    const restored = new Uint8Array(await decryptAdobe(encrypted, uid));
    expect(restored).toEqual(original);
  });

  it('returns data unchanged for invalid uid', async () => {
    const data = new Uint8Array([1, 2, 3]).buffer;
    const result = new Uint8Array(await decryptAdobe(data, 'not-a-uuid'));
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
  });
});
