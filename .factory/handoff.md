# Repair 4 handoff

## Release

- Product: Meeple Import Doctor
- Job: help collectors diagnose one failed public item-page import before
  changing their self-hosted catalog.
- Audience: board-game and record collectors whose catalog cannot read an item
  page.
- Live URL: <https://boardgame-catalog-import-debugger.sociobot.in>
- Implementation SHA: `69810ec08839b10aa48862aede6e5d8774d944af`
- Documentation SHA: `40e23a740c145254afb118d69de1b58a92be8cd6`
- Deployment: Azure Static Web Apps production upload `97098794-16ac-4345-8796-7321e8568b4e`.

## What changed

- Replaced the two remaining metaphor lines with `Checking the item page` and
  `There is no page at this address.` The copy audit now includes the 404 body.
- Rewrote privacy and terms statements in testable, direct language. They now
  name the browser boundary, memory-only pasted HTML, product-cookie and
  analytics behavior, cache scope, source-direct requests, cooldown lifetime,
  robots limitation, and one-item boundary.
- Expanded `.factory/claims.json` from 10 to 18 claims. Every id has exactly
  one outcome-based Playwright tag and command. New checks cover tracking and
  cookies, pasted-HTML lifetime, the seven-second restore window, cooldown
  lifetime, direct no-proxy behavior, cache exclusions, access/bulk limits, and
  the designed 404.
- Kept the sample sandbox intact: `/demo` is still isolated in
  `demo:meeple-doctor:recent:v1`, stays visibly labelled, resets, and exits
  without changing ordinary history.
- Updated the catalog description to: `Fix failed board-game catalog imports
  with a one-URL report.` It is copied to
  `/work/.evidence/catalog-description.txt`.

## Verification

From the documented clean setup:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

- `npm ci` passed: 97 packages installed, 0 vulnerabilities reported.
- `npm test` passed: 18 tests in 5 files.
- `npm run build` passed and produced `dist/`.
- `npm run test:e2e` passed: 27 Playwright checks.
- Each of the 18 commands in `.factory/claims.json` passed separately from a
  fresh browser context. This includes the new seven-second timer check.
- `/opt/fleet/lib/verify-url.sh` passed locally (572 ms) and live (738 ms): no
  console errors; title, language, heading, main landmark, image alt text, and
  labelled controls are present.
- Live Axe found zero violations on `/`, `/demo`, `/privacy/`, `/terms/`, and
  an unknown route. The unknown route correctly returned HTTP 404.
- Lighthouse 12.5.1: local and live each scored 100 Performance, 100
  Accessibility, 100 Best Practices, and 100 SEO. Live LCP was 0.9 s, TBT
  0 ms, CLS 0, and transfer 35 KiB.
- The live root, 404 document, worker, runtime JavaScript, CSS, and checked
  artwork are byte-identical to `dist/`.

Fresh desktop and 390 × 844 phone visits showed the job, audience, sample
action, expected sample result, and all three facts before scrolling. A fresh
phone demo showed Lantern Keepers, its persistent sample banner, Reset demo,
and Start for real after the JSON panel was scrolled into view. Seeded ordinary
history remained byte-for-byte unchanged through reset and exit. These live
flows made no third-party request.

## Earlier findings

| Finding group | Current proof |
| --- | --- |
| Offline shell and source cooldown | `offline-reload` and `request-cooldown` claims pass. |
| First-screen clarity, isolated demo, persistent demo label | Mobile and demo browser checks pass. |
| Metadata, route focus, and designed 404 | Route, Axe, and `designed-404` checks pass. |
| Privacy disclosure fields and hashed artwork | `recent-five` and immutable-artwork checks pass. |
| Review 3 missing claims | Eight added claims pass separately. |
| Review 3 non-plain copy | Both direct replacements are in the built live page and copy audit. |

## Known limits

- This is a static, local-first product. It has no backend, tenant data,
  product database, health endpoint, server rate-limit endpoint, paid offer, or
  billing registration. Backend isolation and payment checks do not apply.
- A direct inspection remains subject to the source website's CORS policy,
  terms, and access controls. The app reports blocked or unreadable responses;
  it does not bypass them.
- No external integration is required for the free core. The manual JSON record
  remains the recovery path for catalog importers.
