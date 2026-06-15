import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockIsRegistered, mockGetEntry } = vi.hoisted(() => ({
  mockIsRegistered: vi.fn(),
  mockGetEntry: vi.fn(),
}));

vi.mock('@/sw/zip-manager', () => ({
  isRegistered: mockIsRegistered,
  getEntry: mockGetEntry,
}));

// Minimal Cache + caches stub
const mockCacheMatch = vi.fn().mockResolvedValue(undefined);
const mockCachePut = vi.fn().mockResolvedValue(undefined);
const mockCacheOpen = vi.fn().mockResolvedValue({ match: mockCacheMatch, put: mockCachePut });
(globalThis as Record<string, unknown>)['caches'] = { open: mockCacheOpen };

import { handleFetch, shouldCache, EPUB_ROUTE } from '@/sw/fetch-handler';

beforeEach(() => vi.clearAllMocks());

describe('EPUB_ROUTE', () => {
  it('matches valid epub path', () => {
    expect(EPUB_ROUTE.exec('/___/abc123/OEBPS/ch1.xhtml')).not.toBeNull();
  });
  it('does not match non-epub path', () => {
    expect(EPUB_ROUTE.exec('/assets/style.css')).toBeNull();
  });
});

describe('shouldCache', () => {
  it('caches css/fonts/images', () => {
    expect(shouldCache('style.css')).toBe(true);
    expect(shouldCache('font.woff2')).toBe(true);
    expect(shouldCache('cover.jpg')).toBe(true);
  });
  it('does not cache html/xhtml', () => {
    expect(shouldCache('ch1.xhtml')).toBe(false);
    expect(shouldCache('page.html')).toBe(false);
  });
});

describe('handleFetch', () => {
  const makeReq = (path: string) => new Request(`https://beer.local${path}`);

  it('returns 404 when book not registered', async () => {
    mockIsRegistered.mockReturnValue(false);
    const res = await handleFetch(makeReq('/___/abc123/ch1.xhtml'));
    expect(res.status).toBe(404);
  });

  it('returns entry with correct Content-Type', async () => {
    mockIsRegistered.mockReturnValue(true);
    mockCacheMatch.mockResolvedValue(undefined);
    const blob = new Blob(['<html/>'], { type: 'application/xhtml+xml' });
    mockGetEntry.mockResolvedValue(blob);

    const res = await handleFetch(makeReq('/___/abc123/OEBPS/ch1.xhtml'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/xhtml+xml');
  });

  it('returns 404 when entry not in zip', async () => {
    mockIsRegistered.mockReturnValue(true);
    mockCacheMatch.mockResolvedValue(undefined);
    mockGetEntry.mockResolvedValue(null);

    const res = await handleFetch(makeReq('/___/abc123/missing.xhtml'));
    expect(res.status).toBe(404);
  });

  it('returns cached response when available', async () => {
    mockIsRegistered.mockReturnValue(true);
    const cached = new Response('cached', { status: 200 });
    mockCacheMatch.mockResolvedValue(cached);

    const res = await handleFetch(makeReq('/___/abc123/style.css'));
    expect(res).toBe(cached);
    expect(mockGetEntry).not.toHaveBeenCalled();
  });

  it('passes through non-epub requests via fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('ok'));
    (globalThis as Record<string, unknown>)['fetch'] = mockFetch;
    await handleFetch(makeReq('/index.html'));
    expect(mockFetch).toHaveBeenCalled();
    delete (globalThis as Record<string, unknown>)['fetch'];
  });
});
