# Typography

The canonical ramp lives under `type` in `aporia/tokens.json`. Each role exposes size, leading, tracking and weight in the generated CSS and JSON. The web fonts are Russo One, Golos Text and JetBrains Mono, with canonical fallback stacks.

| Role | Use |
| --- | --- |
| Masthead | Short identity plate or publication wordmark. |
| Display | One short masthead or title. Web display may scale with viewport width. |
| Heading | Section headings, tool labels and titles inside a document. |
| Lead | Brief opening context or a single decision summary. |
| Body | Prose, instructions and form labels. Keep normal case. |
| Compact | Data rows, captions and dense controls. Preserve comfortable line spacing. |
| Metadata | Short identifiers, folios and dates. Uppercase tracking is optional where case is meaningful. |
| Code | Code, command output and technical identifiers. Keep case and normal tracking. |

Align numeric table columns by the decimal or right edge and use tabular figures. Put units in their headers. In RTL text, isolate paths, symbols and codes with `bdi` or an appropriate direction attribute. Use the host's fixed-width font in TUI work and verify shaped text and column widths on the target. In print, test body readability and page breaks with the actual print stylesheet.

See the [résumé](../references/editorial/resume/) for a print-focused hierarchy and the [study guide](../references/documentation/study-guide/) for prose next to runnable code.
