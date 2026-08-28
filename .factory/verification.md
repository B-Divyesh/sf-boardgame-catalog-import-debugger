# Independent verification — FAIL

**Candidate:** `71f623128f3e77a01463101c451632250d346926` (`71f6231`)

**Live URL checked:** <https://boardgame-catalog-import-debugger.sociobot.in/> on 2026-08-28. This is an independent verifier report; no product code was changed.

## Verdict

**FAIL — do not promote this candidate unchanged.** The normal online inspector is functional, but its shipped service worker does not provide the offline reload it claims to provide. A first offline reopen loads only the cached HTML and artwork; the app JavaScript and stylesheet fail to load, so the inspector is inert. This fails the PWA/offline-reload acceptance check and contradicts the Privacy page's statement that the application shell can reopen offline.

## Reproducible evidence

### Clean local candidate

The worktree was clean at the candidate SHA before verification.

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 98 packages audited, 0 vulnerabilities |
| `npm test` | Passed: 14/14 unit tests |
| `npm run build` | Passed: `tsc --noEmit` and Vite production build |
| `npm run test:e2e` | Passed: 8/8 Playwright journeys (desktop and 390 px) |
| `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 .factory/qa-evidence` | Passed: HTTP 200; 574 ms; no console/page errors; title, `lang`, one `h1`, main landmark, and image alt present |
| Lighthouse 12.5.1, mobile defaults | Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP/LCP 1.0 s, TBT 0 ms, CLS 0 |

Production build output is within static budgets: JavaScript 20,888 B raw (7,600 B gzip), CSS 19,421 B raw (5,250 B gzip), no font payload, and mobile hero WebP 17,982 B.

### End-to-end behavior exercised

Fresh Playwright checks covered normal and recovery paths beyond the committed suite:

- Invalid empty, malformed, `file:`, BoardGameGeek browse, and Discogs artist inputs each gave the appropriate inline error and retained the field for correction.
- A fully populated intercepted BoardGameGeek response produced the healthy diagnosis, status `200 OK`, selector evidence, normalized preview, JSON, and source attribution. A source cookie pre-seeded in the browser was **not** present on the request (`credentials: omit`).
- Intercepted 404, 429, 500, and the committed-suite 403 responses rendered, respectively, not-found, rate-limit, request-failed, and blocked diagnoses.
- Pasted hostile-looking HTML containing an image and script made **zero** external requests and did not execute it; the string was rendered as text.
- At 390 px: `scrollWidth === clientWidth === 390`; Inspect URL height was 52 px. Live first-tab focus reached the skip link with a visible 3 px amber outline. `prefers-reduced-motion` reduces animation duration to 0.01 ms.
- Axe found zero serious or critical violations on local and live pages; no console/page errors were observed in these checks.

### Live deployment identity, privacy, and policies

The deployed root HTML SHA-256 is identical to `dist/index.html`: `8591fb93ffd0656074d7fb2a71c87cb724b526c457f1ec23cc24f416270b93c6`. Both deployed hashed asset bodies equal the local build:

- `main-DnrIaYMz.js`: `888fdf2383a0d0e3ced95358cfdadeb3faea1c0767e038e01f30694553795cda`
- `style-BOKQy-SZ.css`: `6758298a2e3c98456620e6750c5a0bd6eb70bacde5d7f48106277a4c09e73f8e`

The live page returned HTTP 200, loaded only same-origin assets on first load, and had no console/page errors. It sends the configured CSP, `nosniff`, strict-origin cross-origin referrer policy, camera/microphone/geolocation Permissions-Policy, and HSTS. Hashed JS/CSS and artwork use `public, max-age=31536000, immutable`; `sw.js` uses `no-cache`; HTML uses a 30-second revalidation cache. No analytics or third-party first-load request was observed. The direct inspector intentionally permits one user-requested HTTP(S) connection, omits credentials, and pasted HTML stays local.

### Offline/service-worker check — failed

1. Start the built preview in a **new browser context** and load `/` once online. Wait for `navigator.serviceWorker.ready`; do not perform a second online navigation.
2. Cache inspection shows only `/`, `/privacy/`, `/terms/`, favicon, and the two artwork files in `meeple-doctor-shell-v1`.
3. Set the context offline and open `/` in a new page.
4. The page's static `h1` appears, but requests for `/assets/style-BOKQy-SZ.css` and `/assets/main-DnrIaYMz.js` fail with `net::ERR_FAILED`. Clicking “Open a sample diagnosis” leaves `#report` hidden: the app is not running.

An additional online reload first does populate the runtime cache, after which an offline reload happens to work. That does not satisfy a first offline reopen of the claimed precached shell.

## Defects

### High — service-worker shell is not actually offline-functional on first reopen

`public/sw.js` precaches only the HTML routes, favicon, and artwork. It omits the hashed `/assets/main-*.js` and `/assets/style-*.css` required for the app. The cache-first handler cannot retrieve those assets offline, leaving a static, nonfunctional form. Precache the generated JS/CSS as part of a versioned asset manifest and test a fresh-context offline reopen before any controlled online reload.

### Medium — no enforcement of the brief's rate-limit/robots constraint

The UI warns users and diagnoses 429 responses, which is useful, but it has no per-source cooldown, rate limiter, or robots policy check. In an intercepted test, three sequential activations of the same URL issued three source requests. The researched brief requires respecting robots.txt, rate limits, and source terms; the terms page delegates this entirely to the user. Add a clear local cooldown/rate policy and an honest robots/terms limitation or implementation before claiming compliance.

## Recommended next verification

After the service-worker manifest/cache version is fixed, rerun the clean install/build/test commands above and verify both (a) a fresh-context first offline reopen can operate the sample inspector and (b) an updated service worker receives a new cache version and does not serve stale same-named shell assets.
