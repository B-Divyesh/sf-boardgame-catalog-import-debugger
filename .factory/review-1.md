# Adversarial first-read review 1

**Product:** Meeple Import Doctor  
**URL reviewed:** https://boardgame-catalog-import-debugger.sociobot.in  
**Date:** 2026-08-28  
**Verdict: FAIL**

The release has several blocking failures: the first phone screen does not say
who the tool is for, the advertised sample is not an isolated demo, the required
claims manifest is absent, and `/demo` is not a demo route. The visual treatment
is product-specific rather than a generic SaaS template, and the basic local
test suite passes; those observations do not offset the blockers.

## Cold first read

Tested in new Chromium contexts at 390 x 844 and 1440 x 1000 before scrolling.

- **What it does:** I infer that it diagnoses why a public-page URL did not
  import metadata into a catalog and can produce manual JSON.
- **For whom:** I cannot determine this from the first phone screen. It never
  names collectors, people with self-hosted catalogs, or a comparable audience.
- **What to click first:** `Inspect URL` is the visually primary action, but it
  requires a URL. `Open a sample diagnosis` is lower down and does not say it is
  a safe try-out.

### B1 — BLOCKING: the first screen fails the “for whom” requirement

- **Quote:** `SOURCE-NEUTRAL IMPORT DIAGNOSTICS`; `Find where your catalog
  import went dark.`; `Inspect one public item URL.`
- **Why this loses a first-time visitor:** “source-neutral,” “catalog import,”
  and “public item URL” do not identify a user or their situation. The audience
  only appears later in the footer (`collectors who run their own catalogs`),
  below the fold at 390 px. A visitor cannot answer all three required cold-read
  questions within the first screen.
- **Concrete fix:** Replace the hero with `Fix a failed board-game catalog
  import` and `For collectors whose self-hosted catalog cannot read a public
  item page.` Place `Try it with sample data` beside `Inspect my URL`, with
  `See a BoardGameGeek import with one missing field.` as the immediate result.

## Demo and sandbox check

Clicking `Open a sample diagnosis` did immediately produce a plausible
BoardGameGeek report for “Lantern Keepers,” including request evidence, fields,
a missing description, and JSON. This is useful sample content, but it is not a
compliant demo.

### B2 — BLOCKING: sample data is written into real history and has no demo controls

- **Quote:** `Open a sample diagnosis →`; landing copy: `Your recent URLs stay
  in this browser.`
- **Evidence:** In a fresh context I seeded the ordinary key
  `meeple-doctor:recent:v1` with a real inspection, then clicked the sample
  control. The same key changed from one real record to a list headed by
  `Lantern Keepers`. No `demo:` key was created. The resulting screen contained
  no `Demo — sample data, nothing is saved` banner, `Reset demo`, or `Start for
  real` control.
- **Why this misleads:** A sample run changes the same recent-history area that
  holds real use. There is no visible boundary or reset, so a visitor cannot
  tell sample state from their data.
- **Concrete fix:** Make the first-screen control `Try it with sample data` and
  enter a `?demo=1` or `/demo` mode. Store only `demo:*` data in that mode,
  never read or write ordinary history, show the required persistent banner,
  add `Reset demo` and `Start for real`, and test that a seeded real key is
  byte-for-byte unchanged after all demo actions.

### B3 — BLOCKING: the advertised demo URL is not implemented

- **Quote / evidence:** Loading `/?demo=1`, `/demo`, and `/demo/` returns the
  ordinary empty landing state: no report, banner, reset control, or demo title.
  `/demo` has the home title, `Meeple Import Doctor — diagnose silent catalog
  imports`.
- **Why this misleads:** A reviewer, catalog entry, or bookmarked visitor cannot
  enter the try-out directly or distinguish it from real use.
- **Concrete fix:** Implement a real direct demo route and set
  `Demo — Meeple Import Doctor` as its title. Put that URL in the README and
  `.factory/demo.md`; add a fresh-context Playwright journey for it.

### Sandbox and privacy exercise

