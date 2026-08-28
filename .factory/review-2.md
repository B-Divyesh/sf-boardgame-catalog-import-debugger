# Adversarial first-read review 2

**Product:** Meeple Import Doctor  
**URL reviewed:** <https://boardgame-catalog-import-debugger.sociobot.in>  
**Date:** 2026-08-28  
**Verdict: FAIL**

The live product makes its job and audience clear, and its demo really is
isolated. It still has two blocking failures: the safe try-out is below the
initial phone screen and loses its banner while the report is used; arbitrary
unknown routes return the ordinary home page with HTTP 200 instead of the
designed 404. Three additional findings remain.

## Cold first read

Fresh Chromium contexts at 390 × 844 and 1440 × 1000, before scrolling:

| Question | Phone | Desktop |
| --- | --- | --- |
| What does it do? | Fixes a failed board-game catalog import. | The same. |
| For whom? | Collectors with a self-hosted catalog that cannot read an item page. | The same. |
| What should I click first? | Enter an item URL, then `Inspect my URL`; the sample action is not visible. | `Try it with sample data`; its result is visible. |

The phone hero says `Fix a failed board-game catalog import` and `For
collectors whose self-hosted catalog cannot read a public item page.` Review-1
B1 is fixed. No console error or third-party first-load request occurred.

## Findings

### F-2-1 (review-1 B2) — BLOCKING: the demo is not persistently identifiable, and its try-out control is below the first phone screen

- **Quote/location:** Home hero `Try it with sample data`; demo banner `Demo —
  sample data, nothing is saved to your real history.`
- **Evidence:** At 390 × 844, the sample button begins at y=863.2 px, below the
  initial viewport. After activation, `/demo` scrolls to the sample report
  (report top 85 px), but the banner is at document top and absent from view.
  Its CSS is `position: relative`, not sticky or fixed. The report can be used
  without seeing the notice, `Reset demo`, or `Start for real`.
- **Why this loses a first-time visitor:** Someone without a URL cannot see the
  safe no-setup path before scrolling. Once the report opens, they cannot see
  that it is sample data or reset/leave the sandbox without finding the hero.
  Storage isolation is fixed, but the required visible first action and
  persistent sandbox boundary are only half-fixed.
- **Concrete fix:** Put `Try it with sample data` and `Opens a BoardGameGeek
  report with one missing field.` next to or above the real action at 390 px.
  Keep the banner sticky while the report is in use. Add a mobile test for
  first-viewport button visibility and post-scroll banner visibility.

### F-2-2 (review-1 B6) — BLOCKING: an unknown URL is served as a successful home page, not the designed 404

- **Quote/location:** Live `GET /does-not-exist` returned HTTP `200`, title
  `Meeple Import Doctor — fix failed imports`, and h1 `Fix a failed board-game
  catalog import`.
- **Evidence:** `/404.html` is designed correctly, but a fresh browser
  navigation to an arbitrary missing path returned the home document. The live
  `navigationFallback` rewrites unmatched paths to `/index.html`, so its 404
  response override never gets a missing route.
- **Why this loses a first-time visitor:** A mistyped or shared bad address
  appears to be a valid empty checker. The address bar is not reliable.
- **Concrete fix:** Serve unknown non-app paths with HTTP 404 rewritten to
  `/404.html`; reserve fallback only for known app routes. Test an arbitrary
  deployed path for HTTP 404, the 404 title, and `This address was not found.`

### F-2-3 — MAJOR: legal and 404 route changes do not move focus to their new h1

- **Quote/location:** `/privacy/` h1 `Privacy, without fine print.`; `/terms/`
  h1 `Use the tool with care.`; `/404.html` h1 `This address was not found.`
- **Evidence:** Fresh browser navigation left `document.activeElement` at
  `BODY` for every one of these routes. `/demo` focuses `#page-title`, but the
  legal and 404 documents have no focus target or route-change announcement.
- **Why this matters:** Keyboard and screen-reader users are not placed at or
  told the new page’s main heading.
- **Concrete fix:** Make each h1 focusable, focus it on load, and announce the
  page change with a polite live region. Test header navigation to Privacy,
  Terms, and the 404 page.

