# Review 3 handoff

## Verdict

**FAIL — 2 findings and 7 untested public claims.**

The implementation remains functionally sound, accessible, fast, isolated in
demo mode, and byte-identical to the live deployment. It cannot receive a
strict PASS because the claims manifest omits public privacy and product-boundary
promises, and two public lines violate the required no-metaphor wording rule.

Full evidence: `.factory/review-3.md`.

## Release identity

- Product: Meeple Import Doctor
- Live URL: <https://boardgame-catalog-import-debugger.sociobot.in>
- Implementation SHA: `a5c15cba607bbc379bd226a53d8f523af2c724cf`
- Documentation baseline: `c6693012d1dd66890a1537c9c120b493ef275432`
- Prior report-only SHA: `535dbe884e067def714d36bc90e4dd4a27547aa7`

The application files do not differ between the implementation and
documentation SHAs. This review changed reports only.

## Verified working

- Fresh desktop and 390 × 844 phone contexts showed the job, audience, sample
  action, expected result, and three facts before scrolling.
- The one-click Lantern Keepers demo showed a realistic populated report,
  stayed visibly labelled, reset correctly, and did not change seeded ordinary
  history.
- Healthy, missing-field, changed-markup, invalid URL, blocked, not-found,
  rate-limited, server-error, unreadable-response, clear/undo, and local HTML
  recovery paths worked.
- `npm test` passed 18/18, the build produced `dist/`, all ten declared claim
  commands passed separately, and `npm run test:e2e` passed 18/18.
- Axe found zero violations on home, demo, Privacy, Terms, and 404 states.
  Keyboard focus, reduced motion, 200% text, offline reload, and worker update
  cleanup passed.
- Live Lighthouse scored 100 in all four categories with LCP 0.9 s, TBT 0 ms,
  CLS 0, and 36 KiB transferred.
- Live root, demo, worker, main JS/CSS, route JS, 404, and mobile artwork were
  byte-identical to the clean build.

## Findings to resolve

1. Add or narrow claim entries and tagged tests for seven untested promise
   groups: tracking/collection, pasted-HTML retention, seven-second restore,
   cooldown lifetime, no proxy/logging, cache exclusions, and no-bypass/bulk
   boundaries. Also list the already tested README 404 promise.
2. Replace `Following the evidence…` and `The inspection bench has no page at
   this address.` with direct task wording, then correct the copy audit.

## How to verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Run every command in `.factory/claims.json` separately. Then open the live root
and `/demo` in fresh desktop and phone contexts, repeat the storage-boundary and
offline checks, scan all route states with Axe, and request an arbitrary path to
confirm the designed HTTP 404.

## Evidence

- Review report: `.factory/review-3.md`
- Desktop first screen:
  `/work/.evidence/review-3/live-desktop-first-screen.png`
- Phone first screen: `/work/.evidence/review-3/live-phone-first-screen.png`
- Phone demo report: `/work/.evidence/review-3/live-phone-demo-report.png`
- Lighthouse JSON: `/work/.evidence/review-3/lighthouse.json`

No product code was modified. The tree remains buildable. A repair must address
both findings before another strict PASS review.