Network interception during the sample flow observed only same-origin document,
art, JavaScript, and CSS requests; it did not observe a third-party request.
That is a positive observation, but it is not an accepted privacy proof because
there is no claims entry or tagged test. Offline was not accepted as a demo
claim: there is no demo entry point or isolated demo state to exercise.

## Claims audit

### B4 — BLOCKING: `.factory/claims.json` is missing

- **Quote / evidence:** `find` and `rg` found no `.factory/claims.json`, no
  `.factory/demo.md`, and no `@claim:` test tag.
- **Why this matters:** The visitor is asked to rely on privacy, storage,
  request-limit, parser, and sample behavior, but no manifest connects those
  promises to observable clean-state tests. There were therefore no listed
  claim tests to run from a clean clone; this is a missing required artifact,
  not a zero-claim product.
- **Concrete fix:** Add a manifest entry and exactly one tagged clean-demo test
  for every retained claim. At minimum cover demo isolation, no third-party
  sample requests, copied JSON, five-item history, the 15-second direct-request
  limit, local HTML parsing, and offline reload. Remove a promise if it cannot
  be tested.

### B5 — BLOCKING: the following live claim-like sentences are unlisted

All of these have no claims entry because the manifest does not exist. Each
needs its own entry/test or removal/rewording.

| Location | Exact live claim | Observable test to add |
| --- | --- | --- |
| hero | `Inspect one public item URL.` | Demo input produces a report for the shipped public-item sample. |
| hero | `See the request, the selectors, the missing fields, and a manual record you can actually use.` | Demo asserts request evidence, selector detail, missing field, and valid copied JSON. |
| input help | `One direct request per source every 15 seconds.` | Two requests to the same source prove the second is held for the stated period. |
| fallback | `Browser blocked the request? Paste page HTML instead` | A blocked request plus pasted sample produces local parsing. |
| guardrail | `No login, no bulk scraping, no bypasses.` | Browser flow has no credential field; test one-item request and no evasion path. |
| guardrail | `Your recent URLs stay in this browser.` | Intercept requests and assert history is local-only; test storage scope. |
| method | `See HTTP status, response type, timing, and whether the browser itself blocked access.` | Demo and forced-block tests assert each displayed evidence field. |
| method | `BoardGameGeek and Discogs get tailored field maps; other pages use safe metadata.` | Separate shipped fixture tests for both tailored maps and generic metadata. |
| method | `Every field shows what matched and every selector the parser tried.` | Fixture asserts displayed match and attempted selectors for every field. |
| method | `Preview the normalized item, then copy a source-attributed manual JSON record.` | Clipboard assertion validates normalized JSON and source attribution. |
| recent | `Your last five URLs will appear here on this device.` | Six completed inspections assert five stored and no network storage request. |
| footer | `Original AI-generated environmental artwork · no analytics` | Provenance can be documented; add a network test for the no-analytics portion. |

The README repeats unlisted visitor-facing claims, including `The browser makes
one direct request with credentials omitted.`, `That fallback is parsed entirely
on the device.`, `Recent history is limited to five URLs in local storage; page
HTML and extracted metadata are not persisted.`, `No environment variables or
external services are required.`, `...a fresh offline reopen works after one
online visit.`, and `It never caches inspected third-party pages.` Add matching
manifest entries/tests or remove them.

## Copy audit

Word counts treat hyphenated terms and URLs as one word. The landing table
includes visible headings, labels, and controls as well as prose, so no
first-read text is skipped. No landing string exceeds 22 words. `*` marks copy
that is jargon, vague out of context, a non-result button, inconsistent wording,
or an unlisted claim; proposed changes follow the tables.

### Landing page

