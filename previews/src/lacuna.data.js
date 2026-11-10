/* Lacuna — shared data. Values marked "taken" come from the supplied
   lacuna.html / aporia.html references; "derived" values reuse an existing
   role rather than introducing a new hue. */

const LANGUAGES = [
  { id: "rust", label: "Rust", file: "theme/src/resolve.rs", editor: "rust" },
  { id: "typescript", label: "TypeScript", file: "theme/compile.ts", editor: "typescript" },
  { id: "go", label: "Go", file: "cmd/lacunad/main.go", editor: "go" },
];

const HOSTS = [
  { id: "helix", label: "Helix" },
  { id: "zed", label: "Zed" },
];

const VARIANTS = [
  { id: "paper", label: "Paper", appearance: "light" },
  { id: "ink", label: "Ink", appearance: "dark" },
];

const KINDS = [
  { id: "specimen", label: "Code specimen", short: "Specimen" },
  { id: "work", label: "Working environment", short: "Working" },
];

/* 3 languages x 2 variants x 2 hosts x 2 presentations = 24 */
const MATRIX = [];
HOSTS.forEach((host) => {
  VARIANTS.forEach((variant) => {
    LANGUAGES.forEach((language) => {
      KINDS.forEach((kind) => {
        MATRIX.push({
          host: host.id,
          variant: variant.id,
          lang: language.id,
          kind: kind.id,
          name: `${host.label} / ${variant.label} / ${language.label} / ${kind.label}`,
          slug: `${host.id}-${variant.id}-${language.id}-${kind.id}`,
        });
      });
    });
  });
});

