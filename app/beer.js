import serviceWorkerInstall from './sw/install';
import Opf from './model/opf';
import Book from './model/book';
import Encryption from './model/encryption';
import Scroll from './display/scroll';
import Page from './display/page';
import Fixed from './display/fixed';
import Base from './display/base';

export default class Beer {
  /**
   * @param book A Book
   */
  constructor(book) {
    this._book = book;
  }

  static async init() {
    await serviceWorkerInstall();
    // registration.onupdatefound = () => onServiceWorkerUpdate(registration); // should do something with that

    if (navigator.serviceWorker.controller !== null) {
      return;
    }

    await new Promise(resolve => {
      navigator.serviceWorker.oncontrollerchange = function () {
        this.controller.onstatechange = function () {
          if (this.state === 'activated') {
            window.location.reload(); // SW do not control the page immediately in FF :(
            resolve();
          }
        };
      };
    });
  }

  /**
   * Create new BEER reader that will load a book from the url
   *
   * @param url The URL of the epub
   * @returns Promise that resolves with the BEER reader
   */
  static async withBookUrl(url) {
    try {
      const h = await sendBookUrlToSw(url);
      const book = await loadBook(h);
      return new Beer(book);
    } catch (e) {
      console.error(e);
    }
  }

  get book() {
    return this._book;
  }

  get displayOptions() {
    return this._displayOptions;
  }

  /**
   * Display loaded book on a HTML element
   *
   * @param htmlElement a HTML element
   * @param displayOptions
   */
  displayBook(htmlElement, displayOptions = false) {
    if (!htmlElement) {
      throw new Error('container HTML element not found');
    }
    const defaultOptions = getDefaultDisplayOptions();
    this._displayOptions = Object.assign(defaultOptions, displayOptions);

    if (this._book.isFixedLayout) {
      this._displayOptions.mode = 'fixed';
    }

    let readerDisplay;
    if (this._displayOptions.mode === 'scroll') {
      readerDisplay = new Scroll(htmlElement, this._displayOptions);
    } else if (this._displayOptions.mode === 'fixed') {
      readerDisplay = new Fixed(htmlElement, this._displayOptions);
    } else {
      readerDisplay = new Page(htmlElement, this._displayOptions);
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => e.matches && readerDisplay._displayOptions.theme === Base.AUTO_THEME && readerDisplay.autoTheme());
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => e.matches && readerDisplay._displayOptions.theme === Base.AUTO_THEME && readerDisplay.autoTheme());

    readerDisplay.display(this._book, this._displayOptions.cfi || null);

    return readerDisplay;
  }
}

async function loadBook(hash) {
  const opf = await getOpf(hash);
  const encryptionData = await getEncryptionData(hash, opf);
  return new Book(hash, opf.metadata, opf.spineItems, encryptionData);
}

async function getFile(hash, path, format = 'string') {
  const response = await fetch(`/___/${hash}/${path}`);
  if (!response.ok) {
    throw new Error(`${path}: ${response.status}`);
  }
  if (format === 'string') {
    return response.text();
  }
  return response.arrayBuffer();
}

function getBasePath(contentFilePath) {
  const result = contentFilePath.match(/^(\w*)\/\w*\.opf$/);
  if (result) {
    return result[1] + '/';
  }
  return '';
}

function getOpfFilePath(container) {
  return container.querySelector('rootfile').getAttribute('full-path');
}

async function getOpf(hash) {
  const parser = new DOMParser();
  const containerXml = await getFile(hash, 'META-INF/container.xml');
  const container = parser.parseFromString(containerXml.trim(), 'text/xml');
  const opfFilePath = getOpfFilePath(container);
  const basePath = getBasePath(opfFilePath);
  const opfXml = await getFile(hash, opfFilePath);
  return Opf.create(basePath, parser.parseFromString(opfXml.trim(), 'text/xml'));
}

async function getEncryptionData(hash, opf) {
  const parser = new DOMParser();
  let encryptionXml;
  try {
    encryptionXml = await getFile(hash, 'META-INF/encryption.xml');
  } catch {
    return Encryption.empty();
  }
  const xmlDoc = parser.parseFromString(encryptionXml.trim(), 'text/xml');
  return Encryption.create(xmlDoc, opf);
}

async function sendBookUrlToSw(url) {
  const h = await hashCode(url);
  navigator.serviceWorker.controller.postMessage({ hash: h, url });
  return h;
}

function getDefaultDisplayOptions() {
  return {
    mode: 'page',
    columnCount: Base.DEFAULT_COLUMN_COUNT,
    margin: Base.DEFAULT_MARGIN,
    theme: Base.AUTO_THEME,
    ratio: Base.DEFAULT_RATIO
  };
}

async function hashCode(string) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(string));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
