# Terminal design

A terminal translates Aporia's hierarchy into cells. Begin with an identity line and one useful status summary. Put the primary list on the left and evidence on the right when both fit. Stack at narrow widths or let the detail view replace the list while retaining its selection.

| Role | Lacuna mapping | Capability fallback |
| --- | --- | --- |
| Main text and background | `terminal.fg` and `terminal.bg` | Terminal defaults |
| Selected row | `editor.selection` and a leading marker | Reverse video and a leading marker |
| Focus | `border.focus` on a legible ground | Bracket, cursor or named active region |
| Warning and danger | Named status and `status.warning` or `status.danger` | Explicit status text and a mark |
| ANSI colors | Generated `terminal.ansi-0…15` | Host palette or monochrome where unavailable |

Keep editing keys local to an active search field. In navigation state expose arrows or `j/k`, search, Inspect and Escape. Clear a mode on Escape before exiting. Keep status and evidence distinct. For confirmation, show target name and ID, exact action and the cancel path. Revalidate a real process identity immediately before taking action because PIDs can be reused.

Use the terminal's font and note whether it supports Unicode, bidi and truecolor. Supply plain ASCII glyph fallbacks where necessary, respect `NO_COLOR`, and keep truncation or wrapping predictable. Test 80×24 and a narrower screen as well as a wide layout. The [process review](../references/terminal/process-review/) includes an offline keyboard simulation and a real terminal demonstration with fixture data.
