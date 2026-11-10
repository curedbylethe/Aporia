# Aporia — instructions for design and coding agents

## Sources in priority order

1. `aporia/tokens.json`: only authority for raw and semantic token values.
2. `aporia/RULES.md`: authority for Core, Editorial, Interface and Lacuna scope.
3. `docs/ARCHITECTURE.md`: adapter and generated-output responsibilities.
4. `docs/BRAND.md` and `docs/DESIGN.md`: contextual editorial guidance.
5. `previews/dist/`: simulated examples, **not authoritative pixel references for real editors**.

## Required workflow

1. Identify Core, Editorial, Interface or Lacuna and target host.
2. For a color or font change, edit `aporia/tokens.json`. Do **not** edit `dist/` or `previews/dist/`.
3. For a platform key-mapping change, edit the appropriate existing generator. Don't create a second palette.
4. `npm run build && npm test && npm run check:drift`.
5. Verify corresponding generated theme and gallery specimen; for host-related changes, run the manual checks in `docs/QA.md`.
6. Describe changes, affected roles and host limitations without claiming runtime tests that were not performed.

Do not reinterpret Lacuna as an independent identity or apply editorial-only layout rules to functional apps.
