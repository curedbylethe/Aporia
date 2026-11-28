# Designing with Aporia

Aporia is an archival, documentary design system. Its identity comes from the
way information is organized, prioritized and presented. Lacuna Paper and Lacuna
Ink translate the identity into editor and terminal themes.

## Design a new artifact

1. State the audience, the artifact's purpose and its primary task in one sentence.
2. Choose Editorial or Interface. For a hybrid, name the regions governed by each.
3. Read [the rules](aporia/RULES.md) and [the philosophy](docs/PHILOSOPHY.md).
4. Open the task-specific guide and one working reference from the table below.
5. Arrange the content in reading or operating order before setting the visual hierarchy.
6. Pull semantic roles and the type ramp from [the generated web tokens](dist/web/).
7. For non-web targets, map the semantic roles to host capabilities and record substitutions.
8. Verify the finished artifact against the checklist below.

## Authority

1. `aporia/tokens.json` owns values. `aporia/RULES.md` owns scope and binding rules.
2. `docs/decisions/` records the reasoning. `docs/ARCHITECTURE.md` documents the build and adapters.
3. `DESIGN.md` and the guides summarize how to apply the rules.
4. Generated examples demonstrate one application. Actual host captures show runtime evidence.
5. Adapt examples to each task and medium. Sample data and layout belong to their individual examples.

## Choose a mode

- Editorial presents a reading sequence, explanation or argument. Begin with Paper.
- Interface supports repeated work. Prioritize command paths, state feedback and data landmarks.
- A dossier can contain an Interface benchmark switcher. Keep its surrounding narrative Editorial.
- A terminal is Interface. Use cell spacing, line weight, reverse video and textual states.
- An optional Ink reading mode is a digital preference. Printed output uses Paper.

## Read by task

| Task | Read | Working reference |
| --- | --- | --- |
| Establish hierarchy and layout | [Composition](docs/COMPOSITION.md), [Typography](docs/TYPOGRAPHY.md) | [Dossier](references/editorial/dossier/) |
| Present technical evidence | [Editorial](docs/EDITORIAL.md), [Voice](docs/VOICE.md) | [Dossier](references/editorial/dossier/) |
| Make a printable or instructional document | [Editorial](docs/EDITORIAL.md) | [Résumé](references/editorial/resume/), [Field manual](references/editorial/field-manual/) |
| Build documentation or teaching material | [Editorial](docs/EDITORIAL.md), [Interface](docs/INTERFACE.md) | [Study guide](references/documentation/study-guide/) |
| Design a single-purpose tool | [Interface](docs/INTERFACE.md) | [Instrument](references/interface/instrument/) |
| Design a dense application | [Interface](docs/INTERFACE.md), [Visualizing data](docs/DATA-VISUALIZATION.md) | [Dashboard](references/interface/dense-dashboard/) |
| Design a terminal workflow | [Terminal](docs/TERMINAL.md) | [Process review](references/terminal/process-review/) |
| Frame a product or architecture decision | [Editorial](docs/EDITORIAL.md), [Visualizing data](docs/DATA-VISUALIZATION.md) | [Architecture proposal](references/editorial/proposal/) |

## Compose the artifact

- Give the primary task or claim the strongest position, size and contrast.
- Set a reading measure near 62 characters. Let tables and code use their own measure.
- Use shared alignment and spacing to group related material. Add a surface only for a reason.
- Use square geometry. Use hairlines for rhythm and a stronger boundary for controls.
- Reserve display type for short entries. Use body type for instructions and controls.
- Use tracked uppercase mono for brief metadata. Preserve case and normal tracking in code and terminal text.
- Give red one deliberate editorial anchor. Functional red signals focus, warnings or syntax as defined by the role.
- Label provenance and uncertainty near the evidence. State units, denominator and method near measurements.
- Keep useful density. Provide clear headings, row keys, search or a table of contents when warranted.

## Interaction and review

- Provide semantic labels, feedback, a visible focus path and an understandable empty state.
- Make selected or dangerous states identifiable by text, geometry or a marker in addition to color.
- Confirm destructive actions with the exact target and operation. Restore focus after closing a dialog.
- Check narrow and wide layouts, long labels, 200% zoom and reduced motion.
- Check both themes where supported. Verify Paper print, link destinations and tables without clipped content.
- Check that hierarchy and state remain legible in grayscale.
- Include a provenance label for any screenshot, fixture or measurement.
- Review the [anti-pattern catalogue](docs/ANTI-PATTERNS.md) before finalizing.

## Maintain Aporia itself

- Edit canonical values in `aporia/tokens.json` and rules in `aporia/RULES.md`.
- Edit platform mapping in the existing adapter generators. Document the host reason for a substitution.
- Edit gallery and site sources before rebuilding. Commit generated output with its source.
- If you change a design decision, update the dated record and changelog entry.
- Keep references runnable, annotated and visually documented.
- Run `npm run verify`. For browser-facing changes also run `npm run test:visual` after browser setup.
- For host changes follow [native QA](docs/QA.md). Report the host, version, theme, fixture and states actually checked.
- See [CONTRIBUTING.md](CONTRIBUTING.md) for the review workflow.

## Reuse in another repository

Point the agent at this file and the task-specific row above. Set the artifact's audience
and task in the brief. When repository links are impractical, copy [DESIGN.md](DESIGN.md)
with the generated tokens or install [the portable design workflow](packages/agent-skill/).
