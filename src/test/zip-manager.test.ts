import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetEntries, mockClose } = vi.hoisted(() => ({
  mockGetEntries: vi.fn(),
  mockClose: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@zip.js/zip.js', () => ({
  ZipReader: class {
    getEntries = mockGetEntries;
    close = mockClose;
  },
  BlobReader: class {},
  BlobWriter: class {},
  HttpRangeReader: class {},
}));

import { registerBook, getEntry, unregisterBook, isRegistered } from '@/sw/zip-manager';

beforeEach(() => {
  vi.clearAllMocks();
  mockClose.mockResolvedValue(undefined);
});

describe('isRegistered', () => {
  it('false before register', () => expect(isRegistered('new-hash')).toBe(false));
});

describe('registerBook + isRegistered', () => {
  it('registers a blob source', async () => {
    await registerBook('h1', { type: 'blob', blob: new Blob(['fake']) });
    expect(isRegistered('h1')).toBe(true);
    await unregisterBook('h1');
  });
});

describe('getEntry', () => {
  it('returns null for unregistered hash', async () => {
    expect(await getEntry('unknown', 'file.xhtml')).toBeNull();
  });

  it('returns blob for found entry', async () => {
    const fakeBlob = new Blob(['content']);
    const fakeEntry = { filename: 'OEBPS/ch1.xhtml', getData: vi.fn().mockResolvedValue(fakeBlob) };
    mockGetEntries.mockResolvedValue([fakeEntry]);

    await registerBook('h2', { type: 'blob', blob: new Blob() });
    const result = await getEntry('h2', 'OEBPS/ch1.xhtml');
    expect(result).toBe(fakeBlob);
    await unregisterBook('h2');
  });

  it('strips leading slash from path', async () => {
    const fakeBlob = new Blob(['x']);
    const fakeEntry = { filename: 'ch.xhtml', getData: vi.fn().mockResolvedValue(fakeBlob) };
    mockGetEntries.mockResolvedValue([fakeEntry]);

    await registerBook('h3', { type: 'blob', blob: new Blob() });
    const result = await getEntry('h3', '/ch.xhtml');
    expect(result).toBe(fakeBlob);
    await unregisterBook('h3');
  });

  it('returns null for missing entry', async () => {
    mockGetEntries.mockResolvedValue([]);
    await registerBook('h4', { type: 'blob', blob: new Blob() });
    expect(await getEntry('h4', 'missing.xhtml')).toBeNull();
    await unregisterBook('h4');
  });
});

describe('unregisterBook', () => {
  it('removes registration', async () => {
    await registerBook('h5', { type: 'blob', blob: new Blob() });
    await unregisterBook('h5');
    expect(isRegistered('h5')).toBe(false);
  });
});
