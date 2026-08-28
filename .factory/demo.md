# Demo sandbox

## Entry point

Open `/demo` or `/?demo=1` in a fresh browser context. The landing-page action
**Try it with sample data** opens `/demo` in one click.

## Shipped sample

The demo loads a built-in BoardGameGeek fixture for **Lantern Keepers**. It has
a title, image, year, and creator, with its description intentionally absent.
The report therefore shows one missing field and a source-attributed manual JSON
record. The fixture is bundled in `src/app.ts`; it does not fetch its source URL.

## Storage boundary

Demo recent checks use only `demo:meeple-doctor:recent:v1`. Ordinary checks use
`meeple-doctor:recent:v1`. Demo mode never reads or writes the ordinary key.
The persistent banner states that boundary and provides **Reset demo** and
**Start for real**. Reset replaces the demo sample. Start for real removes the
demo key and returns to `/`.

## Verification

The claim tests in `.factory/claims.json` open the demo in a fresh context.
They seed ordinary history, exercise reset and start-real controls, and assert
the ordinary value stays unchanged. The privacy claim records every request and
accepts only same-origin app files during the demo flow.
