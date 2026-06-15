import { describe, it, expect } from 'vitest';
import { createBook, getSpineItem, getSpineIndex } from '@/model/book';
import type { OpfData } from '@/model/opf';
import type { SpineItem } from '@/model/types';

const spine: SpineItem[] = [
  {
    id: 'ch1',
    href: 'ch1.xhtml',
    mediaType: 'application/xhtml+xml',
    cfi: '/6/2[ch1]',
    linear: true,
  },
  {
    id: 'ch2',
    href: 'ch2.xhtml',
    mediaType: 'application/xhtml+xml',
    cfi: '/6/4[ch2]',
    linear: true,
  },
];

const baseOpf: OpfData = {
  metadata: { id: 'uid', title: 'Test', author: 'Author', language: 'en', uid: 'uid' },
  manifest: [],
  spine,
  encryptionHref: null,
  layout: 'reflowable',
  spreadMode: 'auto',
};

describe('createBook', () => {
  it('copies fields from opfResult', () => {
    const book = createBook('abc123', baseOpf, []);
    expect(book.hash).toBe('abc123');
    expect(book.metadata.title).toBe('Test');
    expect(book.spineItems).toHaveLength(2);
    expect(book.layout).toBe('reflowable');
    expect(book.spreadMode).toBe('auto');
  });

  it('detects fixed layout', () => {
    const book = createBook('h', { ...baseOpf, layout: 'fixed' }, []);
    expect(book.layout).toBe('fixed');
  });

  it('detects spread none', () => {
    const book = createBook('h', { ...baseOpf, spreadMode: 'none' }, []);
    expect(book.spreadMode).toBe('none');
  });
});

describe('getSpineItem', () => {
  const book = createBook('h', baseOpf, []);
  it('returns correct item', () => expect(getSpineItem(book, 0)?.id).toBe('ch1'));
  it('returns undefined for out-of-range', () => expect(getSpineItem(book, 99)).toBeUndefined());
});

describe('getSpineIndex', () => {
  const book = createBook('h', baseOpf, []);
  it('returns spine index from CFI', () => {
    expect(getSpineIndex(book, 'epubcfi(/6/4[ch2]!/4/2/1:0)')).toBe(1);
  });
});
