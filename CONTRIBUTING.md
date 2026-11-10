# Contributing to Aporia

Aporia contains a canonical token system and derived Lacuna theme family. Make token decisions in `aporia/tokens.json` and adapter mappings in the existing scripts. Avoid new hardcoded color sources.

Before opening a change, run:

```sh
npm run build
npm test
npm run check:drift
```

For changes to editor appearance, include the host name/version and screenshots showing a selection, a diagnostic, a diff and at least one full code specimen. See `docs/QA.md`.

The project owner has not selected a public contribution license yet; please confirm licensing expectations before contributing code or artwork.