const CODE = {
  rust: `//! Resolve semantic roles into a host palette.
//! Paper and Ink share one mapping; only the values change.

use std::collections::BTreeMap;
use std::fmt;

use serde::Deserialize;

/// The two editions of the Lacuna family.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Edition {
    Paper,
    Ink,
}

/// A role is named once and resolved per edition.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum Role {
    Background,
    Foreground,
    Muted,
    Keyword,
    Type(String),
    String,
    Number,
    Comment,
}

#[derive(Debug)]
pub enum ResolveError {
    Missing(Role),
    Unreadable { role: Role, ratio: f64 },
}

impl fmt::Display for ResolveError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Missing(role) => write!(f, "role {role} is not defined"),
            Self::Unreadable { role, ratio } => {
                write!(f, "{role} at {ratio:.2}:1 is below the 4.5:1 floor")
            }
        }
    }
}

pub trait Palette {
    fn edition(&self) -> Edition;
    fn value<'a>(&'a self, role: &Role) -> Option<&'a str>;
}

pub fn resolve<'a, P: Palette + ?Sized>(
    palette: &'a P,
    roles: &[Role],
) -> Result<BTreeMap<String, &'a str>, ResolveError> {
    let mut values = BTreeMap::new();
    for role in roles {
        let value = palette.value(role).ok_or_else(|| ResolveError::Missing(role.clone()))?;
        values.insert(role.to_string(), value);
    }
    Ok(values)
}

pub async fn audit<P: Palette + ?Sized>(palette: &P, roles: &[Role]) -> Vec<ResolveError> {
    let resolved = match resolve(palette, roles) {
        Ok(resolved) => resolved,
        Err(err) => return vec![err],
    };
    roles
        .iter()
        .filter_map(|role| {
            let ratio = contrast(resolved.get(&role.to_string())?, resolved.get("Background")?);
            (ratio < 4.5).then_some(ResolveError::Unreadable { role: role.clone(), ratio })
        })
        .collect()
}

fn contrast(fg: &str, bg: &str) -> f64 {
    let (a, b) = (luminance(fg), luminance(bg));
    (a.max(b) + 0.05) / (a.min(b) + 0.05)
}

fn luminance(hex: &str) -> f64 {
    let channel = |i: usize| {
        let byte = u8::from_str_radix(&hex[i..i + 2], 16).unwrap_or(0);
        let value = f64::from(byte) / 255.0;
        if value <= 0.04045 { value / 12.92 } else { ((value + 0.055) / 1.055).powf(2.4) }
    };
    0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}`,

  typescript: `// Compile one edition of Lacuna from a flat token source.
import { readFile } from "node:fs/promises";
import type { Edition, ScopeName } from "./tokens.js";

export type Role =
  | "background"
  | "foreground"
  | "keyword"
  | "type"
  | "string"
  | "number"
  | "comment";

export interface Rule {
  readonly role: Role;
  readonly paper: string;
  readonly ink: string;
  /** Host scopes this role may attach to. */
  readonly scopes?: readonly ScopeName[];
}

export type Source =
  | { kind: "file"; path: string }
  | { kind: "inline"; rules: readonly Rule[] };

export interface Compiled {
  edition: Edition;
  rules: ReadonlyMap<Role, string>;
  origin: string;
}

export type Failure = {
  code: "MALFORMED" | "DUPLICATE" | "MISSING";
  role: Role;
  message: string;
};

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; failures: readonly Failure[] };

const REQUIRED: readonly Role[] = [
  "background", "foreground", "keyword", "string", "number", "comment",
];

export async function compile(source: Source, edition: Edition): Promise<Result<Compiled>> {
  const rules = source.kind === "inline"
    ? source.rules
    : await parse(await readFile(source.path, "utf8"));
  const failures: Failure[] = [];
  const resolved = new Map<Role, string>();

  for (const rule of rules) {
    const value = edition === "paper" ? rule.paper : rule.ink;
    if (!/^#[0-9a-f]{6}$/i.test(value)) {
      failures.push({
        code: "MALFORMED",
        role: rule.role,
        message: \`\${rule.role} is not a hex colour: \${value}\`,
      });
      continue;
    }
    if (resolved.has(rule.role)) {
      failures.push({ code: "DUPLICATE", role: rule.role, message: \`\${rule.role} defined twice\` });
      continue;
    }
    resolved.set(rule.role, value);
  }

  for (const role of REQUIRED) {
    if (!resolved.has(role)) {
      failures.push({ code: "MISSING", role, message: \`\${role} is required\` });
    }
  }

  if (failures.length > 0) return { ok: false, failures };
  return { ok: true, value: { edition, rules: resolved, origin: describe(source) } };
}

function describe(source: Source): string {
  return source.kind === "inline"
    ? \`inline · \${source.rules.length} rules\`
    : \`file · \${source.path.split("/").at(-1)}\`;
}

async function parse(text: string): Promise<Rule[]> {
  return text
    .split("\\n")
    .filter((line) => line.trim().startsWith("role"))
    .map((line) => {
      const [role, paper, ink, ...rest] = line.trim().split(/\\s+/);
      return { role: role as Role, paper, ink, scopes: rest as ScopeName[] };
    });
}

export function summarize(result: Result<Compiled>): string {
  if (!result.ok) return result.failures.map((f) => \`\${f.code}: \${f.message}\`).join(" · ");
  const { edition, rules, origin } = result.value;
  return \`\${edition} · \${rules.size} roles · \${origin}\`;
}`,

  go: `// Command lacunad serves resolved Lacuna themes to host adapters.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"
)

const defaultAddr = ":7314"

type Edition string

const (
	Paper Edition = "paper"
	Ink   Edition = "ink"
)

type Palette struct {
	Edition Edition           \`json:"edition"\`
	Roles   map[string]string \`json:"roles"\`
}

type Resolver interface {
	Resolve(ctx context.Context, edition Edition) (Palette, error)
	Describe() string
}

type fileResolver struct {
	path string
	mu   sync.RWMutex
}

func (r *fileResolver) Describe() string {
	return "file:" + r.path
}

func (r *fileResolver) Resolve(ctx context.Context, edition Edition) (Palette, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	select {
	case <-ctx.Done():
		return Palette{}, fmt.Errorf("resolve %s: %w", edition, ctx.Err())
	default:
	}

	if edition != Paper && edition != Ink {
		return Palette{}, fmt.Errorf("unknown edition %q", edition)
	}
	return Palette{Edition: edition, Roles: map[string]string{"keyword": "#b01e28"}}, nil
}

func handler(res Resolver) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		edition := Edition(r.URL.Query().Get("edition"))
		palette, err := res.Resolve(r.Context(), edition)
		if err != nil {
			if errors.Is(err, context.Canceled) {
				http.Error(w, "request cancelled", http.StatusRequestTimeout)
				return
			}
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(palette); err != nil {
			slog.Error("encode palette", "err", err)
		}
	}
}

func main() {
	addr := defaultAddr
	if value := os.Getenv("LACUNA_ADDR"); value != "" {
		addr = value
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	res := &fileResolver{path: "./themes/lacuna.toml"}
	srv := &http.Server{Addr: addr, Handler: handler(res), ReadHeaderTimeout: 5 * time.Second}

	go func() {
		slog.Info("serving", "addr", addr, "source", res.Describe())
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("listen", "err", err)
			stop()
		}
	}()

	<-ctx.Done()
	shutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdown); err != nil {
		slog.Error("shutdown", "err", err)
	}
}`,
};