### F-2-4 — MINOR: privacy omits fields that ordinary history actually stores

- **Quote/location:** Privacy says: `The last five inspected URLs and their
  diagnosis labels are stored in your browser’s local storage.`
- **Evidence:** `src/app.ts` stores each item’s `url`, `source`, `diagnosis`,
  `title`, and `at` timestamp. A title supplied only through pasted HTML is
  retained. This matches the unaddressed low-severity prior verification note.
- **Why this matters:** The policy’s on-device list omits title, source label,
  and inspection time.
- **Concrete fix:** Disclose all five fields or store only the fields currently
  disclosed; add a storage-shape privacy assertion.

### F-2-5 — MINOR: unhashed artwork is immutable-cached for one year

- **Quote/location:** `public/staticwebapp.config.json` sets `/art/*` to
  `Cache-Control: public, max-age=31536000, immutable`. Live artwork names are
  `/art/inspection-bench-900.webp` and `-1536.webp`, with no content hash.
- **Evidence:** A no-service-worker client can retain old art after a same-name
  deployment. This is also unaddressed from the prior verification.
- **Why this matters:** Visual changes can remain stale for returning visitors.
- **Concrete fix:** Content-hash artwork URLs or use revalidating cache headers,
  and verify deployed headers in the release test.

## Demo, sandbox, and privacy

`/demo` and `/?demo=1` enter the demo. Lantern Keepers appears immediately with
BoardGameGeek attribution, synthetic 200 evidence, four detected fields, one
missing description, and copyable manual JSON. In a fresh live context seeded
with ordinary `meeple-doctor:recent:v1`, demo activity wrote only
`demo:meeple-doctor:recent:v1`; Reset preserved ordinary data; Start for real
removed only demo data. Request logging recorded only same-origin URLs. The
demo’s data boundary is correct; F-2-1 is its presentational boundary failure.

## Claims audit

From a fresh clone of `3be87a5`, after `npm ci` and `npm run build`, every
listed claim command passed:

| Claim id | Result |
| --- | --- |
| `demo-isolation` | PASS |
| `demo-no-third-party-requests` | PASS |
| `sample-report-json` | PASS |
| `request-cooldown` | PASS |
| `pasted-html-local` | PASS |
| `recent-five` | PASS |
| `offline-reload` | PASS |
| `no-account-or-payment` | PASS |
| `source-maps` | PASS |
| `direct-request-privacy` | PASS |

`npm test` passed 18/18, `npm run build` produced `dist/`, and the full
`npm run test:e2e` suite passed 16/16. Claim-like landing and README sentences
map to these entries: demo storage, no third-party demo request, sample JSON,
cooldown, local HTML, five-item history, offline, no account/payment, source
maps, and credential-less direct requests. No additional unlisted visitor
claim was found.

## Copy audit

Counts treat hyphenated terms, product names, and URLs as one word. The tables
cover all landing readable copy, including conditional status copy, and every
README prose sentence. No sentence exceeds 22 words. No banned marketing word,
inconsistent core term, or non-result button was found. `HTTP`, `JSON`, and
`parser` occur only in the necessary technical result/help path.

### Landing page

