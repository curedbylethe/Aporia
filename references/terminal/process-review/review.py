#!/usr/bin/env python3
"""Aporia TUI reference using bundled synthetic process records."""
import curses

RECORDS = [
    ('worker / 4312', '220 MiB RSS', 'Parent exited. Review recommended.'),
    ('python / 5332', '16 MiB RSS', 'An old service is still listening.'),
    ('node / 4817', '34 MiB RSS', 'Launch context is unavailable.'),
]


def review(screen):
    curses.curs_set(0)
    query, selected, searching, confirming, status = '', 0, False, False, ''
    while True:
        rows, cols = screen.getmaxyx()
        findings = [record for record in RECORDS if query.lower() in record[0]]
        active = findings[selected] if findings else None
        screen.erase()

        def line(y, x, text, attributes=0):
            if 0 <= y < rows and 0 <= x < cols - 1:
                screen.addnstr(y, x, text, cols - x - 1, attributes)

        line(0, 0, 'APORIA / PROCESS REVIEW', curses.A_BOLD)
        line(1, 0, 'Synthetic observations')
        line(3, 0, f'Filter: {query}' + ('_' if searching else ''))
        for index, (name, memory, _) in enumerate(findings):
            marker = '>' if index == selected else ' '
            style = curses.A_REVERSE if index == selected else 0
            line(5 + index, 0, f'{marker} {name:<18} {memory}', style)

        detail_row, detail_col = (5, 38) if cols >= 78 else (9, 0)
        line(detail_row, detail_col, 'EVIDENCE', curses.A_BOLD)
        line(detail_row + 1, detail_col, active[2] if active else 'No matching findings.')
        line(detail_row + 2, detail_col, f'Simulate close for {active[0]}?' if confirming else status)
        hint = 'Enter Confirm | Esc Cancel' if confirming else (
            'Enter Done | Esc Clear' if searching else 'Up/Down Select | / Filter | c Review close | Esc Exit'
        )
        line(rows - 1, 0, hint)
        screen.refresh()
        key = screen.get_wch()

        if confirming:
            if key in ('\n', '\r'):
                status = f'Simulated close for {active[0]}.'
            elif key != '\x1b':
                continue
            confirming = False
        elif searching:
            if key == '\x1b':
                query, selected, searching = '', 0, False
            elif key in ('\n', '\r'):
                searching = False
            elif key in (curses.KEY_BACKSPACE, '\x7f', '\b'):
                query, selected = query[:-1], 0
            elif isinstance(key, str) and key.isascii() and key.isprintable():
                query, selected = query + key, 0
        elif key in ('q', '\x1b'):
            return
        elif key == '/':
            searching = True
        elif active and key in ('j', curses.KEY_DOWN):
            selected = (selected + 1) % len(findings)
        elif active and key in ('k', curses.KEY_UP):
            selected = (selected - 1) % len(findings)
        elif active and key == 'c':
            confirming = True


if __name__ == '__main__':
    curses.wrapper(review)
