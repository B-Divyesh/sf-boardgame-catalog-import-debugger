# Meeple Import Doctor — build handoff

## Shipped

- A production Vite + vanilla TypeScript static application for diagnosing one
  public catalog item URL at a time.
- Strict BoardGameGeek and Discogs URL recognition plus a generic public-page
  fallback.
- One-request direct inspection with credentials omitted, a 12-second timeout,
  and explicit handling for offline, browser/CORS block, HTTP block/rate limit,
  not-found, failed request, changed markup, missing fields, and healthy pages.
- A deterministic pasted-HTML fallback that parses entirely in the browser and
  is never persisted or transmitted by this application.
- Field-level evidence for title, year, creators/artists, cover image, and
  description, including JSON-LD and every attempted CSS selector.
- A normalized, source-attributed preview and copyable manual-import JSON.
- Local-only recent history (five URLs), clear with seven-second undo, a
  synthetic sample report, responsive 390 px layout, and full keyboard flow.
- Privacy and terms pages, CSP/security/cache headers for Azure Static Web Apps,
  a same-origin-only service worker, sitemap, favicon, MIT license, and complete
  README.
- An original cinematic inspection-bench hero generated for this product. The
  1536 px WebP is 44 KB and the 900 px mobile version is 18 KB. Full prompt,
  source PNG, model/date, review criteria, and provenance are recorded in
  `.factory/design.md` and `assets/src/`.

## Run and verify

```sh
npm install
npm test
npm run build
npm run test:e2e
```

The required production command is exactly `npm run build`; output lands in
`dist/`, with `dist/index.html` at its root.

Verification on 2026-08-28:

- `npm test`: 14/14 unit tests passed across URL recognition, extraction, and
  diagnosis classification.
- `npm run test:e2e`: 8/8 Playwright journeys passed across desktop and 390 px
  mobile, including Axe checks, no horizontal overflow, 44 px targets, keyboard
  operation, invalid URL, direct HTTP block, pasted HTML, sample report, history,
  and legal pages.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 .factory/evidence`: HTTP
  200, 525 ms local load, zero console/page errors, title and `lang` present,
  one h1, main landmark, zero missing image alt text, zero unlabeled buttons.
- Lighthouse 12.5.1, mobile defaults: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; LCP 0.9 s, FCP 0.9 s, CLS 0, total blocking time 0 ms.
- Production assets: 20.9 KB JavaScript, 19.4 KB CSS, no font payload, and 18 KB
  mobile / 44 KB desktop hero WebP. These are raw, pre-gzip sizes.
- `npm audit`: zero known vulnerabilities at handoff.

## Known limits

- A static browser application cannot override a source's CORS policy. The app
  identifies that transport boundary and guides the user to paste page source;
  it does not claim that an unreadable response means the item is absent.
- Some source content is rendered only after publisher JavaScript executes and
  therefore may be absent from “view source.” Failed-selector evidence makes
  this visible, but the v1 does not run third-party scripts.
- Source markup changes over time. Parser plans are isolated in `src/parser.ts`
  so maintainers can update selectors without changing the request or report UI.
- No live third-party URL is used in automated tests; deterministic fixtures and
  intercepted HTTP responses avoid rate-limit and terms-of-service problems.

## Suggested next steps

1. Add anonymized, user-contributed HTML fixtures when real source markup changes.
2. Add parsers for additional catalog sources only after reviewing their terms
   and robots policies.
3. Consider a separately deployed, rate-limited first-party fetch service only
   if direct CORS failures prove too confusing; it is intentionally outside this
   static v1 and must never become an anti-bot bypass.
