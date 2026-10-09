# TechBytes

Static workshop site; no build step. Open `index.html` in a browser. See `README.md` for the layout.

## Structure
- `index.html` – year plan (10 workshops). New workshops are appended at the end; never renumber.
- `workshops/NN-name/` – `index.html`, `slides/index.html`, `manuscript.html`, `code/` (code must match the page character for character).
- `assets/` – shared `style.css`, `site.js`, `deck.js`/`deck.css`, per-workshop `NN-name-hero.js`. Per-workshop CSS is an appended block with prefix `wN-`.

## Commands
```bash
cd workshops/02-totp/code && deno test
```
```bash
cd workshops/09-oauth/code && deno test --allow-net=127.0.0.1 --allow-env && deno lint
```
```bash
cd workshops/10-ci/code && go vet ./... && go test ./...
```
```bash
GOTOOLCHAIN=go1.27.2 go run golang.org/x/vuln/cmd/govulncheck@v1.8.0 ./...
```
```bash
node --check assets/10-ci-hero.js
```

## Rules
- Lab budget: ~50–65 hand-typed lines (code + commands); the card states the exact count.
- Anything not run while authoring is marked on the page ("not run in the authoring environment").
- No time-relative wording ("yesterday", "this year"); state versions and dates.
