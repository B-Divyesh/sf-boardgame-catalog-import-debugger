# Meeple Import Doctor — independent verification 2 handoff

## Independent release verdict — PASS

Candidate `074c27c7f783f80043d9be84bead518c008d0eb4` was independently
verified on 2026-08-28 UTC from a clean checkout and against
<https://boardgame-catalog-import-debugger.sociobot.in/>. The deployed HTML,
service worker, JavaScript, and CSS are byte-identical to the fresh production
build. **PASS: no critical, high, or medium defects were found.**

Fresh verification passed `npm ci` (0 vulnerabilities), 18/18 unit tests, the
TypeScript production build, 10/10 committed Playwright journeys, additional
normal/boundary/error/recovery probes, local and live semantic smoke checks,
desktop and 390 px mobile Axe checks, privacy/network inspection, and live
offline/update exercises. Lighthouse mobile defaults scored 100 in all four
categories locally and live; live FCP/LCP were 0.9 s, TBT 70 ms, CLS 0, with a
35 KiB transfer total. The live cache contained all eight shell files with
nonempty bodies; first offline reopen and obsolete-cache cleanup both passed.

Two non-blocking low-severity follow-ups remain: Privacy does not enumerate the
locally stored title/source/timestamp fields, and stable artwork filenames are
served with `immutable` caching. Exact evidence, hashes, scenarios, and
recommended actions are in `.factory/verification-2.md`.

## Release result

Release blockers from `.factory/verification.md` are repaired. The artifact
remains a Vite + TypeScript static web app whose deployment root is `dist/`.

## Failure reproduced and root causes

The rejected SHA `71f623128f3e77a01463101c451632250d346926` was built in a
separate clean worktree. Its `sw.js` cached six routes/static files but omitted
`main-DnrIaYMz.js` and `style-BOKQy-SZ.css`. After one online visit and no
online reload, an offline page produced two `net::ERR_FAILED` errors and the
sample report stayed hidden.

Repeated regression runs exposed two related edge cases beyond the independent
report:

1. Install-time requests could race the first page's conditional HTTP-cache
   requests, creating Cache API entries with empty bodies.
2. Azure/Vite responses use `Vary: Origin`; the service worker's install
   request and a page subresource request can have different `Origin` headers,
   causing a valid precache entry to miss.

## Repairs

- The Vite build now generates `dist/sw.js` after bundle emission and precaches
  the exact hashed JavaScript and CSS alongside the HTML routes and original
  artwork.
- Install requests use `cache: 'reload'`, and same-origin cache lookup ignores
  the hosting-only `Vary: Origin` difference. Cached JS/CSS response bodies are
  verified as non-empty before the offline journey begins.
- The cache ID fingerprints the URL and bytes of every shell file. A same-name
  HTML or artwork change therefore creates a new version; activation removes
  only obsolete `meeple-doctor-shell-*` caches, not unrelated origin caches.
- Direct source requests retain the 15-second per-source/host cooldown from the
  first repair. Regression coverage proves repeated clicks produce one request,
  pasted HTML makes no external request or script execution, and source cookies
  are omitted.
- Keyboard focus coverage now includes the visible 3 px skip-link ring. Footer,
  source, selector, and recovery links meet the 44 px touch-target baseline.
- The tracked deployment `.env` was removed and is ignored. No runtime secrets
  or environment variables are required.

## Focused regression coverage

- `tests/e2e/app.spec.ts`: a fresh browser context installs the worker once,
  asserts hashed JS/CSS entries have non-empty bodies, goes offline, opens a new
  page, and runs the sample without a failed app-asset request or page error.
- The offline test passed **8/8 consecutive repetitions** with two workers after
  the cache revalidation and `Vary` fixes.
- `tests/unit/shell-version.test.ts`: cache versions are order-stable and change
  when a same-named shell file's bytes change.
- A local update exercise seeded `meeple-doctor-shell-obsolete`, unregistered
  and reinstalled the worker, confirmed only `meeple-doctor-shell-af35862aa206`
  remained, then ran the sample from a new offline page.

