# Review 3 — diagnose a failed catalog import

**Verdict: FAIL.** This strict review found **2 findings** and **7 untested
public claims**. The implemented diagnosis and demo work end to end, but the
release cannot receive a PASS while public promises are missing from the claims
manifest and public copy breaks the no-metaphor rule.

- Live URL: <https://boardgame-catalog-import-debugger.sociobot.in>
- Implementation reviewed: `a5c15cba607bbc379bd226a53d8f523af2c724cf`
  (`a5c15cb`)
- Documentation baseline: `c6693012d1dd66890a1537c9c120b493ef275432`
  (`c669301`)
- Prior report-only commit: `535dbe884e067def714d36bc90e4dd4a27547aa7`
  (`535dbe8`)
- Reviewed: 5 September 2026 UTC

The application files do not differ between the implementation and
documentation SHAs. The later commits change only `.factory/*` and `README.md`.
The live root, demo, service worker, 404 document, main JavaScript, CSS, route
JavaScript, and mobile artwork were byte-identical to the clean build.

## First screen before scrolling

Fresh 1440 × 1000 desktop and 390 × 844 phone browser contexts started at
scroll position zero.

| Question | Answer shown on both screens |
| --- | --- |
| What is the job? | `Fix a failed board-game catalog import` |
| Who is it for? | `For collectors whose self-hosted catalog cannot read a public item page.` |
| What should I do first? | `Try it with sample data` |
| What happens next? | `Opens a BoardGameGeek report with one missing field.` |

On the phone, the action ended at 472 px and the last of the three facts ended
at 607 px. The document and viewport were both 390 px wide. The same page had
no horizontal overflow after a 200% text-size stress check. Fresh loads made no
third-party request and produced no console or page error.

Screenshots:

- `/work/.evidence/review-3/live-desktop-first-screen.png`
- `/work/.evidence/review-3/live-phone-first-screen.png`
- `/work/.evidence/review-3/live-phone-demo-report.png`

## Demo and real-data boundary

One click opened `/demo` and immediately showed the built-in Lantern Keepers
BoardGameGeek report. It showed synthetic HTTP 200 evidence, four of five known
fields, one missing description, source attribution, and valid copyable manual
JSON.

The persistent banner remained at y=8–130 px after scrolling to the JSON on a
390 × 844 phone. It showed `Reset demo` and `Start for real`. With ordinary
history seeded before entry:

- entering and using the demo left the ordinary value byte-for-byte unchanged;
- Reset recreated Lantern Keepers only in
  `demo:meeple-doctor:recent:v1`;
- Start for real removed the demo key and preserved the ordinary key; and
- the whole demo flow made only same-origin requests.

No real catalog is connected to this static product, and no catalog data was
changed.

## Functional paths

- A complete pasted BoardGameGeek fixture produced the healthy diagnosis, all
  five known fields, source attribution, and normalized JSON. Its embedded
  script did not run, its remote image did not load, and no outside request was
  made.
- Empty text, malformed text, a `file:` URL, a BoardGameGeek browse URL, and a
  Discogs artist URL each kept focus on the URL field, set `aria-invalid`, and
  gave a specific recovery instruction.
- Pasted markup without a title produced the changed-markup diagnosis, zero of
  five fields, attempted selectors, and a manual recovery record.
- Intercepted direct 200, 403, 404, 429, 500, and connection-refused responses
  produced the expected importable, blocked, not-found, rate-limited,
  source-error, and unreadable-response results. Source cookies were omitted.
- Six completed local checks retained the newest five. Clear moved focus to
  `Restore recent checks`; Undo restored five entries and returned focus to
  `Clear history`.
- A fresh service worker cached the exact shell and reopened `/demo` offline
  with the populated report. Reinstalling it removed a seeded obsolete product
  cache.

