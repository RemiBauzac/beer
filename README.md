# BEst Epub Reader

BEER is an ePub reader prototype, based on recent javascript technologies:
* Service workers: to get ePub content directly
* ES Modules
* Arrow functions


## Before start

You need to have
* A working node/npm env

## Start Beer

```
#beer> make install
#beer> make dev
```

This builds and starts the app on a local HTTPS Vite dev server.

To allow the service worker to be loaded, you need to add the auto-generated localhost certificate to your system (or browser) trust store.
You can download the certificate from your browser (on the left side of the URL bar).

## Docker

```
#beer> make docker-build   # build image (runs npm build inside)
#beer> make docker-run     # serve on :80 / :443 (beer.local)
#beer> make docker-stop    # stop and remove container
```

Add `beer.local` to your `/etc/hosts` and trust the self-signed certificate generated during `docker-build`.
