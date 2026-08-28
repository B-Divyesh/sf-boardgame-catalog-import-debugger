# Meeple Import Doctor

Meeple Import Doctor explains why a public board-game, record, or other item URL
produces no metadata in a self-hosted catalog. It shows the request outcome,
recognized source, successful and failed selectors, a normalized preview, and a
copyable source-attributed JSON record.

Live product: <https://boardgame-catalog-import-debugger.sociobot.in>

## Who it is for

Collectors and maintainers diagnosing opaque imports from BoardGameGeek,
Discogs, and similar public item pages. The tool is intentionally for one item
at a time: it does not collect credentials, bypass access controls, or bulk
scrape sources.

## How it works

1. Paste a complete item URL.
2. The browser makes one direct request with credentials omitted. To reduce
   accidental repeat traffic, direct requests have a 15-second per-source (or
   generic-host) in-memory cooldown. If the source permits cross-origin reads,
   the response is inspected immediately.
3. If CORS or another browser control hides the response, open the item page and
   paste its HTML source. That fallback is parsed entirely on the device.
4. Review HTTP evidence, detected fields, attempted selectors, diagnosis, and
   recovery steps. Copy the normalized JSON if a manual import is useful.

BoardGameGeek and Discogs have tailored parsing plans. Unknown sources fall back
to standards-based Open Graph, JSON-LD, and document metadata. Recent history is
limited to five URLs in local storage; page HTML and extracted metadata are not
persisted. See [privacy/index.html](privacy/index.html) for the full policy.

## Develop

Requirements: Node.js 20+ and npm.

```sh
npm install
npm run dev
```

Vite prints the local development URL. No environment variables or external
services are required.

## Test and build

```sh
npm test          # parser, URL, and diagnosis unit tests
npm run build     # exact production command; writes dist/
npm run test:e2e  # Playwright journeys and Axe accessibility scans
npm run test:all  # all of the above
```

Playwright is pinned to 1.58.2. If its Chromium binary is not already available,
run `npx playwright install chromium` once.

The static deployment root is `dist/`, with `dist/index.html` at its root.
`public/staticwebapp.config.json` supplies Azure Static Web Apps security and
cache headers. During each production build, Vite writes a versioned service
worker manifest with the exact hashed JavaScript and CSS shell assets, so a
fresh offline reopen works after one online visit. It never caches inspected
third-party pages.

## Project map

- `src/sources.ts` — strict URL/source recognition
- `src/parser.ts` — pluggable field plans and safe DOM/JSON-LD extraction
- `src/diagnosis.ts` — failure classification and next steps
- `src/app.ts` — request lifecycle, report rendering, copy, and local history
- `.factory/design.md` — visual system and original art provenance
- `tests/` — unit, browser, mobile, keyboard, and accessibility coverage

## Limitations

A static site cannot override a source's CORS policy. An unreadable browser
response is reported as a transport block, not falsely treated as a missing
item. Pasted HTML is the deterministic fallback. Dynamic content that exists
only after a source's scripts run may not be present in “view source”; the
selector trace makes that limitation visible.

## License

[MIT](LICENSE). Source names and any inspected metadata remain subject to their
respective owners' terms.
