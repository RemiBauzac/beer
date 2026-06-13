.PHONY: install dev build preview lint clean help

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-16s %s\n", $$1, $$2}'

node_modules:
	npm install

dev: node_modules
	grep -q "beer.org" /etc/hosts || echo "127.0.0.1     beer.org" | sudo tee -a /etc/hosts
	npm run dev

build: ## Production build → dist/
	npm run build

preview: ## Serve dist/ locally over HTTPS
	npm run preview

lint: ## Run ESLint with autofix
	npm run lint

clean: ## Remove dist/
	rm -rf dist/ node_modules/