/* Working-session state. Anchors are substrings; line numbers are resolved at
   render time so the specimen and the session can never drift apart. */
const STATES = {
  rust: {
    active: "let mut values = BTreeMap::new();",
    selection: [
      "let value = palette.value(role).ok_or_else",
      "values.insert(role.to_string(), value);",
    ],
    secondary: "Ok(values)",
    find: "contrast",
    searchQuery: "contrast",
    diags: [
      {
        level: "error",
        anchor: "let ratio = contrast(resolved.get(&role.to_string())?",
        pick: "resolved.get(&role.to_string())?",
        len: 30,
        message: "cannot borrow `resolved` as mutable — help: bind the value first",
      },
      {
        level: "warning",
        anchor: "let resolved = match resolve(palette, roles) {",
        pick: "resolved",
        len: 8,
        message: "unused variable: `resolved` — did you mean `values`?",
      },
      {
        level: "info",
        anchor: "pub async fn audit",
        pick: "audit",
        len: 5,
        message: "3 call sites — this function is used across the workspace",
      },
    ],
    diff: [
      { type: "change", anchor: "Self::Missing(role) => write!(f, \"role {role} is not defined\")," },
      { type: "add", anchor: "Self::Unreadable { role, ratio } => {" },
      { type: "add", anchor: "write!(f, \"{role} at {ratio:.2}:1 is below the 4.5:1 floor\")" },
      { type: "remove", anchor: "    Unreadable { role: Role, ratio: f64 }," },
    ],
    completion: { anchor: "let value = palette.value(role)", pick: "palette.value", items: ["value()", "edition()", "scope", "roles"] },
    specimenDiags: [
      {
        level: "error",
        anchor: "Self::Missing(role) => write!(f, \"role {role} is not defined\"),",
        pick: "{role}",
        len: 6,
        message: "`Role` doesn't implement `std::fmt::Display`, so the default formatter cannot print it (E0277).",
      },
      {
        level: "warning",
        anchor: "pub enum ResolveError {",
        pick: "ResolveError",
        len: 12,
        message: "large difference between enum variants; consider boxing the payload (clippy::large_enum_variant).",
      },
    ],
    command: "w",
    cursorNote: "2 cursors",
  },
  typescript: {
    active: "const failures: Failure[] = [];",
    selection: [
      "if (!/^#[0-9a-f]{6}$/i.test(value)) {",
      "failures.push({",
    ],
    secondary: "continue;",
    find: "failures",
    searchQuery: "failures",
    diags: [
      {
        level: "error",
        anchor: "const rules = source.kind === \"inline\"",
        pick: "source.kind",
        len: 11,
        message: "Property 'rules' does not exist on type 'Source' — narrow the union first",
      },
      {
        level: "warning",
        anchor: "const [role, paper, ink, ...rest] = line.trim().split(/\\s+/);",
        pick: "rest",
        len: 4,
        message: "'rest' is declared but its value is never read",
      },
    ],
    diff: [
      { type: "change", anchor: "  code: \"MALFORMED\" | \"DUPLICATE\" | \"MISSING\";" },
      { type: "remove", anchor: "  role: Role;" },
      { type: "add", anchor: "  message: string;" },
      { type: "add", anchor: "  | { ok: false; failures: readonly Failure[] };" },
    ],
    completion: { anchor: "const value = edition === \"paper\"", pick: "edition", items: ["paper", "ink", "edition", "rules"] },
    specimenDiags: [
      {
        level: "error",
        anchor: "return { role: role as Role, paper, ink, scopes: rest as ScopeName[] };",
        pick: "rest as ScopeName[]",
        len: 19,
        message: "Conversion of type 'string[]' to type 'ScopeName[]' may be a mistake: neither type overlaps enough (TS2352).",
      },
      {
        level: "warning",
        anchor: "// Compile one edition of Lacuna from a flat token source.",
        pick: "// Compile one edition",
        len: 22,
        message: "File is not listed in tsconfig.json; language features fall back to the inferred project.",
      },
    ],
    command: "reload",
    cursorNote: "2 cursors",
  },
  go: {
    active: "select {",
    selection: [
      "if edition != Paper && edition != Ink {",
      "return Palette{}, fmt.Errorf(\"unknown edition %q\", edition)",
    ],
    secondary: "defer r.mu.RUnlock()",
    find: "edition",
    searchQuery: "edition",
    diags: [
      {
        level: "error",
        anchor: "return Palette{}, fmt.Errorf(\"unknown edition %q\", edition)",
        pick: "Palette{}",
        len: 9,
        message: "cannot use Palette{} as map[string]string value in return statement",
      },
      {
        level: "warning",
        anchor: "res := &fileResolver{path: \"./themes/lacuna.toml\"}",
        pick: "res",
        len: 3,
        message: "res is assigned but only used once — consider inlining",
      },
      {
        level: "info",
        anchor: "ctx, stop := signal.NotifyContext",
        pick: "NotifyContext",
        len: 13,
        message: "requires Go 1.16 or later",
      },
    ],
    diff: [
      { type: "change", anchor: "edition := Edition(r.URL.Query().Get(\"edition\"))" },
      { type: "add", anchor: "if errors.Is(err, context.Canceled) {" },
      { type: "add", anchor: "http.Error(w, \"request cancelled\", http.StatusRequestTimeout)" },
      { type: "remove", anchor: "http.Error(w, err.Error(), http.StatusBadRequest)" },
    ],
    completion: { anchor: "palette, err := res.Resolve(r.Context(), edition)", pick: "res.Resolve", items: ["Resolve()", "Describe()", "Roles", "Edition"] },
    specimenDiags: [
      {
        level: "error",
        anchor: "ctx, stop := signal.NotifyContext(",
        pick: "signal.NotifyContext",
        len: 20,
        message: "undefined: signal.NotifyContext — the module declares go 1.15, before it was added.",
      },
      {
        level: "warning",
        anchor: "slog.Error(\"encode palette\", \"err\", err)",
        pick: "\"err\"",
        len: 5,
        message: "sloglint: structured log key should be \"error\", not \"err\".",
      },
    ],
    command: "c",
    cursorNote: "2 cursors",
  },
};

