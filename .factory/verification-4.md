# Verification 4 — diagnose a failed catalog import

**Verdict: FAIL.** There are **two minor findings** and **two untested or
incompletely tested public claims**. The product must not be declared PASS until
both are covered by their own declared outcome tests or removed or narrowed.

- Live URL: <https://boardgame-catalog-import-debugger.sociobot.in>
- Candidate reviewed: `69810ec08839b10aa48862aede6e5d8774d944af`
- Documentation SHA: `40e23a740c145254afb118d69de1b58a92be8cd6`
- Checkout SHA: `a6d79468198dab10e104b0296b0e003c0129dfee`
- Reviewed: 5 September 2026 UTC

## Job, audience, and first action

The job is `Fix a failed board-game catalog import`. It is for collectors whose
self-hosted catalog cannot read a public item page. The first action is `Try it
with sample data`; it says that it opens a BoardGameGeek report with one missing
field.

Fresh 1366 × 900 desktop and 390 × 844 phone contexts began at scroll position
zero. On both, the job, audience, action, sample result, and all three facts
were visible before scrolling. Phone content was 390 px wide with no horizontal
overflow. Screenshots are in `/work/.evidence/verify-4-desktop-first-screen.png`
and `/work/.evidence/verify-4-phone-first-screen.png`.

## Demo and user paths

- One click opened `/demo` with the populated Lantern Keepers BoardGameGeek
  report, one missing field, source attribution, and copyable JSON.
- After scrolling to the report on a 390 px phone, the persistent `Demo —
  sample data, nothing is saved to your real history` label and both 44 px
  controls remained visible. Reset restored the sample. Start for real removed
  `demo:meeple-doctor:recent:v1` and preserved a seeded ordinary-history value
  byte-for-byte.
- The whole demo flow made no request outside the product origin. No catalog is
  connected, so it changed no real catalog data.
- An invalid BoardGameGeek browse URL gave the labelled inline recovery error.
  A local pasted-HTML check produced `Pasted HTML · local only` without a
  request. The clean browser-service-worker path reopened `/demo` offline and
  showed Lantern Keepers.
- Keyboard Tab reached the skip link first with a 3 px outline. Enter on the
  URL action produced the invalid-URL error. Privacy navigation focused its h1
  and announced the loaded route. Reduced-motion media matched and the maximum
  computed transition or animation duration was 0.00001 seconds.

## Clean checkout and claim checks

I cloned the declared main branch at `a6d7946`, ran `npm ci`, then ran the
documented commands. `npm ci` installed 97 packages with zero reported
vulnerabilities. `npm test` passed 18 tests in 5 files. `npm run build` passed
and created `dist/`. `npm run test:e2e` was invoked twice, but this verifier's
30-second command wrapper cut off its final summary. To avoid hiding that
limitation, I ran every one of its 18 claim tests separately and ran its nine
non-claim tests together (`9 passed`). Thus all 27 browser tests have direct
passing evidence from the clean checkout.

| Claim id | Separate declared command |
| --- | --- |
| demo-isolation | PASS |
| demo-no-third-party-requests | PASS |
| sample-report-json | PASS |
| request-cooldown | PASS |
| pasted-html-local | PASS |
| pasted-html-memory | PASS |
| recent-five | PASS |
| clear-restore-window | PASS |
| offline-reload | PASS |
| no-account-or-payment | PASS |
| no-product-tracking | PASS |
| source-maps | PASS |
| direct-request-privacy | PASS |
| cooldown-lifetime | PASS |
| direct-source-no-proxy | PASS |
| cache-exclusions | PASS |
| access-and-bulk-boundaries | PASS |
| designed-404 | PASS |

All 18 manifest commands passed separately. Each manifest id has one matching
`@claim:` tag. This does not make the manifest complete or every test complete;
the findings below identify one additional public claim and one unmeasured
quantitative part of a listed claim.

## Live routes, accessibility, and deployment

`verify-url.sh` passed on the live root: HTTP 200, 815 ms load, no page or
console errors, title, `lang=en`, one h1, main landmark, image alt text, and
labelled controls. Fresh Playwright Axe checks returned zero violations on
`/`, `/demo`, `/privacy/`, `/terms/`, and an arbitrary missing route.