This covers the brief's blocked, missing-field, changed-markup, and invalid-URL
classifications, plus the manual JSON recovery path. The product has no backend,
tenant, health endpoint, product database, or server rate limiter, so backend
tenant isolation, restart persistence, and `Retry-After` checks do not apply.
The browser's direct 429 diagnosis was exercised.

## Clean-checkout evidence

The clean worktree was pinned to `c669301`; its application files match
`a5c15cb`.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 97 packages installed; 98 audited; 0 vulnerabilities |
| `npm test` | PASS — 18 tests in 5 files |
| `npm run build` | PASS — TypeScript check and `dist/` output |
| Every command in `.factory/claims.json`, separately | PASS — 10 of 10 |
| `npm run test:e2e` | PASS — 18 Playwright tests |
| Local `verify-url.sh` | PASS — 528 ms; no errors; required structure present |
| Live `verify-url.sh` | PASS — 790 ms; no errors; required structure present |

Every declared claim id occurs in exactly one test tag. The production build is
well below its static budgets: 22,892 bytes total raw JavaScript, 21,014 bytes
raw CSS, 17,982-byte mobile art, and no web font.

Live Lighthouse mobile scored 100 for performance, accessibility, best
practices, and SEO. FCP and LCP were 0.9 s, TBT was 0 ms, CLS was 0, and total
transfer was 36 KiB. The JSON result is
`/work/.evidence/review-3/lighthouse.json`.

## Accessibility, privacy, routes, and links

- Axe found zero violations on home, demo, Privacy, Terms, and a missing route.
- Tab reached the skip link first with a 3 px focus ring. Enter submitted the
  form, invalid input regained focus, disclosures opened with Space, and a
  completed report received focus.
- Under `prefers-reduced-motion: reduce`, no visible element had an animation
  or transition longer than 1 ms.
- Home, demo, Privacy, and Terms returned 200 with their own title, one h1,
  `lang=en`, a main landmark, and a footer. Internal links returned their
  expected status. The source repository returned 200; BoardGameGeek returned
  200; Discogs deliberately returned 403 to the automated client rather than a
  broken address.
- An arbitrary unknown path returned the designed page with HTTP 404, title
  `Page not found — Meeple Import Doctor`, a focused h1, a polite announcement,
  and a working home link. Chromium's expected console line for the deliberate
  404 is not a defect.
- The live CSP, HSTS, `nosniff`, referrer policy, and camera, microphone, and
  geolocation restrictions are present. No third-party fonts or scripts load.
- The social image is 1200 × 630, the touch icon is 180 × 180, and hashed art
  retains immutable caching.

The deterministic parser is the right fit for this job. An AI step would not
make the source evidence more reliable, so no missed AI feature was found.

## Findings

### F-3-1 — BLOCKING: seven public promises are absent from the claims contract

All ten declared claim commands pass, but `.factory/claims.json` is not a
complete inventory of visitor-facing promises. The following seven distinct
promises appear in public policy, help, or legal copy without a matching claim
entry and complete tagged test:

| Untested claim | Public wording | Gap in current tests |
| --- | --- | --- |
| UC-1 tracking and collection | Privacy says the tool works without analytics, cookies, advertising, or server history; collects no personal data or usage events; and does not profile users. Noscript says `No data is sent to us.` | The demo request test checks outside origins only. It does not assert cookies, same-origin analytics or ingest requests, stored identifiers, or the profiling statement. |
| UC-2 pasted-HTML retention | `Pasted page HTML stays in memory only while the page is open. It is not saved in recent checks.` | `pasted-html-local` checks requests and script execution. `recent-five` checks one local-storage record shape. Neither checks all browser stores, caches, or reload lifetime. |
| UC-3 seven-second restore | `You can clear recent checks from home and restore them for seven seconds.` | No manifest entry or tagged timer-bound test exists. The control worked manually in this review. |
| UC-4 cooldown lifetime | `The cooldown stays in memory and disappears when the page closes.` | The cooldown test checks repeated requests in one page only. It does not close or reload the page and prove the budget resets. |
| UC-5 no product proxy or logging | `Meeple Import Doctor does not proxy, log, or receive that request.` | `direct-request-privacy` proves omitted source credentials, not the wider no-proxy/no-log/no-receive promise. Logging cannot be proved from the browser and must be narrowed or backed by an appropriate testable policy. |
| UC-6 cache exclusion | `It does not cache source pages or pasted HTML.` | The offline test proves app assets exist and run. It does not assert that source URLs and pasted content are absent from Cache Storage. This review observed that absence, but the declared claim command does not enforce it. |
| UC-7 access and bulk boundaries | Terms says the tool does not verify robots permission, bypass authentication or anti-bot controls, bulk scrape, or redistribute marketplace data. | No manifest entry or tagged absence test covers these product boundaries. |

