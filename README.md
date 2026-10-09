# TechBytes workshop series

A static site: open `index.html` in a browser, no server needed.

- `index.html` – the year plan: ten workshops in order, typed-line budgets.
- `workshops/03-passwords`, `04-https`, `05-git`, `06-compose`, `07-kubernetes`, `08-observability`, `09-oauth`, `10-ci` – workshops 3–10, same layout: `index.html`, `slides/`, `manuscript.html`, `code/`.
- `workshops/01-docker/index.html` – workshop 1, Containers from the ground up (Go, built inside Docker): prep pack, talk, lab, solution, instructor notes, with a layer-cache widget.
- `workshops/01-docker/code/` – the final Dockerfile, the two intermediate ones, `.dockerignore`, `go.mod`, `main.go`.
- `workshops/02-totp/index.html` – workshop 2, TOTP from scratch (Deno / TypeScript): prep pack, 15-minute talk, 90-minute lab, full solution, instructor notes.
- `workshops/02-totp/code/` – the lab files exactly as tested (`deno test` passes all RFC 4226 / RFC 6238 vectors).
- `workshops/*/slides/index.html` – the 10-slide deck for the talk (arrow keys; `S` for speaker view with manuscript, timer and next slide; `F` fullscreen; `T` dark; two open windows stay in sync).
- `workshops/*/manuscript.html` – the word-for-word script with per-slide timing; printable.
- `assets/` – shared stylesheet and scripts (site, deck, cache widget).

Interactive bits: the live TOTP widget at the top of the workshop page (WebCrypto in the browser), an Instructor / Student view toggle (student view hides speaker notes and instructor-only notes), checkpoint tick-boxes and a lab clock that highlights the current step, all remembered per browser. Copy buttons on every code block.

To add a workshop, copy `workshops/02-totp/` to a new folder, keep the `<link>`/`<script>` paths, and add a card and link on `index.html`.
