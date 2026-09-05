# Repair 3 handoff

## Verification 3 acceptance

Independent verification on 5 September 2026 accepted implementation
`a5c15cba607bbc379bd226a53d8f523af2c724cf` with **PASS**, zero findings, and
zero untested public claims. The reporting SHA was
`c6693012d1dd66890a1537c9c120b493ef275432`; it contains documentation only.

The verifier used fresh live desktop and 390 × 844 phone browsers, ran
`npm ci`, all 18 unit tests, the production build, all 18 E2E tests, and every
one of the ten claim commands separately. It retested normal, invalid,
boundary, local recovery, keyboard, focus, reduced-motion, privacy, legal,
offline, reset, and HTTP-404 paths. The live output was byte-identical to the
clean build for the root, demo, worker, primary JS/CSS, 404 page, and mobile
artwork. Full evidence: `.factory/verification-3.md`.

## Release identity

- Product: Meeple Import Doctor
- Live URL: <https://boardgame-catalog-import-debugger.sociobot.in>
- Implementation SHA: `a5c15cba607bbc379bd226a53d8f523af2c724cf`
- Documentation evidence SHA: `f36413d61336e44988b5784ed289079c6af7b8a0`
- Deployed artifact: clean-clone build of the implementation SHA
- Deployment result: succeeded on 5 September 2026; deployment ID
  `8f3cf36e-48ad-4817-b23c-a47ada918157`

The later documentation commit does not change the deployed application.

## What changed

- Moved **Try it with sample data** and its result above the URL form. At
  390 × 844, the action ends at 472 px and all three facts end at 607 px.
- Made the demo boundary sticky. At the manual JSON report on a phone, the bar
  remains at 8–130 px with **Reset demo** and **Start for real** visible.
- Removed the broad Azure navigation fallback. Physical routes still load, and
  unknown paths now use `404.html` with HTTP 404.
- Added a deployment-shaped local test server. Browser tests now fail if an
  unknown path returns the home page with HTTP 200.
- Added focus and polite announcements for Privacy, Terms, and 404 headings.
- Updated Privacy to name every stored history field: URL, source name,
  diagnosis, extracted title, and inspection time.
- Renamed all WebP artwork with SHA-256 prefixes. The one-year immutable cache
  rule is now safe for returning clients.
- Kept `/demo` and the designed 404 in the offline shell. Unknown offline paths
  use the cached 404 instead of the home page.
- Rewrote legal headings and long policy paragraphs in plain words.

## Review findings

| Finding | Disposition | Evidence |
| --- | --- | --- |
| F-2-1: sample action below phone viewport | Fixed | Fresh live phone: action bottom 472 px in an 844 px viewport. |
| F-2-1: demo banner disappears | Fixed | Fresh live phone at the JSON report: banner top 8 px, bottom 130 px; both controls visible. |
| F-2-2: unknown route returns home with 200 | Fixed | Live `/does-not-exist-repair-3` returns 404 with the designed title and heading. |
| F-2-3: route focus and announcement | Fixed | Privacy, Terms, and live 404 headings receive focus; each updates a polite status region. |
| F-2-4: incomplete storage disclosure | Fixed | Policy lists all five stored fields; the claim test checks the actual stored object shape. |
| F-2-5: immutable unhashed art | Fixed | Every shipped WebP URL contains the first 12 SHA-256 characters; live responses retain immutable caching. |

Review-1 findings B1–B6, C1–C3, and M1 remain fixed. The sample still uses a
separate namespace, all ten claim commands pass, route metadata remains intact,
legal pages keep the shared shell, and the first screen uses plain task words.
The earlier offline-shell and request-cooldown repairs also remain covered.

## Clean-checkout verification

Clean clone: `/tmp/meeple-repair3-final-FbJbUZ` at the implementation SHA.

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 97 packages installed and 0 vulnerabilities reported. |
| `npm test` | Passed: 5 files, 18 tests. |
| `npm run build` | Passed; `dist/index.html` produced. |
| Ten commands in `.factory/claims.json` | Passed individually. |
| `npm run test:e2e` | Passed: 18 browser tests. |
| Local `verify-url.sh` | Passed: 200, title, `lang=en`, one h1, main, alt text, and no console errors. |
| Playwright Axe integration | Zero violations on home, demo, legal, and 404 states. |
| Local Lighthouse mobile | 100 performance, 100 accessibility, 100 best practices, 100 SEO; LCP 1.3 s, CLS 0. |

The production payload remains below budget: main JavaScript is 21.93 kB raw
and 7.87 kB gzip. CSS is 21.01 kB raw and 5.57 kB gzip. The mobile hero is
17.98 kB. There is no downloaded font.

## Live verification

- `/`, `/demo`, `/privacy/`, and `/terms/` return 200 with their own titles.
- An arbitrary unknown route returns 404, `Page not found — Meeple Import
  Doctor`, and `This address was not found.`
- Live `index.html`, `sw.js`, the main JS, CSS, route JS, and mobile art are
  byte-identical to the clean-clone build.
- Fresh 390 × 844 and 1440 × 1000 Chromium contexts were inspected. The first
  screen and the populated demo are legible with no horizontal overflow.
- The live sample shows Lantern Keepers, one missing field, source attribution,
  and copyable manual JSON. Reset recreates it. Start for real deletes only the
  demo key. Seeded ordinary history stays byte-for-byte unchanged.
- The live demo made no third-party request. Fresh home, demo, Privacy, Terms,
  and unknown-route scans each had zero Axe violations.
- A fresh live service-worker install reopened `/demo` offline with its report.
- Live Lighthouse mobile scored 100 in all four categories: FCP 1.0 s, LCP
  1.0 s, TBT 20 ms, CLS 0, and 35 KiB transferred.
- Security headers include CSP, HSTS, `nosniff`, strict-origin referrer policy,
  and camera, microphone, and geolocation restrictions.

## How to verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Run each `test` command in `.factory/claims.json` separately to reproduce the
claim audit. The browser suite starts `tests/static-server.mjs`, which applies
the built Azure routing and response-override configuration.

## Known limits and next steps

- Browser cross-origin rules can hide source responses. Pasting page HTML is
  the local recovery path; the tool does not bypass access controls.
- The tool cannot decide whether a source grants access. Users must follow the
  source terms and robots policy.
- This is a static, local-first product. It has no server-side product state,
  account, payment, analytics, or external AI dependency.
- No known repair finding remains open.
