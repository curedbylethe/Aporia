# Interface

Arrange screens around task sequence and frequency. Put the action near its target. Give dense data a stable grid with explicit units and an identifiable row key. Use surfaces for persistent regions, temporary overlays and state changes.

| Pattern | Behavior |
| --- | --- |
| Navigation | Use anchors for destinations and buttons for commands. Keep the active destination marked and named. |
| Search and filters | Name the input, keep the current value visible and describe empty results. Maintain logical focus. |
| Data table | Retain headers, expose sorting state where available and keep overflow local to the table. |
| Dialog | Name the dialog, move focus to a safe action, accept Escape, trap Tab and restore focus on close. |
| Selected row | Pair the changed ground with an edge, bracket or a label. Use a separate focus cue. |
| Error | Name what happened and the affected object. Provide a recovery action when one exists. |

Use an ink primary action on Paper and the inverse on Ink. Reserve red for marked emphasis and functional states. Keep touch targets at least 44px and respect keyboard and reduced-motion preferences. Check loading, empty, invalid, selected, disabled and completed states where the workflow has them.

The [instrument](../references/interface/instrument/) foregrounds a single operating loop. The [dashboard](../references/interface/dense-dashboard/) foregrounds comparison and inspection.
