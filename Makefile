.PHONY: install dev build preview test test-watch test-ui e2e e2e-ui lint lint-fix format typecheck check size clean help

# Install dependencies and verify mkcert is available
install:
	npm install
	@command -v mkcert >/dev/null 2>&1 || echo "⚠  mkcert not found — run: brew install mkcert && mkcert -install"

# Start dev server (HTTPS if .certs/ exists, HTTP fallback)
dev:
	npm run dev

# Production build
build:
	npm run build

# Preview production build locally
preview:
	npm run preview

# Run all tests once
test:
	npm run test

# Run tests in watch mode
test-watch:
	npm run test:watch

# Open Vitest UI
test-ui:
	npm run test:ui

# Run Playwright E2E tests
e2e:
	npx playwright test

# Open Playwright UI mode
e2e-ui:
	npx playwright test --ui

# Lint source files
lint:
	npm run lint

# Lint and auto-fix
lint-fix:
	npm run lint:fix

# Format all files with Prettier
format:
	npm run format

# Type-check without emitting
typecheck:
	npm run typecheck

# Full quality gate: typecheck + lint + test
check:
	npm run typecheck && npm run lint && npm run test

# Analyse bundle size
size:
	npx size-limit

# Remove build artefacts and caches
clean:
	rm -rf dist node_modules .vite coverage playwright-report test-results

# Print all targets (default)
help:
	@echo ""
	@echo "  install      npm install + mkcert check"
	@echo "  dev          start dev server"
	@echo "  build        production build"
	@echo "  preview      preview production build"
	@echo "  test         run tests once"
	@echo "  test-watch   run tests in watch mode"
	@echo "  test-ui      open Vitest UI"
	@echo "  e2e          run Playwright E2E tests"
	@echo "  e2e-ui       open Playwright UI"
	@echo "  lint         lint source"
	@echo "  lint-fix     lint + auto-fix"
	@echo "  format       format all files"
	@echo "  typecheck    tsc --noEmit"
	@echo "  check        typecheck + lint + test"
	@echo "  size         analyse bundle size"
	@echo "  clean        remove dist, node_modules, caches"
	@echo ""

.DEFAULT_GOAL := help