## Clean verification — 2026-08-28 UTC

Exact clean sequence:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Results:

- Install: 98 packages audited, 0 vulnerabilities.
- Unit/integration: **18/18** Vitest tests passed across five files.
- Production type-check/build: passed; `dist/index.html` exists at the static
  root. JS is 21,456 B raw / 7.82 kB gzip and CSS is 19,570 B raw / 5.26 kB
  gzip, below the 200 kB and 50 kB budgets. No font payload ships.
- Browser matrix: **10/10** Playwright journeys passed, covering desktop,
  390 px mobile, keyboard, source failure/cooldown, local parsing, hostile
  pasted markup, credential omission, privacy/terms, Axe, and offline reopen.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173
  .factory/qa-evidence`: HTTP 200 in 531 ms; zero console/page errors; valid
  title, `lang=en`, one `h1`, one `main`, image alt, and labeled buttons.
- Lighthouse 12.5.1 mobile defaults: Performance **100**, Accessibility **100**,
  Best Practices **100**, SEO **100**; FCP 0.9 s, LCP 0.9 s, TBT 0 ms, CLS 0.
- Reduced-motion audit: maximum animation/transition duration 0.01 ms. Mobile
  audit: zero horizontal overflow; visible task controls meet 44 px targets.
- First load makes only same-origin requests and has no analytics or third-party
  scripts. Source fetches use `credentials: 'omit'`; inspected third-party HTML
  is never put in Cache Storage.

## Artifact identity before deployment

- Cache: `meeple-doctor-shell-af35862aa206`
- `dist/index.html` SHA-256:
  `06117aaec267e9e4d8cf2c1c85653b7afc37722c0f758dbf0831b7d3225fc6b3`
- `dist/sw.js` SHA-256:
  `47a9d4468dcbb984df5dd39363a624fefb4e5b3997a879c08d4110a3992cbfaf`
- `main-DwqH_NOQ.js` SHA-256:
  `9b3c4bbae0bb65bab64c895d413d3e9a076c17ee3eebca17769422a831a52af7`
- `style-Cm-GnNPu.css` SHA-256:
  `d2c616dd5b5e882979cb364ca027d5e084d9f1747bfad68b03d92729c8f252cf`

Deployment target: Azure Static Web App
`sf-boardgame-catalog-import-debugger` in resource group `sociobot`, production
environment, served at
`https://boardgame-catalog-import-debugger.sociobot.in/`.

## Deployment and live verification

- Repair commit `01067e8` was pushed to `origin/main` before deployment.
- `swa deploy ./dist --env production --app-name
  sf-boardgame-catalog-import-debugger --resource-group sociobot` completed
  successfully and reported Azure endpoint
  `https://purple-dune-0748a100f.7.azurestaticapps.net`.
- The canonical live HTML, worker, hashed JavaScript, and hashed CSS SHA-256
  values exactly match the local production artifact listed above.
- Live URL smoke check: HTTP 200 in 654 ms with zero console/page errors and all
  semantic checks passing. The response includes CSP, HSTS, `nosniff`, strict
  origin referrer policy, and camera/microphone/geolocation restrictions.
- Fresh live Playwright context: zero console errors, page errors, external
  first-load requests, or Axe violations. Cache
  `meeple-doctor-shell-af35862aa206` contained all eight shell entries with
  non-empty bodies; a new offline page ran the sample with no failed app assets.
- Live update exercise removed a seeded obsolete product cache, retained only
  the current version, and ran the sample after reinstall and offline reopen.
- Live 390 px/reduced-motion check: zero horizontal overflow, 52 px primary
  action, visible 3 px skip-link focus ring, and 0.01 ms maximum motion. Three
  direct activations yielded one request, sent no source cookie, and displayed
  the 15-second cooldown guidance.

## Known limitations

A static browser client cannot authoritatively retrieve and interpret every
source's `robots.txt` through CORS. The UI and policies state that limitation,
enforce a local request cooldown, and make no claim that the tool grants source
access. No release-blocking gap is known.
