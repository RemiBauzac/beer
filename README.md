# Beer — Offline EPUB Reader

PWA-first EPUB reader. Reads files locally, works offline via Service Worker.

## Requirements

- Node.js 20+
- npm 10+
- Add `127.0.0.1 beer.local` to `/etc/hosts` for HTTPS dev server

## Install & run

```bash
npm install
npm run dev       # https://beer.local (self-signed cert — accept browser warning)
```

Or via Make:

```bash
make install
make dev
```

## Available commands

| Command       | Description                           |
| ------------- | ------------------------------------- |
| `make dev`    | Dev server at https://beer.local:5173 |
| `make build`  | Production build                      |
| `make test`   | Run tests once                        |
| `make check`  | Typecheck + lint + test (full gate)   |
| `make lint`   | ESLint                                |
| `make format` | Prettier                              |
| `make clean`  | Remove dist, node_modules, caches     |

Run `make help` for full list.

## Tech stack

- React 19 + TypeScript 6 (strict)
- Vite 8 + vite-plugin-pwa (injectManifest)
- Tailwind v4 + shadcn/ui (Nova preset)
- Vitest + @testing-library/react
- Husky + commitlint (Conventional Commits)

## Commit convention

```
feat(scope): short description
fix: short description
```

Types: `feat` `fix` `refactor` `perf` `docs` `test` `chore` `build` `ci` `style`
