export interface BookMetadata {
  id: string;
  title: string;
  author: string;
  language: string;
  publisher?: string;
  description?: string;
  coverHref?: string;
  uid: string;
}

export interface SpineItem {
  id: string;
  href: string;
  mediaType: string;
  cfi: string;
  linear: boolean;
}

export interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
  properties?: string;
}

export interface EncryptionItem {
  href: string;
  algorithm: 'idpf' | 'adobe';
  keyData: Uint8Array;
}

export type BookLayout = 'reflowable' | 'fixed';

export type SpreadMode = 'none' | 'landscape' | 'auto';

export interface CfiStep {
  index: number;
  id?: string;
}

export interface CfiLocation {
  spineIndex: number;
  spineId: string;
  steps: CfiStep[];
  charOffset: number;
}

export interface StoredBook {
  id: string;
  title: string;
  author: string;
  language: string;
  publisher?: string;
  description?: string;
  coverHref?: string;
  uid: string;
  addedAt: Date;
  lastReadCfi?: string;
  lastReadAt?: Date;
  progress: number;
  fileSize: number;
}