| Words | Text |
| ---: | --- |
| 3* | Source-neutral import diagnostics |
| 7* | Find where your catalog import went dark. |
| 5* | Inspect one public item URL. |
| 16* | See the request, the selectors, the missing fields, and a manual record you can actually use. |
| 3 | Item page URL |
| 4 | Waiting for a URL |
| 2 | Inspect URL |
| 7* | BoardGameGeek, Discogs, or another public item page. |
| 8* | One direct request per source every 15 seconds. |
| 8* | Browser blocked the request? Paste page HTML instead |
| 5* | Not ready with a URL? |
| 4* | Open a sample diagnosis |
| 7* | No login, no bulk scraping, no bypasses. |
| 7* | Your recent URLs stay in this browser. |
| 7* | A readable trace, not another black box |
| 8* | Four answers in the order you need them. |
| 4* | Did the page answer? |
| 13* | See HTTP status, response type, timing, and whether the browser itself blocked access. |
| 4* | Was the source recognized? |
| 12* | BoardGameGeek and Discogs get tailored field maps; other pages use safe metadata. |
| 3* | Which selectors failed? |
| 11* | Every field shows what matched and every selector the parser tried. |
| 4* | What can I recover? |
| 11* | Preview the normalized item, then copy a source-attributed manual JSON record. |
| 2* | Local workbench |
| 2 | Recent inspections |
| 3 | No recent inspections. |
| 10* | Your last five URLs will appear here on this device. |
| 9* | Transparent diagnostics for collectors who run their own catalogs. |
| 6* | Original AI-generated environmental artwork · no analytics |

### README prose

| Words | Sentence |
| ---: | --- |
| 20* | Meeple Import Doctor explains why a public board-game, record, or other item URL produces no metadata in a self-hosted catalog. |
| 20* | It shows the request outcome, recognized source, successful and failed selectors, a normalized preview, and a copyable source-attributed JSON record. |
| 14* | Collectors and maintainers diagnosing opaque imports from BoardGameGeek, Discogs, and similar public item pages. |
| 22* | The tool is intentionally for one item at a time: it does not collect credentials, bypass access controls, or bulk scrape sources. |
| 5 | Paste a complete item URL. |
| 9* | The browser makes one direct request with credentials omitted. |
| 15* | To reduce accidental repeat traffic, direct requests have a 15-second per-source (or generic-host) in-memory cooldown. |
| 11* | If the source permits cross-origin reads, the response is inspected immediately. |
| 18* | If CORS or another browser control hides the response, open the item page and paste its HTML source. |
| 8* | That fallback is parsed entirely on the device. |
| 11* | Review HTTP evidence, detected fields, attempted selectors, diagnosis, and recovery steps. |
| 10* | Copy the normalized JSON if a manual import is useful. |
| 7* | BoardGameGeek and Discogs have tailored parsing plans. |
| 12* | Unknown sources fall back to standards-based Open Graph, JSON-LD, and document metadata. |
| 18* | Recent history is limited to five URLs in local storage; page HTML and extracted metadata are not persisted. |
| 8 | See privacy/index.html for the full policy. |
| 6 | Vite prints the local development URL. |
| 8* | No environment variables or external services are required. |
| 7 | Playwright is pinned to 1.58.2. |
| 14 | If its Chromium binary is not already available, run npx playwright install chromium once. |
| 13 | The static deployment root is dist/, with dist/index.html at its root. |
| 13 | public/staticwebapp.config.json supplies Azure Static Web Apps security and cache headers. |
| 30* | During each production build, Vite writes a versioned service worker manifest with the exact hashed JavaScript and CSS shell assets, so a fresh offline reopen works after one online visit. |
| 6* | It never caches inspected third-party pages. |
| 9* | A static site cannot override a source's CORS policy. |
| 17* | An unreadable browser response is reported as a transport block, not falsely treated as a missing item. |
| 6* | Pasted HTML is the deterministic fallback. |
| 24* | Dynamic content that exists only after a source's scripts run may not be present in “view source”; the selector trace makes that limitation visible. |

### C1 — Major: copy uses unexplained debugger jargon and vague headings

- **Quotes and replacements:**
  - `Source-neutral import diagnostics` → `Check why an item page did not import`.
  - `Find where your catalog import went dark.` → `Fix a failed catalog import.`
  - `See the request, the selectors...` → `See what the page returned, which details were found, and what is missing.`
  - `A readable trace, not another black box` → `Check each import step`.
  - `Did the page answer?` → `Check whether the item page responded`.
  - `Was the source recognized?` → `Check which item page format was found`.
  - `Which selectors failed?` → `Check which page details were missing` (keep the technical selectors under a disclosure).
  - `What can I recover?` → `Copy the details that were found`.
  - `Local workbench` → `Recent URL checks`.
