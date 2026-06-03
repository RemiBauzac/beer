import { defineConfig } from 'vite';
import { resolve, join } from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { readFileSync, readdirSync } from 'fs';

const __dirname = new URL('.', import.meta.url).pathname;

const swSources = [
  resolve(__dirname, 'node_modules/@zip.js/zip.js/dist/zip-fs.min.js'),
  resolve(__dirname, 'app/sw/file-decryptor.js'),
  resolve(__dirname, 'app/sw/beer-service-worker.js'),
];

function beerPlugin() {
  return {
    name: 'beer',

    configureServer(server) {
      server.middlewares.use('/beer-service-worker.js', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.end(swSources.map(f => readFileSync(f, 'utf-8')).join('\n'));
      });

      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/epubs/')) {
          try {
            res.end(readFileSync(resolve(__dirname, req.url.slice(1))));
            return;
          } catch { /* fall through to next */ }
        }
        next();
      });
    },

    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'beer-service-worker.js',
        source: swSources.map(f => readFileSync(f, 'utf-8')).join('\n'),
      });

      this.emitFile({
        type: 'asset',
        fileName: 'favicon.ico',
        source: readFileSync(resolve(__dirname, 'app/favicon.ico')),
      });

      const epubsDir = resolve(__dirname, 'epubs');
      for (const file of readdirSync(epubsDir).filter(f => f !== '.gitkeep')) {
        this.emitFile({
          type: 'asset',
          fileName: `epubs/${file}`,
          source: readFileSync(join(epubsDir, file)),
        });
      }
    },
  };
}

export default defineConfig({
  root: '.',
  publicDir: false,
  plugins: [
    beerPlugin(),
    basicSsl({
      name: 'beer',
      /** custom trust domains */
      domains: ['beer.org'],
      ttlDays: 365,
      /** custom certification directory */
      certDir: resolve(__dirname, 'certs'),
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        beer: resolve(__dirname, 'app/beer.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  server: {
    https: true,
    host: 'beer.org',
  },
});
