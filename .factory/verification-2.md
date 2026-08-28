# Independent verification 2 — PASS

**Candidate:** `074c27c7f783f80043d9be84bead518c008d0eb4` (`074c27c`)

**Live URL:** <https://boardgame-catalog-import-debugger.sociobot.in/>

**Verified:** 2026-08-28 UTC from a clean checkout. No product code was
changed during verification.

## Verdict

**PASS — this candidate meets the release acceptance contract.** The earlier
offline-shell and repeated-request failures are repaired. Fresh local and live
checks found no critical, high, or medium defects. Two low-severity follow-ups
are documented below and do not block the product's core diagnostic job.

## Candidate and deployment identity

The checkout began clean on the exact candidate SHA. A fresh `npm ci` and
production build produced files byte-identical to the canonical deployment:

| File | Local and live SHA-256 |
| --- | --- |
| `index.html` | `06117aaec267e9e4d8cf2c1c85653b7afc37722c0f758dbf0831b7d3225fc6b3` |
| `sw.js` | `47a9d4468dcbb984df5dd39363a624fefb4e5b3997a879c08d4110a3992cbfaf` |
| `assets/main-DwqH_NOQ.js` | `9b3c4bbae0bb65bab64c895d413d3e9a076c17ee3eebca17769422a831a52af7` |
| `assets/style-Cm-GnNPu.css` | `d2c616dd5b5e882979cb364ca027d5e084d9f1747bfad68b03d92729c8f252cf` |

This establishes that the tested live application is the candidate's exact
production artifact, not merely a similar source revision.

## Clean repository gates

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 98 packages audited, 0 vulnerabilities |
| `npm test` | Passed; 18/18 tests across five files |
| `npm run build` | Passed; includes `tsc --noEmit`; produced `dist/` |
| `npm run test:e2e` | Passed; 10/10 Playwright tests on desktop and 390 px mobile |
| Lint | No lint script or separate lint configuration exists |

The production payload is comfortably within contract budgets: JavaScript
21,456 B raw / 7.82 kB gzip, CSS 19,570 B raw / 5.26 kB gzip, no web-font
payload, mobile artwork 17,982 B, and desktop artwork 44,290 B.

## End-to-end product evidence

Independent browser checks beyond the committed suite exercised:

- Empty input, an incomplete URL, a `file:` URL, a BoardGameGeek browse URL,
  and a Discogs artist URL. Each retained focus on the field, set
  `aria-invalid`, and provided specific corrective text.
- Fully populated BoardGameGeek HTML: HTTP `200 OK`, all known fields,
  source attribution, normalized preview, healthy diagnosis, and copyable JSON.
- HTTP 200 access-check markup, 404, 410, 429, and 500 responses: respectively
  classified as blocked, not found, not found, rate limited, and source error.
- Pasted Discogs HTML with metadata, a remote image, and executable script:
  parsing remained local, made zero external requests, did not execute the
  script, produced a source-attributed record, and copied valid JSON.
- Pasted markup without a title produced the changed-markup diagnosis and
  showed the failed selectors. The built-in sample produced the missing-field
  diagnosis. A refused request and an independently aborted request produced
  the blocked and unreadable-response recovery paths with paste-HTML guidance.
- Three immediate activations of one direct URL caused exactly one source
  request and displayed the 15-second cooldown guidance. A pre-seeded source
  cookie was absent because requests use `credentials: "omit"`.
- Recent history retained only the newest five of six distinct items. Clear
  moved focus to Undo; Undo restored the entries and focus to Clear history.
- A direct request while offline reported “This device is offline” and gave
  reconnect guidance. The URL remained editable for recovery.

These cases cover the brief's actionable classifications—blocked, missing
field, changed markup, and invalid URL—and the manual-import recovery path.

## Accessibility, responsive behavior, and browser quality

- `/opt/fleet/lib/verify-url.sh` passed locally (HTTP 200 in 573 ms) and live
  (HTTP 200 in 626 ms): valid title and `lang=en`, one `h1`, one `main`, alt
  text, labeled buttons, and no console/page errors.
