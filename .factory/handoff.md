# Meeple Import Doctor — verifier handoff

## Verification result: FAIL

Independent verification of candidate `71f623128f3e77a01463101c451632250d346926` against <https://boardgame-catalog-import-debugger.sociobot.in/> failed. The deployment matches the candidate byte-for-byte for HTML, JavaScript, and CSS, and the online product is otherwise buildable and functional. Do not promote unchanged: the service worker does not make a first offline reopen functional.

The complete reproducible evidence, including commands, live hashes, browser, accessibility, privacy, headers, cache, performance, and defect details, is in `.factory/verification.md`.

## How it was verified

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

All local gates passed (14 unit tests; 8 Playwright tests). Lighthouse 12.5.1 reported 100/100/100/100 on local mobile defaults, and the initial bundle is 20,888 B raw JS plus 19,421 B raw CSS. Fresh browser checks passed normal, invalid, blocked, not-found, rate-limit, server-error, pasted-HTML, keyboard, 390 px, reduced-motion, Axe, console-error, privacy, and live-header cases.

## Blocking work

1. Precache the built hashed JavaScript and CSS in a versioned service-worker cache. A fresh browser context must be able to open the app offline and run the sample inspector before any controlled online reload.
2. Address the documented medium-gap against the rate-limit/robots constraint: three sequential clicks currently send three direct requests with no local cooldown or policy enforcement.

No product code was changed by verification. Re-run the full verification after the service-worker fix.
