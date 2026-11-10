# Host and visual QA checklist

Browser specimens are **staged simulations**, not authentic screenshots. Run the following before tagging a release.

## Build gate

- [ ] `npm run build` completes successfully.
- [ ] `npm test` passes canonical contrast and artifact/link checks.
- [ ] `npm run check:drift` produces no generated-file changes.
- [ ] Theme files are inspected for unintended platform-specific colors.

## Editor acceptance (both Paper and Ink)

| Host | Manual checks |
|---|---|
| Helix | `:theme lacuna-paper` and `:theme lacuna-ink` work, no theme errors; syntax and selection; `ui.cursorline.primary` and active line number; errors/warnings; diagnostics; diffs; modal cursor shapes |
| Zed | Theme family appears with both modes; syntax and LSP semantic tokens; selected text; active line; find matches; diagnostics; Git diff decorations; collaborator cursors |
| VS Code | Themes appear in Color Theme picker; TextMate and semantic token highlights; find, selection, cursor line, diff editor, problems, integrated terminal, search and sidebars |

Open real `.ts`, `.rs`, `.go`, Markdown and mixed-language files. Compare Paper and Ink under the same content. Screenshot each tool with diagnostics, a visible multiline selection, Git change markers, multiple cursors and a search hit. Record host version, OS, color profile and screenshot provenance.

## Terminal acceptance

| Terminal | Manual checks |
|---|---|
| Kitty | Include file loads, foreground/background/cursor/selection distinguishable, ANSI 0–15, tabs, links |
| Ghostty | Both named themes load; automatic OS appearance switch; ANSI and selection; tabs and cursor contrast |
| Alacritty | TOML import loads without warnings; normal/bright ANSI; cursor and selection |
| WezTerm | Lua module loads, 16 ANSI colors present, cursor/selection and tabs |

Run a truecolor test and an ANSI 0–15 matrix in both modes. For 256-color terminal sessions, note visible quantization differences. A browser snapshot is not sufficient to verify terminal rendering.

## Gallery acceptance

- [ ] Open `previews/dist/index.html` without a server; both mode panels appear.
- [ ] Filter the specimen list by host, mode, language and kind.
- [ ] Navigate to a specimen; all 24 combinations exist.
- [ ] Active Host / Edition / Language / View are visibly marked.
- [ ] Clicking Record expands its disclosure; role table shows actual generated values.
- [ ] All footer and cross-page links work locally.
- [ ] Check 390px mobile and 1440px desktop for document-wide overflow.
- [ ] Confirm calculated contrast and rendered host screenshots are separately labeled.

## Open limitations

1. Native editors and terminal emulators are not shipped with this repository; real-host QA cannot be demonstrated by Node checks alone.
2. Zed publishes a JSON schema (v0.2.0) but support for a specific set of style keys varies with the installed build. If a key is ignored or mapped differently, document and adjust the adapter.
3. Browser approximations tokenize code themselves. They do not reproduce Helix's grammar captures or Zed/VS Code semantic-token precedence.
4. Persian shaping, terminal cell widths, ligatures and font coverage are host/font responsibilities, not color-theme features.
