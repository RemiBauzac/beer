# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install deps
npm run dev          # start HTTPS Vite dev server
npm run build        # production build → dist/
npm run preview      # serve dist/ locally (HTTPS)
npm run lint         # eslint with autofix (skips app/lib/)
```

No test suite exists.

**HTTPS required for service workers.** `@vitejs/plugin-basic-ssl` auto-generates a self-signed cert. On first run, trust it in your browser/OS trust store (download from the lock icon in the URL bar).

## Architecture

BEER is a browser-only ePub reader. No backend. The entire epub parsing and file serving happens in a Service Worker.

### Data flow

1. `main.js` calls `Beer.init()` → registers the SW (`app/sw/install.js`)
2. `Beer.withBookUrl(url)` sends `{hash, url}` message to SW via `postMessage`
3. SW stores the epub reference in `self.zips[hash]`
4. Main thread fetches epub internals via `fetch('/___/<hash>/<path>')` — SW intercepts these requests, reads from the zip (via `@zip.js/zip.js`), optionally decrypts, caches, and returns responses
5. `beer.js` parses `META-INF/container.xml` → OPF → builds `Book` model → selects display mode

### Build pipeline

Vite produces two bundles from `app/`:
- `dist/main.js` — entry point, wires `Beer` to DOM, keyboard controls
- `dist/beer.js` — `Beer` class + models + display classes (importable as a library)

The service worker (`dist/beer-service-worker.js`) is built by a custom Vite plugin (`beerPlugin` in [vite.config.js](vite.config.js)) that concatenates three files in order:
1. `node_modules/@zip.js/zip.js/dist/zip-fs.min.js` — zip library (exposes `zip` global)
2. `app/sw/file-decryptor.js` — `FileDecryptor` class (uses `zip` global)
3. `app/sw/beer-service-worker.js` — SW event handlers (uses `zip` and `FileDecryptor`)

So `app/sw/beer-service-worker.js` is hand-concatenated, not ES-module aware — no `import`/`export`. The same plugin also serves `/beer-service-worker.js`, `/epubs/*`, and copies `favicon.ico` during build.

`app/lib/dom-to-json.js` is a tiny native DOM→object converter (replaces vendored x2js). Attributes map to `_attrName`, text content to `__text`, multiple same-tag children collapse to arrays.

### Key modules

| Path | Role |
|------|------|
| `app/beer.js` | `Beer` class — public API: `init()`, `withBookUrl()`, `displayBook()` |
| `app/model/book.js` | `Book` — metadata, spine items, fixed vs reflowable layout |
| `app/model/opf.js` | Parses OPF XML → metadata + spine |
| `app/model/encryption.js` | Parses `encryption.xml` → per-item algorithm + key |
| `app/sw/beer-service-worker.js` | SW: fetch intercept, zip extraction, cache strategy |
| `app/sw/file-decryptor.js` | Font deobfuscation (IDPF XOR, Adobe XOR) |
| `app/display/base.js` | Base display class — theme, zoom, margin constants |
| `app/display/page.js` | Paginated display (default) |
| `app/display/scroll.js` | Scroll display |
| `app/display/fixed.js` | Fixed-layout display |

### URL convention

Epub file requests use path `/___/<sha1-hash>/<internal-epub-path>`. The SW matches `zipPattern: /___\/(\w+)\/(.*)$/` to identify and serve these.

### Epub access modes

SW supports two modes for epub access (see `getZipFs`):
- **Blob mode**: epub fetched upfront, passed as blob via `postMessage` — `zip.importBlob(blob)`
- **Range-request mode**: epub URL passed, SW fetches lazily with HTTP range requests — `zip.importHttpContent(url, {useRangeHeader: true})`

Currently `main.js` uses range-request mode (sends URL only, no blob).

### Display options

```js
{
  mode: 'page' | 'scroll' | 'fixed',  // fixed auto-selected for fixed-layout epubs
  columnCount: 1 | 2,
  margin: Number,   // px
  theme: 'auto' | 'light' | 'night',
  ratio: Number,    // zoom ratio
  cfi: String       // optional EPUB CFI to restore position
}
```

Keyboard shortcuts: `←/→` prev/next, `↑/↓` zoom, `1/2` columns, `M/m` margin, `t` toggle theme, `a` auto theme.
