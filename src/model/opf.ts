import { domToJson, type DomNode } from '@/lib/dom-to-json';
import { generateChapterCfi } from '@/lib/epub-cfi';
import type { BookLayout, BookMetadata, ManifestItem, SpineItem, SpreadMode } from './types';

export function parseContainer(xml: string): Promise<string> {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const rootfile = doc.querySelector('rootfile');
  const path = rootfile?.getAttribute('full-path');
  if (!path) return Promise.reject(new Error('No rootfile found in container.xml'));
  return Promise.resolve(path);
}

export interface OpfData {
  metadata: BookMetadata;
  manifest: ManifestItem[];
  spine: SpineItem[];
  encryptionHref: string | null;
  layout: BookLayout;
  spreadMode: SpreadMode;
}

export function parseOpf(opfXml: string, opfPath: string): Promise<OpfData> {
  const doc = new DOMParser().parseFromString(opfXml, 'application/xml');
  const basePath = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';

  const metaEl = doc.querySelector('metadata');
  const manifestEl = doc.querySelector('manifest');
  const spineEl = doc.querySelector('spine');

  if (!metaEl || !manifestEl || !spineEl)
    return Promise.reject(new Error('Invalid OPF: missing required elements'));

  const metaJson = domToJson(metaEl);
  const manifestJson = domToJson(manifestEl);
  const spineJson = domToJson(spineEl);

  // Metadata
  const getText = (key: string): string => {
    const val = metaJson[key];
    const node: DomNode | undefined = Array.isArray(val)
      ? val[0]
      : typeof val === 'object' && val !== null
        ? val
        : undefined;
    const text = node?.['__text'];
    return typeof text === 'string' ? text : '';
  };

  const uid = ((metaJson['identifier'] as DomNode | undefined)?.['__text'] as string) ?? '';
  const metadata: BookMetadata = {
    id: uid,
    title: getText('title'),
    author: getText('creator'),
    language: getText('language'),
    publisher: getText('publisher') || undefined,
    description: getText('description') || undefined,
    uid,
  };

  // Manifest
  const manifestItems = toArray(manifestJson['item']).map((item) => ({
    id: item['_id'] as string,
    href: `${basePath}${item['_href'] as string}`,
    mediaType: item['_media-type'] as string,
    properties: item['_properties'] as string | undefined,
  }));
  const manifestById = new Map(manifestItems.map((i) => [i.id, i]));

  // Rendition meta (layout + spread)
  const metas = toArray(metaJson['meta']);
  const coverMeta = metas.find((m) => (m['_name'] as string) === 'cover');
  const coverItemId = coverMeta ? (coverMeta['_content'] as string) : undefined;
  const coverItem =
    manifestItems.find((i) => i.properties === 'cover-image') ??
    (coverItemId ? manifestById.get(coverItemId) : undefined);
  if (coverItem) metadata.coverHref = coverItem.href;

  const layoutMeta = metas.find((m) => m['_property'] === 'rendition:layout');
  const layout: BookLayout =
    typeof layoutMeta?.['__text'] === 'string' && layoutMeta['__text'] === 'pre-paginated'
      ? 'fixed'
      : 'reflowable';

  const spreadMeta = metas.find((m) => m['_property'] === 'rendition:spread');
  const rawSpread = typeof spreadMeta?.['__text'] === 'string' ? spreadMeta['__text'] : '';
  const spreadMode: SpreadMode =
    rawSpread === 'none' ? 'none' : rawSpread === 'landscape' ? 'landscape' : 'auto';

  // Encryption href (OPF sometimes references it; standard path used by convention)
  const encryptionHref = manifestItems.find((i) => i.href.endsWith('encryption.xml'))?.href ?? null;

  // Spine
  const spineNodeIndex = elementIndex(spineEl);
  const itemrefs = toArray(spineJson['itemref']);
  const spine: SpineItem[] = itemrefs
    .map((ref, pos) => {
      const idref = ref['_idref'] as string;
      const item = manifestById.get(idref);
      if (!item) return null;
      return {
        id: idref,
        href: item.href,
        mediaType: item.mediaType,
        cfi: generateChapterCfi(spineNodeIndex, pos, idref),
        linear: (ref['_linear'] as string | undefined) !== 'no',
      };
    })
    .filter((i): i is SpineItem => i !== null);

  return Promise.resolve({
    metadata,
    manifest: manifestItems,
    spine,
    encryptionHref,
    layout,
    spreadMode,
  });
}

function toArray(val: unknown): DomNode[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as DomNode[];
  return [val as DomNode];
}

function elementIndex(el: Element): number {
  const parent = el.parentElement;
  if (!parent) return 0;
  return Array.from(parent.children).indexOf(el);
}
