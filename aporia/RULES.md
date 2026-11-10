# Aporia — Core / Editorial / Interface rulebook

Aporia is one identity with two expressions. `aporia/tokens.json` owns every colour,
type ramp, space step, radius, stroke and duration. This file owns the *scope* of every
rule: which ones bind the whole identity, which ones belong to the printed page, and
which ones belong to software.

Read the tag before applying a rule.

| Tag | Binds |
|---|---|
| `CORE` | Every Aporia artifact, on every platform. Cannot be overridden. |
| `EDIT` | Editorial mode: portfolio, case study, dossier, README composition, poster, publication. |
| `UI` | Interface mode: applications, editors, terminals, documentation tools, dashboards, settings. |
| `PLATFORM` | A named adapter (Lacuna/Helix, Lacuna/Zed, terminal, mobile) replacing a mode rule for a host reason. Must be declared in the adapter file. |

Precedence: `CORE` → mode (`EDIT` or `UI`) → `PLATFORM`. A platform adapter may replace a
mode rule, never a Core rule. An artifact belongs to exactly one mode; a hybrid page states
which mode governs each region.

---

## 1. Core

The parts that survive being moved to a code editor, a phone, or a terminal.

- **Two grounds, one ink.** Paper is bone `#EDE4D3` with onyx `#0D0D0D`. Ink is coal
  `#191B1A` with bone lettering. Both are Core. `CORE`
- **Seven primitives.** Bone, raised sheet, onyx, ink-muted, hairline, brownred, chestnut.
  Everything else is a semantic role resolved from them. A new hue needs a functional need
  written down, not a mood. `CORE`
- **Red is an impression.** Limit decorative red to one dominant anchor per view: a rule, a
  star, a 5px square, a stamp border, one emphatic word. Functional red is permitted wherever
  semantics, safety, focus, diagnostics or syntax require it: focus rings, errors, diff
  removals, keywords. Never rely on colour alone. Never a control fill, never a checked
  state, never a large wash, never a large background. `CORE`
- **The primary control is ink on paper, paper on ink.** On a paper ground the primary
  button is onyx fill with bone text; on an ink ground it inverts to bone fill with onyx
  text. Both are the same rule read through the ground. Secondary is a 1px ink outline.
  Danger is red *text plus a 1px red outline* — never a red fill. `CORE`
- **Checked is a mark, not a colour.** Checkboxes fill with ink and knock the tick out in
  the ground colour. Radios are squares with an inset ink square. Switches are a rule with a
  travelling square. No circles. `CORE`
- **Square.** Radius is 0. Text inputs may take 2px so a caret sits inside a border. No
  pills, no capsules, no rounded cards, no circular avatars. `CORE`
- **Three families.** Russo One for display, Golos Text for prose and UI, JetBrains Mono for
  indices, metadata and code. Display is uppercase, 1.0 leading, −0.02em. Mono metadata is
  uppercase with 0.08em tracking. `CORE`
- **Mono is a metadata treatment, not a body font.** Uppercase tracked mono may label a
  plate, an index, a timestamp or a status. It may not set sentences, form labels, menu
  items, or code itself. `CORE`
- **Contrast floors.** Body text 4.5:1, large text and control boundaries 3:1. Disabled is
  the only state allowed to fall below. Hover never reduces contrast; it moves the ground by
  6–12% of one OKLch lightness step or changes the border. `CORE`
- **A visible focus ring, always.** 2px, offset from the control, red on paper and bone on
  ink. Keyboard order follows reading order. `CORE`
- **Motion is short and linear in intent.** 90ms press, 140ms rule draw, 240ms panel, one
  standard ease. Nothing scales, floats, bounces or parallaxes. Reduced motion collapses to
  0.01ms. `CORE`
- **The voice is documentary.** Say what was measured, where, and how. No exclamation marks,
  no unlabelled invention, no claim without a source. Missing material is labelled as
  missing. `CORE`

## 2. Editorial mode

The printed sheet. Every rule below is `EDIT` and stops at the edge of the page.

- **Never a dark page.** Dark ground appears only inside code, terminal and evidence plates.
  `EDIT`
- **Exactly one raised sheet per page**, and the footer is the only sunken band. No third
  paper tone, no card grids. `EDIT`
- **One red anchor per page**: a 40 × 2px rule under the wordmark, or the 24px faded star
  beside the section numeral. Not both on the same page. `EDIT`
- **Asymmetry.** Numeral in column 1, title across 2–9, mono meta right-aligned in 10–12, a
  ghost numeral of the page's own number behind, `aria-hidden`. `EDIT`
- **Double rule under section headers**: 1px border, then a second soft 1px rule 3px below.
  `EDIT`
- **The grain plate** sits at 0.42 opacity, multiply, static, over the whole page. `EDIT`
- **No icons.** The star, the index, the rule and the stamp carry the page. `EDIT`
- **Evidence plates, not illustration.** A real screenshot or recording in a bordered plate
  with a plate number, a provenance label (Recording, Screenshot, Staged, Simulation,
  Pending) and a caption saying where it came from. No photography, no drawn scenes. `EDIT`
- **62ch measure**, dotted leaders on index rows, 12 columns, 1180px maximum. `EDIT`

## 3. Interface mode

Software. These rules exist because a dense screen needs surfaces, states and speed that a
printed page never has. They extend the identity rather than borrow the poster.

