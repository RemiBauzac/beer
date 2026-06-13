import { describe, it, expect } from 'vitest';
import { parseEncryption, findEncryption, needsDecryption } from '@/model/encryption';

const IDPF_ALGO = 'http://www.idpf.org/2008/embedding';
const ADOBE_ALGO = 'http://ns.adobe.com/pdf/enc#RC';

const sampleXml = `<?xml version="1.0"?>
<encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <EncryptedData>
    <EncryptionMethod Algorithm="${IDPF_ALGO}"/>
    <CipherData><CipherReference URI="OEBPS/fonts/font1.otf"/></CipherData>
  </EncryptedData>
  <EncryptedData>
    <EncryptionMethod Algorithm="${ADOBE_ALGO}"/>
    <CipherData><CipherReference URI="OEBPS/fonts/font2.otf"/></CipherData>
  </EncryptedData>
</encryption>`;

describe('parseEncryption', () => {
  it('parses IDPF entry', () => {
    const items = parseEncryption(sampleXml);
    const idpf = items.find((i) => i.algorithm === 'idpf');
    expect(idpf?.href).toBe('OEBPS/fonts/font1.otf');
  });

  it('parses Adobe entry', () => {
    const items = parseEncryption(sampleXml);
    const adobe = items.find((i) => i.algorithm === 'adobe');
    expect(adobe?.href).toBe('OEBPS/fonts/font2.otf');
  });

  it('returns empty array for no encryption element', () => {
    expect(parseEncryption('<root/>')).toEqual([]);
  });
});

describe('findEncryption', () => {
  it('finds item by href', () => {
    const items = parseEncryption(sampleXml);
    expect(findEncryption(items, 'OEBPS/fonts/font1.otf')?.algorithm).toBe('idpf');
  });

  it('returns undefined for missing href', () => {
    const items = parseEncryption(sampleXml);
    expect(findEncryption(items, 'missing.otf')).toBeUndefined();
  });
});

describe('needsDecryption', () => {
  it('returns idpf for IDPF algorithm', () => expect(needsDecryption(IDPF_ALGO)).toBe('idpf'));
  it('returns adobe for Adobe algorithm', () => expect(needsDecryption(ADOBE_ALGO)).toBe('adobe'));
  it('returns null for unknown algorithm', () => expect(needsDecryption('unknown')).toBeNull());
});
