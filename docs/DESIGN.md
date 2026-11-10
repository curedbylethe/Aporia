# Design reference and specimen status

The repository publishes both installable Lacuna themes and an editorial demonstration gallery. They are distinct products generated from the same tokens.

| Artifact | Status | Intended use |
|---|---|---|
| `aporia/RULES.md` | Authoritative | Core / Editorial / Interface / Lacuna scope |
| `aporia/tokens.json` | Authoritative | All numeric and semantic color values |
| `dist/*` | Generated production output | Installable themes and web values |
| `previews/dist/index.html` | Generated illustrative design | Explore both modes and browse 24 specimens |
| `previews/dist/*-specimen.html` | Illustrative code plate | Inspect syntax and staged diagnostics |
| `previews/dist/*-work.html` | Illustrative working plate | Inspect simulated editor states |

The gallery deliberately frames code-editing surfaces as Aporia editorial documents. That framing is **not** an instruction for editor apps to replicate those layouts. The actual code colors originate from semantic roles; real host UI chrome and capture behavior remain platform-specific.

The canonical selection role takes precedence over the source gallery's older reverse-video specimen treatment. No second palette is maintained for screenshots. See [ARCHITECTURE.md](ARCHITECTURE.md).
