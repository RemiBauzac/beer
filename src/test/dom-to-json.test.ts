import { describe, it, expect } from 'vitest';
import { domToJson } from '@/lib/dom-to-json';

function parse(xml: string): Element {
  return new DOMParser().parseFromString(xml, 'application/xml').documentElement;
}

describe('domToJson', () => {
  it('maps attributes to _name keys', () => {
    const el = parse('<root id="x" lang="en"/>');
    expect(domToJson(el)).toMatchObject({ _id: 'x', _lang: 'en' });
  });

  it('maps text content to __text', () => {
    const el = parse('<root>hello</root>');
    expect(domToJson(el)).toMatchObject({ __text: 'hello' });
  });

  it('strips namespace prefixes from tag names', () => {
    const el = parse('<opf:root xmlns:opf="x"><opf:child/></opf:root>');
    const json = domToJson(el);
    expect(json).toHaveProperty('child');
  });

  it('collapses multiple same-tag children into array', () => {
    const el = parse('<root><item/><item/></root>');
    const json = domToJson(el);
    expect(Array.isArray(json['item'])).toBe(true);
  });

  it('keeps single child as object not array', () => {
    const el = parse('<root><item/></root>');
    const json = domToJson(el);
    expect(Array.isArray(json['item'])).toBe(false);
  });
});
