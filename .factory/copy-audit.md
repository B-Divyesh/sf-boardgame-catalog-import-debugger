# Copy audit

Audited 5 September 2026. Counts split on spaces and treat hyphenated terms as
one word. No sentence exceeds 22 words. No banned marketing word remains.

The phone first screen names the job, audience, sample action, sample result,
and three facts before scrolling.

## First screen

| Words | Copy |
| ---: | --- |
| 3 | Board-game catalog checks |
| 6 | Fix a failed board-game catalog import |
| 11 | For collectors whose self-hosted catalog cannot read a public item page. |
| 5 | Try it with sample data |
| 8 | Opens a BoardGameGeek report with one missing field. |
| 6 | Sample data uses separate browser storage. |
| 6 | Runs offline after one online visit. |
| 4 | No account or payment. |
| 3 | Item page URL |
| 4 | Waiting for a URL |
| 3 | Inspect my URL |
| 5 | Checks one public item page. |
| 8 | One direct request per source every 15 seconds. |

## Landing page and report

| Words | Copy |
| ---: | --- |
| 9 | Paste page HTML if the browser cannot read it |
| 8 | Page HTML optional · stays on this device |
| 6 | How do I copy page source? |
| 8 | Open the item page in a desktop browser. |
| 8 | Press Ctrl + U, select all, and copy. |
| 8 | This tool parses pasted text in your browser. |
| 8 | Check one public item page at a time. |
| 3 | Inspection in progress |
| 4 | Checking the item page |
| 4 | Requesting one public page. |
| 5 | How a URL check works |
| 4 | Check each import step |
| 6 | Check whether the item page responded |
| 8 | See the response status, page type, and timing. |
| 6 | Check which page format was found |
| 7 | BoardGameGeek and Discogs use tailored detail checks. |
| 5 | Other pages use page metadata. |
| 5 | Check which details were missing |
| 10 | Open technical details to see what the parser looked for. |
| 6 | Copy the details that were found |
| 9 | Preview a manual JSON record with its source page. |
| 3 | Recent URL checks |
| 3 | No recent checks. |
| 9 | Up to five recent URLs stay in this browser. |
| 3 | Recent checks cleared. |
| 3 | Restore recent checks |
| 9 | Find the missing detail in one failed catalog import. |
| 7 | Built by Param Factory · build repair-4 |

## Demo, results, errors, and recovery

| Words | Copy |
| ---: | --- |
| 11 | Demo — sample data, nothing is saved to your real history. |
| 2 | Reset demo |
| 3 | Start for real |
| 5 | Built-in sample · no request |
| 5 | Pasted HTML · local only |
| 3 | Direct browser request |
| 4 | A normalized manual record |
| 4 | No description was detected. |
| 4 | Open original page ↗ |
| 3 | Manual import JSON |
| 2 | Copy JSON |
| 4 | What to do next |
| 6 | Enter an item URL to inspect. |
| 13 | This is not a complete web address. Include https:// and the item page. |
| 10 | Only public http:// or https:// item pages can be inspected. |
| 4 | This device is offline. |
| 15 | No request left this browser. Your URL is still here, so reconnect and try again. |
| 5 | The source is rate-limiting requests. |
| 5 | The source refused this request. |
| 14 | The page answered with HTTP 429. Meeple Import Doctor does not bypass access controls. |
| 6 | The item page was not found. |
| 17 | The source answered with HTTP 404; the item may have moved or the URL may be incomplete. |
| 7 | The browser could not read the response. |
| 19 | This is usually a cross-origin restriction, a network block, or a privacy extension—not proof that the item is missing. |
| 6 | The source returned an access check. |
| 20 | The response said “[detected title]” instead of returning the item. A successful HTTP status can still contain a block page. |
| 9 | The page loaded, but its markup no longer matches. |
| 6 | The required [fields] selector returned nothing. |
| 12 | The source may have changed its page structure or returned an interstitial. |
| 5 | Importable, with one missing field. |
| 10 | The title was detected, but [fields] could not be mapped. |
| 4 | The page looks importable. |
| 14 | All known fields were detected and normalized. Compare the preview before copying the record. |
| 12 | Clipboard access was blocked. Select the JSON text and copy it manually. |
| 13 | Browser storage is unavailable. This inspection will not be added to recent history. |
| 13 | To respect [source] rate limits, wait about [number] seconds before another direct request. |
| 10 | You can still paste page HTML for a local-only inspection. |

Dynamic source names, status numbers, field names, and record values replace
the generic nouns above. Each rendered sentence stays below 22 words for the
supported field set.

## Legal route headings

| Words | Copy |
| ---: | --- |
| 6 | How your inspection data is handled |
| 5 | Terms for checking item pages |
| 5 | This address was not found. |

## Error page

| Words | Copy |
| ---: | --- |
| 6 | There is no page at this address. |

## README check

Every README prose sentence is 22 words or fewer. The README uses the same
terms as the interface and contains no banned marketing word.

## Terminology

| Concept | One term used |
| --- | --- |
| External page to inspect | item page |
| Failed catalog operation | import |
| Built-in try-out | sample data / demo |
| Browser-stored list | recent URL checks |
| Technical extraction rules | parser details |
| Manual export | manual JSON record |