/* Role map. Every row is a semantic role; the two editions resolve it
   differently without changing its meaning. */
const ROLES = [
  { id: "background", label: "Background", paper: GALLERY_COLORS.paper["bg.canvas"], ink: GALLERY_COLORS.ink["bg.canvas"], provenance: "taken", helix: "ui.background", zed: "background", use: "Editor canvas, terminal body" },
  { id: "surface", label: "Surface / chrome", paper: GALLERY_COLORS.paper["bg.surface"], ink: GALLERY_COLORS.ink["bg.surface"], provenance: "taken", helix: "ui.statusline", zed: "status_bar.background", use: "Status line, panels, buffer bar" },
  { id: "foreground", label: "Foreground", paper: GALLERY_COLORS.paper["fg.primary"], ink: GALLERY_COLORS.ink["fg.primary"], provenance: "taken", helix: "ui.text", zed: "text", use: "Variables, parameters, prose" },
  { id: "muted", label: "Muted text", paper: GALLERY_COLORS.paper["editor.line-number"], ink: GALLERY_COLORS.ink["editor.line-number"], provenance: "taken", helix: "ui.text.inactive", zed: "text.muted", use: "Line numbers, inactive tabs, hints" },
  { id: "comment", label: "Comment", paper: GALLERY_COLORS.paper["syntax.comment"], ink: GALLERY_COLORS.ink["syntax.comment"], provenance: "adjusted", helix: "comment", zed: "syntax.comment", use: "Line comments; Paper raised from #666258 for selection contrast" },
  { id: "doc", label: "Doc comment", paper: GALLERY_COLORS.paper["syntax.comment"], ink: GALLERY_COLORS.ink["syntax.comment"], provenance: "derived", helix: "comment.documentation", zed: "syntax.comment.doc", use: "///, //!, /** */ — same hue, weight 500" },
  { id: "keyword", label: "Keyword", paper: GALLERY_COLORS.paper["syntax.keyword"], ink: GALLERY_COLORS.ink["syntax.keyword"], provenance: "taken", helix: "keyword", zed: "syntax.keyword", use: "fn, let, impl, async, package, type" },
  { id: "control", label: "Control flow", paper: GALLERY_COLORS.paper["syntax.keyword"], ink: GALLERY_COLORS.ink["syntax.keyword"], provenance: "derived", helix: "keyword.control", zed: "syntax.keyword", use: "if, match, for, return, select — reuses keyword" },
  { id: "type", label: "Type", paper: GALLERY_COLORS.paper["syntax.type"], ink: GALLERY_COLORS.ink["syntax.type"], provenance: "taken", helix: "type", zed: "syntax.type", use: "Structs, interfaces, traits, primitives" },
  { id: "namespace", label: "Namespace / module", paper: GALLERY_COLORS.paper["syntax.type"], ink: GALLERY_COLORS.ink["syntax.type"], provenance: "derived", helix: "namespace", zed: "syntax.type", use: "std, fmt, serde — reuses type" },
  { id: "function", label: "Function / method", paper: GALLERY_COLORS.paper["syntax.function"], ink: GALLERY_COLORS.ink["syntax.function"], provenance: "derived", helix: "function", zed: "syntax.function", use: "Declarations and calls; foreground at weight 500" },
  { id: "parameter", label: "Parameter / property", paper: GALLERY_COLORS.paper["syntax.variable"], ink: GALLERY_COLORS.ink["syntax.variable"], provenance: "derived", helix: "variable.parameter", zed: "syntax.variable", use: "No separate hue — reuse foreground" },
  { id: "string", label: "String", paper: GALLERY_COLORS.paper["syntax.string"], ink: GALLERY_COLORS.ink["syntax.string"], provenance: "taken", helix: "string", zed: "syntax.string", use: "Literals, template text" },
  { id: "escape", label: "Escape / format arg", paper: GALLERY_COLORS.paper["syntax.number"], ink: GALLERY_COLORS.ink["syntax.number"], provenance: "derived", helix: "string.escape", zed: "syntax.string.escape", use: "\\n, {ratio:.2}, ${x} — reuses number" },
  { id: "number", label: "Number", paper: GALLERY_COLORS.paper["syntax.number"], ink: GALLERY_COLORS.ink["syntax.number"], provenance: "taken", helix: "constant.numeric", zed: "syntax.number", use: "Integers, floats, durations" },
  { id: "constant", label: "Constant / boolean", paper: GALLERY_COLORS.paper["syntax.number"], ink: GALLERY_COLORS.ink["syntax.number"], provenance: "derived", helix: "constant", zed: "syntax.boolean", use: "true, false, nil, status codes" },
  { id: "operator", label: "Operator", paper: GALLERY_COLORS.paper["syntax.operator"], ink: GALLERY_COLORS.ink["syntax.operator"], provenance: "derived", helix: "operator", zed: "syntax.operator", use: "= == < && ?. — muted, never accent" },
  { id: "punctuation", label: "Punctuation", paper: GALLERY_COLORS.paper["syntax.punctuation"], ink: GALLERY_COLORS.ink["syntax.punctuation"], provenance: "derived", helix: "punctuation", zed: "syntax.punctuation", use: "Braces, commas, delimiters" },
  { id: "attribute", label: "Attribute / macro", paper: GALLERY_COLORS.paper["syntax.macro"], ink: GALLERY_COLORS.ink["syntax.macro"], provenance: "derived", helix: "attribute", zed: "syntax.attribute", use: "#[derive], @decorator, println! — reuses type" },
  { id: "selection", label: "Selection", paper: GALLERY_COLORS.paper["editor.selection"], ink: GALLERY_COLORS.ink["editor.selection"], provenance: "derived", helix: "ui.selection", zed: "element.selected", use: "Editor selection from canonical semantic tokens; syntax remains colored" },
  { id: "current-match", label: "Current match", paper: GALLERY_COLORS.paper["editor.search-match"], ink: GALLERY_COLORS.ink["editor.search-match"], provenance: "derived", helix: "not exposed — drawn with ui.selection", zed: "search.active_match_background", use: "Host search-match color; actual mark treatment is host-specific" },
  { id: "activeline", label: "Active line", paper: GALLERY_COLORS.paper["editor.line-active"], ink: GALLERY_COLORS.ink["editor.line-active"], provenance: "derived", helix: "ui.cursorline.primary", zed: "editor.highlighted_line.background", use: "Cursor line wash; line number stays onyx" },
  { id: "search", label: "Search match", paper: GALLERY_COLORS.paper["editor.search-match"], ink: GALLERY_COLORS.ink["editor.search-match"], provenance: "derived", helix: "not exposed — falls back to ui.selection", zed: "search.match_background", use: "Canonical editor.search-match with host-specific treatment" },
  { id: "diff", label: "Diff add / remove", paper: GALLERY_COLORS.paper["editor.diff-added"], ink: GALLERY_COLORS.ink["editor.diff-added"], provenance: "derived", helix: "diff.plus / diff.minus", zed: "diff.plus / diff.minus", use: "Canonical diff surface plus gutter mark" },
  { id: "diagnostic", label: "Diagnostics", paper: [GALLERY_COLORS.paper["status.danger"], GALLERY_COLORS.paper["status.warning"], GALLERY_COLORS.paper["status.info"]].join(" / "), ink: [GALLERY_COLORS.ink["status.danger"], GALLERY_COLORS.ink["status.warning"], GALLERY_COLORS.ink["status.info"]].join(" / "), provenance: "taken", helix: "diagnostic.error / warning / info", zed: "error / warning / info", use: "Always carries E / W / I plus a message" },
];

