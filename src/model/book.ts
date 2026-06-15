import { parseCfi } from '@/lib/epub-cfi';
import type {
  BookLayout,
  BookMetadata,
  EncryptionItem,
  ManifestItem,
  SpineItem,
  SpreadMode,
} from './types';
import type { OpfData } from './opf';

export interface Book {
  hash: string;
  metadata: BookMetadata;
  spineItems: SpineItem[];
  manifest: ManifestItem[];
  encryptionItems: EncryptionItem[];
  layout: BookLayout;
  spreadMode: SpreadMode;
}

export function createBook(
  hash: string,
  opfResult: OpfData,
  encryptionItems: EncryptionItem[],
): Book {
  return {
    hash,
    metadata: opfResult.metadata,
    spineItems: opfResult.spine,
    manifest: opfResult.manifest,
    encryptionItems,
    layout: opfResult.layout,
    spreadMode: opfResult.spreadMode,
  };
}

export function getSpineItem(book: Book, index: number): SpineItem | undefined {
  return book.spineItems[index];
}

export function getSpineIndex(book: Book, cfi: string): number {
  return parseCfi(cfi).spineIndex;
}