- Playwright Axe found zero violations in the committed desktop checks and zero
  serious/critical findings in independent local and live 390 px result states.
- Keyboard-only checks reached the skip link first with a visible 3 px focus
  ring, submitted the form with Enter, focused inline errors, focused the
  completed report, and preserved focus through clear/undo recovery.
- At 390 x 844 CSS px, document and viewport widths were both 390 px, the
  primary action was 340 x 52 px, and no visible button, link, or disclosure
  target measured below 44 px in either dimension.
- With `prefers-reduced-motion: reduce`, the maximum computed animation or
  transition duration was 0.01 ms. There is no flashing or uncontrolled
  looping motion in the reduced treatment.
- No console errors, uncaught page errors, failed application assets, or
  third-party first-load requests occurred locally or live.

Lighthouse 12.5.1 mobile-default results:

| Target | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Local production preview | 100 | 100 | 100 | 100 | 1.0 s | 1.1 s | 40 ms | 0 |
| Live deployment | 100 | 100 | 100 | 100 | 0.9 s | 0.9 s | 70 ms | 0 |

The live Lighthouse transfer total was 35 KiB.

## Privacy, security, response, and cache policies

- Initial load requested only same-origin HTML, CSS, JavaScript, and artwork.
  No analytics, tracking, CDN scripts, remote fonts, or cookies were observed.
- Source HTML is not placed in Cache Storage. Pasted HTML stays within the
  browser parser; source scripts and images are inert. Direct source requests
  omit credentials.
- Live responses include CSP with `object-src 'none'`, `base-uri 'self'`, and
  `frame-ancestors 'none'`; HSTS; `X-Content-Type-Options: nosniff`;
  `strict-origin-when-cross-origin`; and camera, microphone, and geolocation
  restrictions.
- Root, Privacy, Terms, robots, and sitemap return the correct 200 response and
  media type. HTML uses `public, must-revalidate, max-age=30` and returned 304
  for a matching ETag. The worker uses `no-cache`. Bundles and artwork use
  one-year immutable caching.
- Privacy and Terms accurately explain local operation, one-at-a-time use,
  source-side connection metadata, the cooldown, and the inability to grant
  robots/terms permission, except for the low-severity history detail below.

## Service-worker and offline evidence

A new live browser profile installed cache
`meeple-doctor-shell-af35862aa206` with eight nonempty entries: the three HTML
routes, favicon, two artwork sizes, hashed JavaScript, and hashed CSS. With the
network disabled, a newly opened page loaded without failed JS/CSS requests and
ran the sample diagnosis. No third-party page appeared in Cache Storage.

For update behavior, a cache named `meeple-doctor-shell-obsolete-test` was
seeded, the registration was removed, and the current worker was reinstalled.
Activation deleted the obsolete product cache and retained only
`meeple-doctor-shell-af35862aa206`; offline operation still worked.

## Defects and follow-ups

### Low — Privacy page incompletely enumerates recent-history fields

The Privacy page says the last five URLs and diagnosis labels are stored on the
device. Actual local storage also includes the extracted title, source name,
and inspection timestamp. In the test, a title supplied only through pasted
HTML appeared in `meeple-doctor:recent:v1`. The raw HTML was not stored and
nothing left the device, so this is a disclosure-precision issue rather than a
data exposure. Either update the disclosure or store only the documented
fields.

### Low — immutable caching is applied to artwork without content hashes

`/art/inspection-bench-900.webp` and `-1536.webp` receive a one-year
`immutable` policy even though their names identify dimensions, not content.
The versioned service worker refreshes these with `cache: "reload"`, which
substantially mitigates staleness, but a no-worker client can retain an old
image after a same-name deployment. Prefer content-hashed artwork names or a
revalidating cache policy.

## Final release assessment

No release-blocking gap remains. The application performs the smallest useful
job end to end, the deployed artifact matches the candidate, the prior offline
failure is fixed, and the documented local, browser, accessibility,
performance, privacy, and deployment gates pass.
