
const config = {
  version: 'ninja-11',
  zipPattern: /___\/(\w+)\/(.*)$/,
  cachePattern: /\.(?:css|js|jpg|png|svg|ttf|woff|eot|otf|html|xhtml|mp3|m4a)$/,
  debug: true
};

const mimeTypeMap = {
  default: 'application/octet-stream',
  css: 'text/css',
  epub: 'application/epub+zip',
  gif: 'image/gif',
  htm: 'text/html',
  html: 'text/html',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  ncx: 'application/x-dtbncx+xml',
  opf: 'application/oebps-package+xml',
  png: 'image/png',
  svg: 'image/svg+xml',
  ttf: 'application/x-font-truetype',
  xhtml: 'application/xhtml+xml'
};

if (config.debug === false) {
  console.debug = function () {
  };
}

zip.configure({
  useWebWorkers: false
})

/**
 * On SW activation:
 *  - clean old cache entries
 *  - force clients claim
 */
self.addEventListener('activate', function (event) {
  async function onActivate(version) {
    const cacheKeys = await caches.keys();
    const oldCacheKeys = cacheKeys.filter(key => (key.indexOf(version) !== 0) && (key.indexOf('ebook') !== 0));
    return Promise.all(oldCacheKeys.map(oldKey => caches.delete(oldKey)));
  }

  console.debug('[BEER-SW] Activate');
  event.waitUntil((async () => {
    await onActivate(config.version);
    console.debug(`[BEER-SW] Claiming clients for version ${config.version}`);
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    console.debug('[BEER-SW] Clients', clients.map(c => c.url));
    return self.clients.claim();
  })());
});

/**
 * On SW installation:
 *  - force immediate installation
 */
self.addEventListener('install', event => {
  console.debug('[BEER-SW] Installation');
  return event.waitUntil(self.skipWaiting());
});

/**
 * The only message received is the epub data with its URL
 */
self.addEventListener('message', event => {
  if (!self.zips) {
    self.zips = {};
  }

  self.zips[event.data.hash] = {
    blob: event.data.blob,
    url: event.data.url,
    encryptedItems: []
  };
});

/**
 * Fetch event strategy:
 *  - fetch from cache first
 *  - then fetch from epub zipped data
 *  - add responses to cache
 *  - 404 response if no resource found
 */
self.addEventListener('fetch', event => {
  function shouldHandleFetch(event, opts) {
    const request = event.request;
    const url = new URL(request.url);
    const criteria = {
      matchesPathPattern: opts.zipPattern.test(url.pathname),
      isGETRequest: request.method === 'GET',
      isFromMyOrigin: url.origin === self.location.origin
    };
    const failingCriteria = Object.keys(criteria).filter(function (criteriaKey) {
      return !criteria[criteriaKey];
    });
    return !failingCriteria.length;
  }

  function onFetch(event, options) {
    const request = event.request;
    const zipFileMatch = request.url.match(options.zipPattern);
    if (zipFileMatch && zipFileMatch.length > 0) {
      const hash = zipFileMatch[1];
      const filePath = zipFileMatch[2];
      event.respondWith((async () => {
        try {
          let response;
          response = await fetchFromCache(request);
          if (response == null) {
            response = await getFileInEpub(hash, filePath);
          }
          return addToCache(cacheName(hash), options, request, response);
        } catch {
          return notFoundResponse();
        }
      })());
    }
  }

  if (shouldHandleFetch(event, config)) {
    onFetch(event, config);
  }
});

function getZipResponse(mimeType, arrayBuffer) {
  const init = {
    status: 200,
    statusText: 'OK',
    headers: {
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public',
      'Content-Type': mimeType,
      'Content-Length': arrayBuffer.byteLength
    }
  };
  return new Response(new Blob([arrayBuffer], { type: mimeType }), init);
}

async function getZipFs(epubHash) {
  if (self.zips[epubHash].zip) {
    return self.zips[epubHash].zip;
  }
  self.zips[epubHash].zip = new zip.fs.FS();
  if (self.zips[epubHash].blob) {
    return self.zips[epubHash].zip.importBlob(self.zips[epubHash].blob);
  }
  return self.zips[epubHash].zip.importHttpContent(self.zips[epubHash].url, {
    preventHeadRequest: false,
    useRangeHeader: false,
    forceRangeRequests: false
  });
}

async function getFileInEpub(epubHash, filePath) {
  console.debug(`[BEER-SW] fetching ${filePath} from the epub file`);
  try {
    await getZipFs(epubHash);
  } catch {
    throw new Error('Cannot get zipfs for file');
  }
  const entry = self.zips[epubHash].zip.find(filePath);
  if (!entry) {
    throw new Error(`${filePath} not found in zip file`);
  }
  const data = await entry.getUint8Array();
  const decryptedData = await FileDecryptor.decrypt(self.zips[epubHash], filePath, data);
  return getZipResponse(getMimeTypeFromFileExtension(filePath), decryptedData);
}

function getMimeTypeFromFileExtension(filePath) {
  const fileExtMatch = filePath.match(/\.(\w*)$/);
  if (fileExtMatch && fileExtMatch.length > 1) {
    return mimeTypeMap[fileExtMatch[1].toLowerCase()] || mimeTypeMap.default;
  }
  return mimeTypeMap.default;
}

function cacheName(hash) {
  return `zip-${hash}`;
}

function addToCache(cacheKey, options, request, response) {
  if (response.ok && request.url.match(options.cachePattern)) {
    const copy = response.clone();
    (async () => {
      const cache = await caches.open(cacheKey);
      cache.put(request, copy).catch(console.warn);
    })();
  }
  return response;
}

async function fetchFromCache(request) {
  const response = await caches.match(request);
  if (response) {
    console.debug(`[BEER-SW] fetching ${request.url} from cache`);
    return response;
  }
  return null;
}

function notFoundResponse(error) {
  return new Response(error?.message ?? 'Not found', { status: 404 });
}