- **Why this matters:** “selector,” “HTTP,” “field map,” “trace,” and
  “source-neutral” assume the visitor already knows browser-parser vocabulary.
  Several headings cannot be understood as a screen-reader heading list.

### C2 — Major: the sample control is neither result-naming nor clear

- **Quote:** `Not ready with a URL? Open a sample diagnosis →`
- **Why this matters:** It does not tell a visitor that it loads sample data or
  what will appear. The primary control needs a URL, while the risk-free path is
  visually secondary.
- **Concrete fix:** `Try it with sample data` with adjacent text `Opens a
  BoardGameGeek report with one missing field.` In demo mode use `Reset demo`;
  replace contextual `Undo` with `Restore recent inspections`.

### C3 — Major: README contains two over-length sentences and dense technical language

- **Quote:** `During each production build... one online visit.` (30 words)
  **Rewrite:** `After one online visit, the app can reopen offline. The cached
  shell uses versioned files from the build.`
- **Quote:** `Dynamic content that exists... limitation visible.` (24 words)
  **Rewrite:** `Some pages fill in details with scripts. Those details may not
  appear in copied page source. The report shows this limitation.`
- **Additional rewrite:** `If CORS or another browser control hides the
  response...` → `If the browser cannot read the page, paste its page source.`
  Put `CORS` in optional help rather than the task path.

## Structure and routing

### B6 — BLOCKING: required metadata and a designed 404 are missing

- **Evidence:** Home, Privacy, and Terms have one `h1`, language, descriptions,
  favicon, and sensible titles. However, all three omit canonical, Open Graph,
  Twitter-card, and Apple-touch metadata. `/missing-route` responds `200` with
  the ordinary home page rather than a designed 404. `/demo` also responds `200`
  with the ordinary home page and title.
- **Why this matters:** Shared links have no product preview, canonical indexing
  is undefined, a mistyped address appears to be a legitimate empty inspector,
  and a required direct demo link silently fails.
- **Concrete fix:** Add per-route canonical, OG/Twitter title/description/image
  and an Apple-touch icon. Add a styled 404 that says the address was not found
  and links home. Make `/demo` a real route and list it in the sitemap.

### M1 — Minor: legal pages lack the required shared footer and navigation

- **Evidence:** `/privacy/` and `/terms/` have a header and main content but no
  footer, product one-liner, Privacy/Terms pair, Param Factory attribution, or
  build/version identifier. The home header has no Demo link.
- **Concrete fix:** Render the same compact header/footer on all routes and add
  `Demo` to primary navigation.

### Passed checks (not a pass verdict)

- The home, Privacy, and Terms titles follow the expected product/title pattern
  and are under 60 characters; each has one visible `h1`, a description, a
  favicon, and a main landmark.
- Internal home/hash/policy links returned 200; the external source link returned
  GitHub 200. The missing route is a content failure, not a dead HTTP link.
- Fresh phone and desktop loads recorded no console errors. The 390 px layout
  had no horizontal overflow in the included end-to-end test.
- The midnight restoration-bench art, palette, and editorial/monospace pairing
  are distinct and consistent with `.factory/design.md`; this is not a generic
  gradient/card SaaS treatment.
- Local verification completed successfully: `npm test` (18 unit assertions),
  `npm run build` (creates `dist/`), and `npm run test:e2e` (10 checks).

## Required acceptance retest

1. In a fresh context open `/demo`, verify the sample report, demo banner,
   reset, start-real control, demo title, and `demo:`-only storage.
2. Seed ordinary history, exercise all demo controls, and assert the ordinary
   storage value remains unchanged; intercept all demo requests.
3. Run every command listed in the new `.factory/claims.json` from a clean
   clone, preserving evidence for each tagged claim.
4. Recheck the 390 px first viewport: identify the audience, job, result of the
   real action, result of the sample action, and three short facts without
   scrolling.
5. Crawl all routes including `/demo` and an unknown path; verify route title,
   canonical/OG/Twitter/Apple metadata, focus on route change, shared footer,
   and a designed 404.
