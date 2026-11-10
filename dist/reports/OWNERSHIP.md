# Aporia token ownership

Generated from `aporia/tokens.json`. Do not edit generated assets.

| Path | Role | Contract |
|---|---|---|
| `aporia/tokens.json` | Canonical | All primitive, semantic, and platform color decisions |
| `aporia/RULES.md` | Canonical | Core, Editorial, Interface, Lacuna boundaries |
| `aporia/build.mjs` | Generator | Shared token resolver and WCAG gate |
| `scripts/build-platforms.mjs` | Generator | Uses the resolved semantic output, not a new palette |
| `scripts/build-gallery.mjs` | Generator | Builds the specimen gallery from the resolved palette |
| `dist/` | Generated | Host themes, web tokens and validation reports |
| `previews/src/` | Source | Markup, sample code and CSS referencing canonical roles |
| `previews/dist/` | Generated | Standalone browser specimen pages |

Generated assets are verified by `npm run check:drift`. Old secondary design-engine palettes from the original archive are deliberately not included: they were exploratory, mutually conflicting and not a production dependency.