/* Preview surfaces map to the same semantic roles used by the host adapters. */
const SURFACE_ROLES = {
  selection: "editor.selection", "active-line": "editor.line-active",
  search: "editor.search-match", "search-soft": "editor.search-match",
  "diff-add": "editor.diff-added", "diff-remove": "editor.diff-removed",
  "diff-change": "interactive.hover",
};
const SURFACES = {
  paper: Object.fromEntries(Object.entries(SURFACE_ROLES).map(([k, role]) => [k, { role }])),
  ink: Object.fromEntries(Object.entries(SURFACE_ROLES).map(([k, role]) => [k, { role }])),
};

const CONTRAST_PAIRS = [
  { fg: "foreground", bg: "background", use: "Body text, variables", min: 4.5 },
  { fg: "muted", bg: "background", use: "Line numbers, secondary UI", min: 4.5 },
  { fg: "muted", bg: "surface", use: "Status line, inactive tabs", min: 4.5 },
  { fg: "comment", bg: "background", use: "Comments", min: 4.5 },
  { fg: "keyword", bg: "background", use: "Keywords", min: 4.5 },
  { fg: "type", bg: "background", use: "Types, namespaces", min: 4.5 },
  { fg: "string", bg: "background", use: "Strings", min: 4.5 },
  { fg: "number", bg: "background", use: "Numbers, constants", min: 4.5 },
  { fg: "foreground", bg: "selection", use: "Normal editor text on the canonical selection background", min: 4.5 },
  { fg: "type", bg: "search", use: "Types inside a search match", min: 4.5 },
  { fg: "comment", bg: "search", use: "Comments inside the current match", min: 4.5 },
  { fg: "type", bg: "search-soft", use: "Types inside an ordinary match", min: 4.5 },
  { fg: "foreground", bg: "active-line", use: "Text on the cursor line", min: 4.5 },
  { fg: "comment", bg: "active-line", use: "Comments on the cursor line", min: 4.5 },
  { fg: "foreground", bg: "diff-add", use: "Added lines", min: 4.5 },
  { fg: "keyword", bg: "diff-remove", use: "Removed lines, syntax preserved", min: 4.5 },
  { fg: "type", bg: "diff-change", use: "Changed lines", min: 4.5 },
  { fg: "diagnostic", bg: "background", use: "Error text, Paper red / Ink red", min: 3, note: "diagnostic is a two-value role; checked against the error value" },
];

