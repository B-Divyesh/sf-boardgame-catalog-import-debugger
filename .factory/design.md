# Meeple Import Doctor — visual thesis

## Direction: the midnight restoration bench

The product uses **cinematic environmental art** to place a failed import in a
physical metaphor: a single game piece under a conservator's inspection lamp,
surrounded by catalog cards and diagnostic instruments. The mood is deliberate,
quiet, and competent—not ominous. It fits collectors because treasured objects
are handled carefully, and it fits debugging because the interface reveals one
layer of evidence at a time.

This is an explicitly **single-mode, dark treatment**. The painted background is
part of the product's nighttime workbench setting; a competing light theme would
break that thesis. Every functional surface is opaque enough for dependable
contrast over the art.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#0b1112` | Painted page background |
| Deep pine | `#111d1b` | Work surfaces and panels |
| Slate pine | `#192925` | Raised controls |
| Parchment | `#f4ecd8` | Primary text |
| Fog | `#b8c4bc` | Secondary text |
| Lamplight | `#f2b65b` | Primary actions and focus |
| Lamplight ink | `#241500` | Text on primary actions |
| Instrument cyan | `#68c7c2` | Links, healthy evidence |
| Moss | `#8ecf87` | Successful diagnosis |
| Amber | `#f1bd68` | Caution and partial matches |
| Rust | `#f08b70` | Errors and blocked requests |

Parchment on deep pine exceeds 13:1, fog exceeds 8:1, and lamplight ink on
lamplight exceeds 9:1. State labels always include a word and an icon/shape, so
color is never the only signal.

## Type

The UI uses local system fonts to avoid a font download: `Georgia` for the
editorial display voice and `ui-monospace` for evidence, values, and source
labels. The pairing evokes a collector's ledger beside a modern request console.
Body copy uses the system sans stack for fast, legible utility. The scale is
12 / 14 / 16 / 20 / 28 / clamp(42–68) px with 1.5 body leading. Data uses
tabular figures.

## Layout and spacing

An 8 px base rhythm governs gaps: 4, 8, 12, 16, 24, 32, 48, 64, and 96 px.
The landing scene uses an asymmetrical 12-column composition: explanation and
input on the left, illuminated object on the right. The diagnostic report is a
vertical evidence trail, not a dashboard grid. At 390 px the environment crops
to a shallow header, all evidence stacks, ornamental labels disappear, and the
primary action remains full-width with a 48 px target.

## Interaction grammar

- The URL is the specimen. Pasting it immediately detects a supported source.
- “Inspect URL” moves focus to the result heading after the async state settles.
- Evidence appears in the order an import fails: request, source, fields,
  diagnosis, then recovery/export.
- Disclosure buttons reveal technical details without making jargon the default.
- Copy actions confirm inline and through a polite live region.
- Recent inspections stay only in the browser, are capped at five, and can be
  cleared with an undo window.

## Motion policy

Functional transitions last 180–260 ms and animate only opacity/transform: the
inspection beam settles downward, evidence rows enter from their preceding step,
and copy confirmation fades in place. No ambient element loops. Under
`prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed;
state changes are instant except for a brief opacity crossfade.

## Asset plan and provenance

### Hero: `inspection-bench`

- Subject: a small unbranded wooden game pawn and a blank vinyl record sleeve
  on a catalog restoration bench; scattered blank index cards and a magnifying
  lens imply inspection.
- World/materials: dark stained wood, oxidized brass, frosted glass, paper fibers.
- Light/lens: one warm tungsten desk lamp from upper left, cool cyan instrument
  spill from the right, cinematic 50 mm lens, shallow depth of field, generous
  negative space on the left for product copy.
- Palette words: deep pine-black, parchment, brass lamplight, restrained cyan,
  muted rust.
- Negative list: people, hands, text, letters, numbers, logos, brands,
  recognizable game characters, UI screenshots, watermarks, neon gradients,
  extra game pieces, distorted geometry.
- Prompt: “Cinematic environmental still life of a meticulous collector's
  restoration workbench at midnight. On the right, one small generic wooden
  board-game pawn beside a blank charcoal vinyl record sleeve, a brass
  magnifying lens and a few blank cream catalog cards. Dark stained wood and
  deep pine-black room, warm tungsten inspection lamp from upper left making a
  precise pool of amber light, subtle cool cyan instrument spill from far right,
  faint dust in the beam, 50mm lens, shallow depth of field, tactile paper fibers
  and oxidized brass, editorial realism, quiet competent mood, generous dark
  negative space across the left half for interface copy. No people, no hands,
  no text, no letters, no numbers, no logos, no brands, no copyrighted
  characters, no watermark, no UI, no neon gradient.”
- Generated with the factory image model (`factory-image`) on 2026-08-28.
  Original PNG and prompt sidecar are retained in `assets/src/`; optimized WebP
  derivatives ship in `public/art/`. Generated specifically for this product
  under the factory's asset terms.

The wordmark mark, field/status symbols, and trace connector are authored SVG
and CSS primitives. They use only original geometric forms and ship inline.
