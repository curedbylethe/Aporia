# Token architecture and build contract

## Authority

| Layer | Location | Editable? |
|---|---|---|
| Identity and modes | `aporia/RULES.md` | Yes, design decisions only |
| Canonical primitive and semantic tokens | `aporia/tokens.json` | **Yes — only token source** |
| Shared resolver and WCAG gate | `aporia/build.mjs` | Yes, generator logic |
| Additional adapter mapping | `scripts/build-platforms.mjs` | Yes, platform mapping logic |
| Browser preview markup and specimens | `previews/src/` | Yes, presentation only |
| Distributable host files | `dist/` | **No — generated** |
| Static gallery pages | `previews/dist/` | **No — generated** |

## Pipeline

```text
aporia/tokens.json (Design Tokens-style aliases, OKLCH/sRGB)
    │
    └─ aporia/build.mjs ── 327-pair WCAG 2.2 contrast gate
           ├─ dist/web/aporia.css
           ├─ dist/web/tokens.js
           ├─ dist/web/tokens.resolved.json
           ├─ dist/helix/lacuna-{paper,ink}.toml
           ├─ dist/zed/lacuna.json
           └─ dist/reports/*
                    │
                    ├─ scripts/build-platforms.mjs
                    │     ├─ VS Code themes + extension metadata
                    │     ├─ Kitty conf / Ghostty theme
                    │     ├─ Alacritty TOML / WezTerm Lua
                    │     └─ Zed extension directory
                    │
                    └─ scripts/build-gallery.mjs
                          ├─ 24 standalone HTML specimens
                          └─ searchable index with side-by-side modes
```

The adapter scripts may select a role by **name**, but may never introduce their own hex color. For systems that cannot encode translucent CSS colors (e.g., a border with `rgb(... / alpha)`), `build-platforms.mjs` composites the canonical color over the appropriate canvas into an opaque sRGB hex value.

### Color roles

- `color.ref.*`: reusable color primitives.
- `color.paper.*` / `color.ink.*`: semantic roles for each mode, with matching keys.
- `bg.*`, `fg.*`, `border.*`, `interactive.*`, `accent.*`, `link.*`, `status.*`, `editor.*`, `syntax.*`, `terminal.*`, `chart.*` are namespaced roles in the resolved output.
- `terminal.ansi-0…15` are separately resolved, including canonical utility blue, magenta and cyan. They are functional terminal colors, not new decorative brand primaries.

### The editor selection decision

The uploaded Lacuna gallery originally used reverse-video selections, while the canonical Aporia source used a subtler `editor.selection` role that keeps syntax readable. The repository **follows the canonical semantic role** consistently. Helix and VS Code map editor selections to that role; Zed's supported `players` and selection-related keys map the closest available selection use. The gallery simulates that same color. Reverse-video selection is no longer presented as the approved value.

The CSS and host formats don't have identical APIs. Host limitations (e.g., Tree-sitter captures versus semantic tokens, or selection coloring in Zed) must be tested in real editors rather than hidden by the browser specimens.

### Fonts

The gallery CSS references generated custom properties for the canonical font stacks from `aporia/tokens.json`. Web fonts are **not bundled**: Russo One, Golos Text, and JetBrains Mono fall back gracefully if absent. Terminal theme files contain colors only and do not change user font settings or solve Persian text shaping.

## Running and checking

```sh
npm run build        # build all outputs (no npm install required)
npm test             # validate available schema/format invariants, links, and roles
npm run check:drift  # verify a second build writes byte-identical files
```

The test suite parses JSON, checks generated paths, verifies canonical role mappings for each host, and optionally asks Python 3.11+ `tomllib` to parse TOML. It does **not** assert real-host loading or full remote JSON-schema conformance without a host environment. See [QA.md](QA.md).

## CI

The GitHub Actions workflow runs drift detection **before** testing. Generated files are committed for consumers who want to download themes without installing Node. A change to tokens without updated `dist/` files fails the check.