const HOST_NOTES = {
  helix: {
    title: "Helix",
    install: "~/.config/helix/themes/lacuna-paper.toml and lacuna-ink.toml. Select with `theme = \"lacuna-ink\"` in config.toml.",
    shape: "A flat TOML table of scopes. `[palette]` may hold reusable names; every other key is a capture or UI role.",
    scopes: [
      ["Colour values", "[palette] bone = \"#ede4d3\" — referenced as bone elsewhere in the file"],
      ["Document surface", "ui.background / ui.text / ui.text.inactive"],
      ["Syntax", "keyword, keyword.control, type, string, constant.numeric, function, comment"],
      ["Selection & cursor", "ui.selection, ui.cursor, ui.cursorline.primary, ui.linenr.selected"],
      ["Diagnostics", "diagnostic.error / .warning / .info — plus `ui.virtual.wrap`? no: the gutter sign is drawn by Helix"],
      ["Diff", "diff.plus, diff.minus, diff.delta, diff.plus.gutter, diff.minus.gutter"],
      ["Mode blocks", "ui.statusline.normal / .insert / .select — the mode word plus its fill; visual mode is VIS, select mode is SEL"],
      ["Terminal", "Not built in. Helix runs inside the terminal; terminal ANSI is configured by the emulator, not the theme"],
    ],
    limits: [
      "Tree-sitter captures only. Helix does not consume LSP semantic tokens, so `function` cannot distinguish a local closure from a method by token type alone.",
      "No separate foreground for doc comments is guaranteed; the adapter maps comment.documentation and falls back to comment.",
      "Truecolor support is required for every hex above. On a 256-colour terminal Helix quantises and the measured ratios no longer hold.",
      "The active line number has its own key; the line number itself has none, so both resolve to muted.",
      "Visual mode is a state, not a syntax colour. Approval of VIS rests on the mode word staying legible on its fill: bone on sage measures 5.42:1 in Paper, coal on sage 7.40:1 in Ink.",
    ],
  },
  zed: {
    title: "Zed",
    install: "~/.config/zed/themes/lacuna.json, then `\"theme\": \"Lacuna Ink\"` in settings.json. The file is a theme family with two entries.",
    shape: "JSON with a `themes` array; each entry carries `name`, `appearance` and a flat `style` object of dot-named keys.",
    scopes: [
      ["Colour values", "Literal hex per key; Zed has no palette indirection inside a theme file"],
      ["Document surface", "background, text, text.muted, border, element.background"],
      ["Syntax", "syntax.keyword, syntax.string, syntax.type, syntax.number, syntax.function, syntax.comment"],
      ["Selection & cursor", "element.selected, editor.highlighted_line.background, editor.document_highlight.read_background"],
      ["Diagnostics", "error, warning, info, hint — surfaced in the diagnostics panel and as underlines"],
      ["Diff", "diff.plus.background, diff.minus.background, diff.delta.background"],
      ["Terminal", "terminal.background, terminal.foreground, terminal.ansi.red / green / yellow …"],
    ],
    limits: [
      "Zed resolves tree-sitter highlights and LSP semantic tokens. Semantic tokens win where the language server provides them, so `function.method` can differ from the same text in Helix.",
      "`syntax.type` covers namespaces; Zed has no separate namespace key in the family schema used here.",
      "ANSI colours have no blue or magenta in the Aporia palette. Both fall back to type ochre and chestnut and are flagged in Open items.",
      "Family files are validated against the installed Zed build; unknown keys are ignored rather than rejected, so a silent fallback is possible.",
    ],
  },
};

