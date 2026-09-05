# Independent verification 3 — PASS

**Verdict: PASS.** There are **zero findings** at every severity and **zero
untested public claims**.

- Live URL: <https://boardgame-catalog-import-debugger.sociobot.in>
- Candidate reviewed: `a5c15cba607bbc379bd226a53d8f523af2c724cf` (`a5c15cb`)
- Documentation SHA at verification: `c6693012d1dd66890a1537c9c120b493ef275432`
  (`c669301`; report-only, with no product changes)
- Verified: 2026-09-05 UTC

## First screen and job

Fresh desktop and 390 × 844 phone contexts loaded the live landing page before
scrolling. The screen states the job, **“Fix a failed board-game catalog
import,”** the audience, **“For collectors whose self-hosted catalog cannot
read a public item page,”** and the first action, **“Try it with sample data.”**
The action was visible on the phone at y=428 with a 44 px height. Its promised
result and all three facts were also in the first viewport. There was no
horizontal overflow.

One click opened `/demo`. The realistic Lantern Keepers BoardGameGeek report
showed a synthetic 200 response, four detected fields, one missing description,
source attribution, and a copyable manual JSON record. At the JSON report on a
phone, the sticky demo boundary was at 8–130 px; **Reset demo** and **Start for
real** were both visible.

With ordinary history seeded before entry, Reset and Start for real left that
ordinary value byte-for-byte unchanged. The demo key contained Lantern Keepers
after reset and was absent after Start for real. The normal local-HTML path was
also exercised with a fully populated BoardGameGeek fixture: all five fields,
the healthy diagnosis, source-attributed JSON, and inert pasted script were
observed. Invalid text and a `file:` URL produced specific inline recovery
messages.

## Clean-checkout gates

The checkout was clean before verification. After `npm ci`:

| Command | Result |
| --- | --- |
| `npm test` | PASS — 18 tests in 5 files |
| `npm run build` | PASS — TypeScript check and `dist/` output |
| `npm run test:e2e` | PASS — 18 Playwright tests |
| `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 …` | PASS — no console errors; title, lang, h1, main, alt text, and labelled controls present |
| `/opt/fleet/lib/verify-url.sh <live URL> …` | PASS — same checks; 631 ms load |

The production build is within the static budget: main JavaScript is 21.93 kB
raw / 7.84 kB gzip and CSS is 21.01 kB raw / 5.55 kB gzip. No web fonts load.

## Claim audit

Every command in `.factory/claims.json` was run separately after the clean
install and build. Each passed in a fresh browser context.

| Claim | Command result |
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

The landing page, demo, README, and policies were cross-checked against the
manifest. No unlisted public claim was found. The static product has no backend,
tenant, restart-persistence, health, or 429 endpoint to test.

## Live runtime, accessibility, privacy, and routes

- Fresh live browser checks found no console or page errors and no third-party
  first-load request. The pasted-HTML recovery made no outside request and did
  not execute embedded script.
- Keyboard Tab reaches the skip link first. Invalid submission retains a
  labelled, announced field error. Privacy, Terms, and the designed 404 focus
  their h1 and update the polite route announcement.
- With reduced motion enabled, all computed animation and transition durations
  were `0.00001s`.
- Live Axe checks found zero violations on home, demo, Privacy, Terms, and an
  arbitrary unknown path.
- After one online visit, a fresh live service-worker context cached JS and CSS
  and reopened `/demo` offline with the Lantern Keepers report.
- `/`, `/demo`, `/privacy/`, and `/terms/` returned 200 with their own titles,
  one h1, main landmark, and footer. An arbitrary unknown path returned the
  styled page with HTTP 404, title `Page not found — Meeple Import Doctor`, and
  the focused heading `This address was not found.` This deliberate 404 is
  expected behavior, not a defect.
- Root, demo, worker, main JS, CSS, 404 page, and mobile artwork were
  byte-identical to this clean build. Live security headers include CSP, HSTS,
  `nosniff`, strict-origin referrer policy, and the documented permissions
  restrictions. Hashed artwork retains immutable caching.

## Earlier findings

| Earlier finding | Current disposition and proof |
| --- | --- |
| Verification 1: offline shell omitted JS/CSS | Fixed — fresh live offline `/demo` loaded the report; cached JS and CSS were present. |
| Verification 1: no direct-request cooldown | Fixed — its tagged claim test passed; the 15-second source cooldown remains covered. |
| Review 1 B1 | Fixed — job and audience are visible in the initial phone screen. |
| Review 1 B2 | Fixed — demo uses `demo:` storage, shows reset/leave controls, and ordinary storage stayed unchanged. |
| Review 1 B3 | Fixed — direct `/demo` has its own title and populated report. |
| Review 1 B4 and B5 | Fixed — manifest exists; all ten tagged public claims passed individually. |
| Review 1 B6 | Fixed — route metadata exists and unknown routes return a styled HTTP 404. |
| Review 1 C1, C2, and C3 | Fixed — initial copy is plain, concise, action-led, and the README remains within its recorded copy audit. |
| Review 1 M1 | Fixed — legal routes have the shared navigation, footer, Demo link, attribution, and build label. |
| Review 2 F-2-1 | Fixed — sample action/facts are visible before phone scrolling; sticky demo controls remain visible during the report. |
| Review 2 F-2-2 | Fixed — live arbitrary route returned the styled HTTP 404. |
| Review 2 F-2-3 | Fixed — legal and 404 h1 elements receive focus and announce the loaded page. |
| Review 2 F-2-4 | Fixed — Privacy names URL, source name, diagnosis, extracted title, and inspection time; the storage-shape claim passed. |
| Review 2 F-2-5 | Fixed — live artwork URLs contain their SHA-256 prefixes and immutable cache headers. |

## Handoff

No repair is needed. The implementation candidate is accepted for the stated
job: collectors can diagnose an opaque public item-page import, understand a
blocked/missing/changed/invalid result, and copy a source-attributed manual
record without changing a catalog.