| Words | Copy |
| ---: | --- |
| 3 | Board-game catalog checks |
| 6 | Fix a failed board-game catalog import |
| 11 | For collectors whose self-hosted catalog cannot read a public item page. |
| 6 | Sample data uses separate browser storage. |
| 7 | Runs offline after one online visit. |
| 4 | No account or payment. |
| 3 | Item page URL |
| 4 | Waiting for a URL |
| 4 | Inspect my URL |
| 5 | Checks one public item page. |
| 8 | One direct request per source every 15 seconds. |
| 9 | Paste page HTML if the browser cannot read it |
| 2 | Page HTML |
| 4 | optional · stays on this device |
| 7 | How do I copy page source? |
| 8 | Open the item page in a desktop browser. |
| 7 | Press Ctrl + U, select all, and copy. |
| 8 | This tool parses pasted text in your browser. |
| 5 | Try it with sample data |
| 9 | Opens a BoardGameGeek report with one missing field. |
| 7 | Check one public item page at a time. |
| 3 | Inspection in progress |
| 3 | Following the evidence… |
| 4 | Requesting one public page. |
| 5 | How a URL check works |
| 5 | Check each import step |
| 7 | Check whether the item page responded |
| 8 | See the response status, page type, and timing. |
| 8 | Check which page format was found |
| 7 | BoardGameGeek and Discogs use tailored detail checks. |
| 5 | Other pages use page metadata. |
| 6 | Check which details were missing |
| 10 | Open technical details to see what the parser looked for. |
| 7 | Copy the details that were found |
| 9 | Preview a manual JSON record with its source page. |
| 2 | Browser history |
| 3 | Recent URL checks |
| 3 | No recent checks. |
| 8 | Up to five recent URLs stay in this browser. |
| 3 | Recent checks cleared. |
| 3 | Restore recent checks |
| 9 | Find the missing detail in one failed catalog import. |
| 5 | Built by Param Factory · build 074c27c7 |
| 10 | Meeple Import Doctor needs JavaScript to parse page source locally. |
| 6 | No data is sent to us. |

### README

| Words | Copy |
| ---: | --- |
| 21 | Meeple Import Doctor helps board-game and record collectors check why a public item page did not import into a self-hosted catalog. |
| 15 | It is for a collector who has one failed URL and needs a readable report. |
| 18 | Open the sample demo to see a BoardGameGeek report with one missing field and a manual JSON record. |
| 8 | Open a public item URL in the checker. |
| 14 | Inspect the report or paste page HTML when the browser cannot read the page. |
| 12 | Copy the manual JSON record if it helps repair the catalog entry. |
| 6 | The sample uses separate browser storage. |
| 6 | It makes no third-party request. |
| 9 | The app can reopen offline after one online visit. |
| 7 | It has no account or payment controls. |
| 8 | The tested promise list is in `.factory/claims.json`. |
| 8 | The direct demo URL is `/demo` (also `/?demo=1`). |
| 12 | It loads the shipped Lantern Keepers sample into the `demo:meeple-doctor:recent:v1` local-storage namespace. |
| 8 | The banner offers Reset demo and Start for real. |
| 15 | Starting real discards the demo namespace; the demo never reads or writes ordinary recent history. |
| 7 | See `.factory/demo.md` for the sandbox details. |
| 6 | Node.js 20+ and npm are required. |
| 12 | `npm run build` writes the Azure Static Web Apps artifact to `dist/`. |
| 5 | Playwright is pinned to 1.58.2. |
| 12 | If needed, install its Chromium binary with `npx playwright install chromium`. |
| 17 | Run each command in `.factory/claims.json` after `npm ci` to verify every visitor-facing claim from its clean demo state. |

## Structure and visual identity

Home, demo, privacy, terms, and `/404.html` have title, one h1, description,
canonical, Open Graph/Twitter data, favicon, Apple-touch icon, header/footer,
and skip link. Internal links crawled successfully; the BoardGameGeek and
source-code links are explicit external links. `robots.txt` and `sitemap.xml`
exist. The midnight restoration-bench art, lamplight/pine palette, editorial
display type, and evidence trail are distinct and match `.factory/design.md`.
No valuable AI or sync feature implied by the brief is absent: copyable manual
JSON is the appropriate recovery/export step, and no decorative AI/key is used.

## Earlier-finding retest

- **B1:** Fixed: the phone screen names job and audience.
- **B2:** Partially fixed: data isolation/reset/start-real pass, but F-2-1
  repeats its first-screen and persistent-banner requirement.
- **B3:** Fixed: `/demo`, `/demo/`, and `?demo=1` enter demo with the title.
- **B4/B5:** Fixed: manifest and all ten listed claim tests pass.
- **C1/C2/C3:** Fixed: copy is concise and actions name results.
- **B6:** Partially fixed: metadata and `/404.html` exist, but F-2-2 repeats
  the live unknown-route failure.
- **M1:** Fixed: legal pages share header/footer and Demo link.

## What would make this perfect

Keep the sample action and sandbox controls visible on a phone, serve a real
unknown-route 404, focus/announce each route heading, disclose exact history
fields, and version artwork URLs.
