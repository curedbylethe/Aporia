# Capture provenance

Lacuna theme source is Aporia **0.2.0**. Each Paper and Ink pair uses the same fixture, host configuration and capture method. The native windows were captured directly on Debian GNU/Linux 13 with X.Org Xvfb 21.1.16 and Mesa software rendering. PNGs use display sRGB values from the default X11 output with no custom ICC profile.

| Host | Fixture and visible evidence | Paper | Ink |
| --- | --- | --- | --- |
| Helix 25.07.1 in Kitty 0.51.1 | [resolve.ts](../../previews/fixtures/resolve.ts), Tree-sitter syntax, selection, cursor and status line | [Paper](native/helix-paper.png) | [Ink](native/helix-ink.png) |
| Zed 1.30.2 | [resolve.ts](../../previews/fixtures/resolve.ts), TypeScript syntax, text selection and editor chrome (Restricted Mode) | [Paper](native/zed-paper.png) | [Ink](native/zed-ink.png) |
| Kitty 0.51.1 | [terminal.py](../../previews/fixtures/terminal.py), terminal defaults and all 16 ANSI background slots | [Paper](native/kitty-paper.png) | [Ink](native/kitty-ink.png) |

## Browser captures

The [identity plate](aporia-identity.png) renders [site/identity.html](../../site/identity.html). The [comparison](gallery-browser.png), [Helix specimen](helix-ink-browser.png) and [Zed specimen](zed-paper-browser.png) render the browser gallery in Chromium. Browser specimens are simulated layouts. See [reference capture provenance](../../references/CAPTURES.md) for browser version and reproduction.

## Reproduce native captures

1. Install each generated theme using the [installation guide](../INSTALL.md).
2. In Helix, open `previews/fixtures/resolve.ts`, disable LSP for this capture, enable cursor line and select the same text in both modes.
3. In Zed, open the same file, select the theme edition explicitly and keep buffer font size, scroll position and editor chrome stable.
4. In Kitty, open a fresh window for each edition and run `python3 previews/fixtures/terminal.py`.
5. Capture the host window. Record theme revision, host version, OS, fixture, visible states and any color-profile or rendering configuration. Use [QA](../QA.md) for release acceptance across additional states.