There is also an unlisted but tested README promise: unknown routes return a
designed HTTP 404. The full E2E suite proves it, so it is not included in the
untested count, but the claims contract still requires it to be listed and
tagged as its own claim.

This finding blocks PASS even though the observed implementation currently
behaves consistently with most of these statements. Add manifest entries with
one exact tag each and complete clean-demo tests, or remove/narrow statements
that cannot be tested.

### F-3-2 — MINOR: two public lines break the plain-words rule

- The loading h2 is `Following the evidence…`. It is a mood line rather than a
  heading that names the current operation.
- The 404 body says `The inspection bench has no page at this address.` It uses
  the product's visual metaphor instead of plain instructions.

The attached contract says public headings must name their section and public
copy must not use metaphor or brand lore. Use direct text such as `Checking the
item page` and `There is no page at this address.` The current copy audit lists
the loading line without flagging it and omits the 404 body sentence, so its
zero-flag conclusion is incomplete.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Verification 1: offline shell omitted JS/CSS | Fixed — fresh live offline `/demo` loaded with nonempty JS/CSS cache entries. |
| Verification 1: no direct-request cooldown | Fixed — the tagged test passed and a second request was held. |
| Review 1 B1 | Fixed — job and audience are in both initial viewports. |
| Review 1 B2 | Fixed — isolated `demo:` storage, persistent label, reset, and exit all worked without changing ordinary history. |
| Review 1 B3 | Fixed — direct `/demo` is populated and titled `Demo — Meeple Import Doctor`. |
| Review 1 B4 | Fixed — the manifest exists and every declared command runs. F-3-1 is a new completeness failure. |
| Review 1 B5 | The original landing/README claims are covered. F-3-1 records newly identified policy/legal omissions and the unlisted README 404 promise. |
| Review 1 B6 | Fixed — route metadata is present and a missing path returns the styled HTTP 404. |
| Review 1 C1–C3 | The cited jargon, action, and README issues are fixed. F-3-2 identifies two remaining lines under the stricter no-metaphor rule. |
| Review 1 M1 | Fixed — legal pages share navigation, footer, Demo link, attribution, and build label. |
| Review 2 F-2-1 | Fixed — sample action/facts are before phone scroll and the demo controls stay visible at the JSON. |
| Review 2 F-2-2 | Fixed — arbitrary unknown paths return the designed HTTP 404. |
| Review 2 F-2-3 | Fixed — legal and 404 headings receive focus and are announced. |
| Review 2 F-2-4 / Verification 2 low | Fixed — Privacy lists all five stored recent-history fields. |
| Review 2 F-2-5 / Verification 2 low | Fixed — artwork names contain verified SHA-256 prefixes under immutable caching. |

## Required next review

1. Reconcile every public promise with `.factory/claims.json`; run each new
   command separately from a clean checkout.
2. Replace the two non-plain lines and update `.factory/copy-audit.md` to cover
   the 404 sentence.
3. Repeat the live demo boundary, privacy/cache, accessibility, and 404 checks.

No product code was changed during this review.