const OPEN_ITEMS = [
  { id: "q1", title: "Real editor validation", body: "Helix and Zed need real host screenshots, syntax-capture QA and OS-theme switching checks. Generated HTML specimens are illustrations, not editor screenshots.", owner: "qa" },
  { id: "q2", title: "Text selection", body: "Selection is the canonical editor.selection token rather than reverse-video. Test multiline selections, selection text legibility and multiple cursors in each host.", owner: "qa" },
  { id: "q3", title: "Host feature differences", body: "Helix uses Tree-sitter captures; Zed can also use semantic tokens. Some colors depend on the active grammar and editor version.", owner: "implementation" },
  { id: "q4", title: "Truecolor and terminal palettes", body: "Real terminal colors may differ with 256-color quantization and display profiles. ANSI blue/magenta/cyan use the canonical utility roles, not a parallel theme palette.", owner: "qa" },
  { id: "q5", title: "Fonts and shaping", body: "Theme files control color, not font fallback, ligatures, Persian shaping or terminal character-cell width. These remain host configuration concerns.", owner: "implementation" },
];
const HANDOFF = [
  { step: "01", title: "Edit only the canonical tree", body: "Edit aporia/tokens.json; use aporia/RULES.md for intended semantics. Do not edit dist or generated previews." },
  { step: "02", title: "Generate every platform", body: "Run npm run build. This resolves the same 79 color roles for Paper and Ink and produces all host themes and the gallery." },
  { step: "03", title: "Validate and check drift", body: "Run npm test and npm run check:drift. Tests cover contrast, file structure, matrix completeness and determinism." },
  { step: "04", title: "Install a host theme", body: "Follow docs/INSTALL.md to install Helix, Zed, VS Code, Kitty, Ghostty, Alacritty or WezTerm assets." },
  { step: "05", title: "Test in the actual host", body: "Visually test diagnostics, selections, diffs and syntax in a live editor or terminal; browser specimens are an approximation." },
];
const TOML_SNIPPET = GALLERY_HELIX_SNIPPET;
const JSON_SNIPPET = GALLERY_ZED_SNIPPET;

const COPY = {
  specimen: {
    rust: "Traits, enums, lifetimes and a fallible resolver. The same lines are rendered in Paper and in Ink so a toggle changes the values and nothing else.",
    typescript: "A discriminated union, a readonly map and an async compiler. Narrowing is visible in the type colours as much as in the control flow.",
    go: "Packages, a small interface, wrapped errors and a context-aware server. Goroutine and defer structure are part of what the theme has to keep legible.",
  },
  work: {
    rust: "The resolver under a failing test: an error and a warning, a staged diff hunk, a search for `contrast`, and two carets over a selection.",
    typescript: "The compiler mid-edit: one type error, one unused binding, a completion menu over the edition union, and the `failures` search held open.",
    go: "The handler mid-edit: a bad return value, a read of the request query, and `edition` highlighted across two functions.",
  },
};
