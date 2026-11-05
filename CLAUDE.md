# TechBytes

Static workshop site; no build step. Open `index.html` in a browser. See `README.md` for the layout.

## Structure
- `index.html` – visitor-facing landing page listing the 10 workshops. New workshops are appended at the end; never renumber.
- `workshops/NN-name/` – `index.html` (embeds `slides/index.html` in an iframe in `#talk`), `slides/index.html`, `manuscript.html`, `code/` (code must match the page character for character).
- `assets/` – shared `style.css`, `site.js`, `deck.js`/`deck.css`, per-workshop `NN-name-hero.js`. Per-workshop CSS is an appended block with prefix `wN-`.
- `.nojekyll` – GitHub Pages serves `main` as-is at https://peterpanduro.github.io/Techbytes/. Links stay relative and case-exact.

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
- Landing page (`index.html`) is for visitors: no status tags, no scheduling or timeline text.
- Lab budget: ~50–65 hand-typed lines (code + commands); the card states the exact count.
- Anything not run while authoring is marked on the page ("not run in the authoring environment").
- Prerequisite versions appear only on workshop pages, as "<Tool> X.Y or later"; one floor per tool across workshops, equal to the version the lab was verified with. The landing page names tools, not versions.
- No time-relative wording ("yesterday", "this year"); state versions and dates.
- Spell out each acronym or shorthand name at its first use on a page, e.g. "Request for Comments (RFC)". Strict in manuscripts: the first spoken use expands it. Elsewhere titles, short labels and code may stay short; expand at the first sentence that uses the term, in both student and instructor views.
- "Talk about it" blocks are instructor-only: `<p class="inst-only">`. Nothing students need may live only inside one.
- Every lab code block says where it goes in `data-where`: "new file x", "add to x" (with its position when it matters), "replace x" or "terminal". Other places get a plain short name, such as "browser". Output blocks say where the output appears.
- No named parts of the day ("afternoon", "morning") for the session; say "the workshop" or "the lab".
