import { describe, it, expect } from 'vitest';
import { parseCfi, generateChapterCfi, compareCfi, cfiToQuerySelector } from '@/lib/epub-cfi';

describe('parseCfi', () => {
  it('parses spine position', () => {
    const cfi = parseCfi('epubcfi(/6/4[chap01]!/4/2/1:0)');
    expect(cfi.spineIndex).toBe(1);
    expect(cfi.spineId).toBe('chap01');
  });

  it('parses char offset', () => {
    const cfi = parseCfi('epubcfi(/6/4!/4/2/1:42)');
    expect(cfi.charOffset).toBe(42);
  });

  it('returns spineIndex -1 for invalid CFI', () => {
    expect(parseCfi('not-a-cfi').spineIndex).toBe(-1);
    expect(parseCfi('').spineIndex).toBe(-1);
  });
});

describe('generateChapterCfi', () => {
  it('produces correct chapter component', () => {
    expect(generateChapterCfi(0, 1, 'chap01')).toBe('/2/4[chap01]');
  });

  it('omits id when empty', () => {
    expect(generateChapterCfi(0, 0, '')).toBe('/2/2');
  });
});

describe('compareCfi', () => {
  it('returns 0 for equal CFIs', () => {
    const cfi = 'epubcfi(/6/4!/4/2/1:0)';
    expect(compareCfi(cfi, cfi)).toBe(0);
  });

  it('orders by spine position', () => {
    const a = 'epubcfi(/6/2!/4/2/1:0)';
    const b = 'epubcfi(/6/4!/4/2/1:0)';
    expect(compareCfi(a, b)).toBe(-1);
    expect(compareCfi(b, a)).toBe(1);
  });

  it('orders by char offset within same spine', () => {
    const a = 'epubcfi(/6/4!/4/2/1:0)';
    const b = 'epubcfi(/6/4!/4/2/1:10)';
    expect(compareCfi(a, b)).toBe(-1);
  });
});

describe('cfiToQuerySelector', () => {
  it('generates selector from steps', () => {
    const sel = cfiToQuerySelector('epubcfi(/6/4!/4/2/1:0)');
    expect(sel).toContain('html');
    expect(sel).toContain('nth-child');
  });
});
