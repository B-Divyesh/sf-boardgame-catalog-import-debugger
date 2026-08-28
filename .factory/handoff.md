# Repair handoff — perfection loop 1

## Delivered

Repair commit `eed682a` resolves every blocking item in review `6f56e84`.

- The first mobile screen now says what the tool does, who it is for, and what
  each first action produces. It keeps the midnight restoration-bench art and
  typography rather than replacing the product with a generic template.
- `Try it with sample data` opens `/demo` in one click. `/demo`, `/demo/`, and
  `?demo=1` load the Lantern Keepers report immediately, set `Demo — Meeple
  Import Doctor`, show the persistent demo banner, and use only
  `demo:meeple-doctor:recent:v1`. Reset recreates the sample; Start for real
  removes that key and returns home.
- `.factory/claims.json` declares ten visitor-facing claims. Each has a tagged
  browser test. `.factory/demo.md` describes the entry point, sample, reset,
  and storage boundary.
- Home, demo, legal, and 404 shells have titles, canonical/OG/Twitter metadata,
  favicon, Apple touch icon, and a 1200×630 WebP social image derived from the
  product art. The Azure configuration rewrites actual 404s to the styled
  `404.html`; sitemap includes `/demo`.
- Privacy and Terms now share the header/footer and legal links. Mobile keeps a
  visible Demo link, 44px actions, stacked facts, and no horizontal overflow.
- Added the verb-first catalog description and a copy audit. README now links
  directly to the sandbox and claim evidence.

## Verification evidence

Fresh clean clone: `/tmp/meeple-clean-final-0unOmf` from commit `eed682a`.

| Check | Result |
| --- | --- |
| `npm ci` | passed; 0 vulnerabilities reported |
| `npm test` | passed: 5 files, 18 tests |
| `npm run build` | passed; generated `dist/` with root `index.html` |
| `npm run test:e2e` | passed: 16 Playwright tests, including Axe checks, keyboard, mobile, privacy, offline, and route checks |
| Every command in `.factory/claims.json` | passed individually in that clean clone (10 claim entries) |
| `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4174/ /tmp/meeple-verify-ZoOeDh` | passed: HTTP 200, title, `lang=en`, one h1, main, all image alt text, no console errors |
| Mobile screenshot | reviewed at `/tmp/meeple-verify-ZoOeDh/screenshot-mobile.png`; no overflow and the full first task path is visible |
| Lighthouse mobile | performance 100, accessibility 100; LCP 1.0 s, CLS 0 from `/tmp/meeple-lighthouse.json` |

Build payloads: JavaScript 22.54 kB raw / 8.10 kB gzip; CSS 20.87 kB raw /
5.52 kB gzip; mobile hero 18 kB. This is below the static product budgets.

## Deployment and known gaps

The artifact remains Vite + TypeScript static output in `dist/`, configured for
Azure Static Web Apps. Deployment is triggered by the work-order repository
push to `main`; no infrastructure, DNS, billing, or deployment secret was
changed in this repository.

No known blocking findings remain. The local Vite preview server does not apply
Azure `responseOverrides`, so browser coverage loads `/404.html` directly; the
production 404 response is configured in `public/staticwebapp.config.json`.
