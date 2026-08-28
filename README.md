# Meeple Import Doctor

Meeple Import Doctor helps board-game and record collectors check why a public
item page did not import into a self-hosted catalog.

It is for a collector who has one failed URL and needs a readable report.
Open the [sample demo](/demo) to see a BoardGameGeek report with one missing
field and a manual JSON record.

## Use it

1. Open a public item URL in the checker.
2. Inspect the report or paste page HTML when the browser cannot read the page.
3. Copy the manual JSON record if it helps repair the catalog entry.

The sample uses separate browser storage. It makes no third-party request.
The app can reopen offline after one online visit. It has no account or payment
controls. The tested promise list is in [.factory/claims.json](.factory/claims.json).

## Demo sandbox

The direct demo URL is `/demo` (also `/?demo=1`). It loads the shipped Lantern
Keepers sample into the `demo:meeple-doctor:recent:v1` local-storage namespace.
The banner offers **Reset demo** and **Start for real**. Starting real discards
the demo namespace; the demo never reads or writes ordinary recent history.
See [.factory/demo.md](.factory/demo.md) for the sandbox details.

## Develop and verify

Node.js 20+ and npm are required.

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

`npm run build` writes the Azure Static Web Apps artifact to `dist/`. Playwright
is pinned to 1.58.2. If needed, install its Chromium binary with:

```sh
npx playwright install chromium
```

Run each command in `.factory/claims.json` after `npm ci` to verify every
visitor-facing claim from its clean demo state.

## Routes and project map

- `/` — URL checker and ordinary browser history
- `/demo` — isolated sample sandbox
- `/privacy/` and `/terms/` — policies
- `src/parser.ts` — local HTML parsing
- `src/app.ts` — browser interaction and demo storage isolation
- `.factory/design.md` — the midnight restoration-bench visual system and art provenance

## License

[MIT](LICENSE)