| Route | HTTP | Title | Axe violations |
| --- | ---: | --- | ---: |
| `/` | 200 | Meeple Import Doctor — fix failed imports | 0 |
| `/demo` | 200 | Demo — Meeple Import Doctor | 0 |
| `/privacy/` | 200 | Privacy — Meeple Import Doctor | 0 |
| `/terms/` | 200 | Terms — Meeple Import Doctor | 0 |
| `/unknown-verify-4` | 404 | Page not found — Meeple Import Doctor | 0 |

The browser reported the expected failed-resource console line for the 404;
the designed page loaded with its h1 and return link, so this is not a defect.
Robots, sitemap, canonical tags, HTTPS, HSTS, CSP, `nosniff`, referrer policy,
and permissions policy are live. The source-repository link returned HTTP 200;
internal routes and route links worked.

The current live root, 404, privacy, terms, worker, main JavaScript, CSS,
route JavaScript, and checked artwork have the same SHA-256 values as the clean
build of this candidate. No backend is shipped, so tenant isolation, restart
persistence, health checks, server 429/Retry-After behavior, and payment checks
do not apply.

`npx @axe-core/cli` was attempted as required, but its Selenium launcher cannot
find a system Chrome binary in this container. Playwright Axe used the supplied
Chromium and completed all five live route scans. Two Lighthouse attempts also
failed before auditing because the installed browser could not be attached by
the current Lighthouse launcher; this is a verifier-container limitation, not
a product defect. The prior candidate handoff records 100/100/100/100, and the
live bytes match that candidate.

## Earlier findings

| Earlier finding | Current disposition and proof |
| --- | --- |
| Verification 1 offline shell | Fixed. The independent `offline-reload` command passed and live `/demo` reopened offline. |
| Verification 1 direct-request cooldown | Fixed. `request-cooldown` passed independently. |
| Review 1 first-screen clarity | Fixed. Desktop and phone first screens showed the required job, audience, and first action. |
| Review 1 demo route and isolation | Fixed. Direct demo was populated; banner, reset, exit, and separate storage worked. |
| Review 1 claims manifest and metadata/404 | Fixed. All declared commands passed; live routes have metadata and the arbitrary route is HTTP 404. |
| Review 1 plain words and legal skeleton | Fixed. The copy audit includes the repaired lines; legal routes have shared navigation, footer, title, h1, and focus handling. |
| Review 2 phone demo label and 404 | Fixed. The label and controls stayed visible during the phone report; live unknown route is a designed 404. |
| Review 2 legal focus, storage fields, artwork cache names | Fixed. Live Privacy focus/announcement worked; `recent-five` passed; deployed artwork hash matched its immutable filename. |
| Review 3 seven missing claim checks | Fixed. The eight added contract checks, including 404, all passed separately. |
| Review 3 two non-plain lines | Fixed. The built page uses `Checking the item page` and `There is no page at this address.` |

## Finding

### F-4-1 — MINOR: “open-source” is an unlisted and untested public claim

`/terms/` says: `Meeple Import Doctor is free, open-source diagnostic
software.` The repository link is live and returned HTTP 200, but
`.factory/claims.json` has no `open-source` claim and no separately tagged,
outcome-based command that proves this public statement from the documented
clean setup. The existing `no-account-or-payment` claim supports the adjacent
free/no-payment statement; it does not test open-source availability or licence.

This is one untested public claim. Add a focused claim and a clean consumer
test that proves the published source and licence, or remove/narrow
`open-source` from the public terms. No product-code change was made during
this verification.

### F-4-2 — MINOR: the 15-second cooldown claim is not measured by its declared test

The public claim is `One direct request per source every 15 seconds.` Its
declared `@claim:request-cooldown` browser test proves that a rapid second
request is blocked and that pasted HTML stays local, but it accepts any error
text matching `wait about .* seconds`. It never asserts 15 seconds and never
advances time past a 15-second boundary to prove that one new request is then
allowed. A separate untagged unit test happens to contain the 15,000 ms
constant, but it is outside the declared claim command and does not satisfy the
claim contract's required sandbox measurement.

This is one incompletely tested quantitative public claim. Make the declared
tagged test measure the 15-second boundary with an allowed margin and assert
the next request result. Until then the exact public number is untested.