- **A surface stack, not one sheet.** Ground, raised surface, elevated surface, overlay. Each
  step is one paper tone (or one near-coal step in ink), separated by a 1px hairline, never
  by a shadow. Depth is a tone. `UI`
- **Density is a property of the screen, not the brand.** Compact rows are 32–40px in a data
  view and 44px minimum for anything touched. `UI`
- **Red narrows further.** In interface mode red is focus, error, and at most one active
  marker per view (a live recording indicator, a selected tab rule). Status colour never
  carries meaning alone: it always carries a word or a mark. `UI`
- **State ladder uses ink washes**, not new hues: hover 6% ink, pressed 10%, selected 10% plus a
  2px ink edge. Selected always carries a second signal — an edge, a bracket or a label. `UI`
- **Icons are permitted and drawn to one rule**: 1.5px stroke, square caps, 16/20/24px grid,
  no filled glyphs, no emoji. Registration-derived geometry (corner marks, brackets,
  crosshairs) is the house style. `UI`
- **The star is not a logo.** It stays an editorial motif. Interface chrome uses registration
  marks, folio indices and brackets instead. `UI`
- **Grain never sits over UI.** It may appear on an empty state or a poster surface at ≤0.08
  opacity, never over text, charts, controls or data. `UI`
- **Charts encode with fills**, no hollow outlines; every series carries a label and a value,
  and the axis is declared. `UI`
- **Keyboard first.** Every command has a focus path, every dialog traps and restores focus,
  every destructive action confirms with a labelled button rather than a colour. `UI`

### Component state matrix

| State | Paper ground | Ink ground | Notes |
|---|---|---|---|
| Default | ink `#0D0D0D` on bone | bone on coal | no border unless the control needs an edge |
| Hover | 6% ink wash, 1px charcoal edge | 7% bone wash, 1px hairline | label colour unchanged |
| Pressed | 10% ink wash | 11% bone wash | 90ms |
| Selected | 10% ink wash + 2px ink edge | 11% bone wash + 2px bone edge | one per group |
| Focus | 2px red ring, 4px offset | 2px bone ring, 4px offset | always visible |
| Disabled | 8% ink wash, ink-muted label | 8% bone wash, hairline label | the only reduced-contrast state |
| Error | 1px red edge, red message, square mark | 1px faded-red edge | the message carries the meaning |

## 4. Platform adapters

An adapter maps Core semantic roles onto a host and declares every deviation.

- **Editors — Lacuna Paper / Lacuna Ink.** Syntax, selection, diff and terminal roles come
  from `color.paper.syntax` / `color.ink.syntax` and are not re-picked per host. Helix TOML
  and Zed JSON are generated, never hand-tuned; a host that cannot express a role gets a
  documented nearest role. `PLATFORM`
- **Terminals** use `color.*.terminal`, including the ANSI ramp, and keep the 16 colours
  legible on the terminal ground alone. `PLATFORM`
- **Native chrome** may adopt host metrics (title bars, 44px iOS targets, 48dp Android) and
  host motion curves; type families, geometry, palette and the red rule do not change.
  `PLATFORM`
- **Every override is annotated** in the adapter file with the role, the replacement and the
  reason. An undocumented override is a bug. `PLATFORM`

## 5. Token architecture

```
reference  color.ref.*          48 primitives, OKLch, one meaning each
   ↓
semantic   color.{paper,ink}.*  79 roles per mode, identical key sets
   ↓
component  interactive.*, status.*, editor.*, chart.*, terminal.*
   ↓
adapter    Helix TOML · Zed JSON · CSS variables · native maps
```

- **Ownership.** `aporia/tokens.json` is the only human-edited source of token values.
  `aporia/build.mjs` resolves the core modes and generates `dist/web/`,
  `dist/helix/`, `dist/zed/lacuna.json` and `dist/reports/`. The existing
  `scripts/build-platforms.mjs` maps those resolved roles to other supported
  formats; `scripts/build-gallery.mjs` renders 24 specimens. Neither may choose
  independent colors. Use `npm run build` to regenerate everything.
- **Provenance.** Every token carries `$extensions.aporia.p`: `canonical`, `proposed`,
  `refined` or `derived`. An unprovenanced token is a draft.
- **Parity.** Paper and ink must expose identical semantic keys. `build.mjs` asserts this;
  an ink role with no paper counterpart fails the build.
- **Gate.** 327 gated contrast pairs, 0 failures, WCAG 2.2 relative luminance. A failure
  exits non-zero. Exemptions live in `build.mjs`, not in a comment somewhere else.
- **Acceptance test.** Change one primitive, run `npm run build`, and every
  generated output moves together without a manual edit. `npm run check:drift`
  verifies byte-identical regeneration; `dist/reports/OWNERSHIP.md` documents
  the generated output contract.

## 6. Conflict resolution

1. Core beats mode. Mode beats platform.
2. A brand source supplied by the user beats this file for that artifact only.
3. If a rule blocks a real task — a dark editor, a data table, a required icon — the answer
   is a documented mode or adapter rule, not a broken layout and not a silent exception.
   A host that needs more distinct colours (collaborator cursors, Git states, ANSI slots)
   reuses the smallest set of existing roles and its adapter file states why.
4. If two rules disagree inside one artifact, the region states its mode and follows it.
5. If two files disagree, the authority order in `README.md` decides: RULES.md and
   tokens.json, then generated outputs, then reference fixtures, then demos.
