/* Lacuna — renderer. One container, 24 routed pages, shared token record. */
(function () {
  "use strict";

  const ED = GALLERY_ED; // generated from aporia/tokens.json

  const LANG_LABEL = { rust: "Rust", typescript: "TypeScript", go: "Go" };
  const HOST_LABEL = { helix: "Helix", zed: "Zed" };

  /* ---------------- colour maths (mirrors the CSS srgb mixes) ---------- */
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  function rgbToHex(rgb) {
    return "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  }
  function mix(a, b, p) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(A.map((v, i) => v * (1 - p) + B[i] * p));
  }
  function luminance(hex) {
    const [r, g, b] = hexToRgb(hex).map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contrast(a, b) {
    const la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function surface(edition, name) {
    const s = SURFACES[edition][name];
    if (!s) throw new Error("Unknown preview surface " + name);
    return GALLERY_COLORS[edition][s.role];
  }
  const ROLE_ALIAS = {
    function: "function", parameter: "parameter", attribute: "attribute",
    namespace: "type", constant: "number", escape: "number", doc: "comment",
    operator: "operator", punctuation: "punctuation", control: "keyword",
    activeline: "active-line",
  };

  function roleColor(edition, role) {
    const key = ROLE_ALIAS[role] || role;
    if (SURFACES[edition][key]) return surface(edition, key);
    if (key === "diagnostic") return ED[edition].error;
    return ED[edition][key] || ED[edition].foreground;
  }

  /* ---------------- tokenizer ----------------------------------------- */
  const KEYWORDS = {
    rust: new Set(("as async await break const continue crate dyn else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while yield").split(" ")),
    typescript: new Set(("as async await break case catch class const continue declare default delete do else enum export extends false finally for from function if implements import in instanceof interface let new null of readonly return satisfies static super switch this throw true try type typeof undefined var void while yield").split(" ")),
    go: new Set(("break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var nil true false iota").split(" ")),
  };
  const TYPES = {
    rust: new Set(("String Vec Option Result BTreeMap HashMap f32 f64 u8 u16 u32 u64 usize i8 i16 i32 i64 isize str bool char").split(" ")),
    typescript: new Set(("string number boolean any unknown never void object symbol bigint ReadonlyMap Map Set Promise readonly").split(" ")),
    go: new Set(("string int int64 int32 uint byte rune bool error any float64").split(" ")),
  };

  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function tokenize(text, lang) {
    const out = [];
    const kw = KEYWORDS[lang], tw = TYPES[lang];
    let i = 0;
    const push = (c, v) => { if (v) out.push([c, v]); };
    while (i < text.length) {
      const rest = text.slice(i);
      const ch = text[i];
      if (/\s/.test(ch)) {
        let j = i;
        while (j < text.length && /\s/.test(text[j])) j++;
        push(null, text.slice(i, j)); i = j; continue;
      }
      if (rest.startsWith("//")) {
        push(/^\/\/[/!]/.test(rest) || /^\/\/\//.test(rest) ? "t-d" : "t-c", rest);
        break;
      }
      if (lang !== "go" && rest.startsWith("/*")) {
        const end = rest.indexOf("*/");
        const val = end < 0 ? rest : rest.slice(0, end + 2);
        push("t-c", val); i += val.length; continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        if (lang === "rust" && ch === "'") {
          const life = rest.match(/^'[A-Za-z_][A-Za-z0-9_]*/);
          const after = life ? rest.slice(life[0].length) : "";
          if (life && !after.startsWith("'")) { push("t-t", life[0]); i += life[0].length; continue; }
        }
        let j = i + 1;
        while (j < text.length) {
          if (text[j] === "\\") { j += 2; continue; }
          if (text[j] === ch) { j++; break; }
          j++;
        }
        let val = text.slice(i, j);
        if (val.endsWith(ch) && val.length > 1) {
          const inner = val.slice(1, -1);
          push("t-s", ch);
          const parts = inner.split(/(\\[nrt"'\\0]|\{[^}]*\}|\$\{[^}]*\})/g);
          parts.forEach((p) => {
            if (!p) return;
            if (/^(\\[nrt"'\\0]|\{[^}]*\}|\$\{[^}]*\})$/.test(p)) push("t-e", p);
            else push("t-s", p);
          });
          push("t-s", ch);
        } else push("t-s", val);
        i += val.length; continue;
      }
      if (/[0-9]/.test(ch)) {
        const m = rest.match(/^[0-9][0-9_]*(?:\.[0-9_]+)?(?:[eE][+-]?[0-9]+)?(?:f32|f64|u8|u16|u32|u64|usize|i8|i16|i32|i64|isize)?/);
        push("t-n", m[0]); i += m[0].length; continue;
      }
      if (/[A-Za-z_$]/.test(ch)) {
        const m = rest.match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
        const word = m[0];
        const after = text.slice(i + word.length);
        let cls = "t-v";
        if (kw.has(word)) cls = "t-k";
        else if (tw.has(word)) cls = "t-t";
        else if (after.startsWith("!")) cls = "t-a";
        else if (after.startsWith("(")) cls = "t-f";
        else if (/^[A-Z]/.test(word)) cls = "t-t";
        else if (after.startsWith("::")) cls = "t-ns";
        push(cls, word); i += word.length; continue;
      }
      if (ch === "#" && text[i + 1] === "[") {
        const end = text.indexOf("]", i);
        const val = end < 0 ? text.slice(i) : text.slice(i, end + 1);
        push("t-a", val); i += val.length; continue;
      }
      if (ch === "@" && /[A-Za-z]/.test(text[i + 1] || "")) {
        const m = rest.match(/^@[A-Za-z_][A-Za-z0-9_]*/);
        push("t-a", m[0]); i += m[0].length; continue;
      }
      const op = rest.match(/^(?:::|->|=>|==|!=|<=|>=|&&|\|\||\.\.=?|\+=|-=|\*=|\/=|:=|<-|\?\?|\?\.)/);
      if (op) { push("t-o", op[0]); i += op[0].length; continue; }
      if (/[{}()[\];,.:]/.test(ch)) { push("t-p", ch); i++; continue; }
      if (/[+\-*/%=<>!&|^~?]/.test(ch)) { push("t-o", ch); i++; continue; }
      push(null, ch); i++;
    }
    return out;
  }

  function lineHtml(text, lang, marks, cursorAt) {
    const toks = tokenize(text, lang);
    const hl = new Array(text.length).fill(null);
    let pos = 0;
    toks.forEach(([c, v]) => {
      for (let k = 0; k < v.length; k++) hl[pos + k] = c;
      pos += v.length;
    });
    const mk = new Array(text.length).fill(null);
    (marks || []).forEach((m) => {
      for (let k = m.from; k < Math.min(m.to, text.length); k++) mk[k] = m.cls;
    });
    let html = "", i = 0;
    while (i < text.length) {
      const key = (hl[i] || "") + "|" + (mk[i] || "");
      let j = i;
      while (j < text.length && (hl[j] || "") + "|" + (mk[j] || "") === key) j++;
      const cls = [hl[i], mk[i]].filter(Boolean).join(" ");
      const chunk = esc(text.slice(i, j));
      html += cls ? '<span class="' + cls + '">' + chunk + "</span>" : chunk;
      i = j;
    }
    if (cursorAt != null && cursorAt >= text.length) html += '<span class="mk-cursor"></span>';
    return html;
  }

  /* ---------------- state resolution ---------------------------------- */
  const linesOf = (lang) => CODE[lang].split("\n");
  const idxOf = (lines, anchor) => lines.findIndex((l) => l.includes(anchor));

  function buildRows(page, display, marks, cursor) {
    const lang = page.lang;
    if (page.host === "helix") {
      const active = display.activeIndex;
      return display.rows
        .map(([lineNo, text]) => {
          const rel = active == null ? (lineNo + 1) : lineNo === active ? lineNo + 1 : Math.abs(lineNo - active);
          const cls = ["row", display.rowCls[lineNo] || ""].filter(Boolean).join(" ");
          const sign = display.signs[lineNo] ? '<span class="gm ' + display.signs[lineNo].cls + '">' + display.signs[lineNo].ch + "</span>" : "";
          const extra = lineNo === display.secondaryLine ? '<span class="mk-cursor hollow"></span>' : "";
          return (
            '<div class="' + cls + '"><span class="gutter">' + sign + rel + '</span>' +
            '<span class="src">' + lineHtml(text, lang, marks[lineNo], lineNo === cursor.line ? cursor.col : null) + extra + "</span></div>"
          );
        })
        .join("");
    }
    return display.rows
      .map(([lineNo, text]) => {
        const cls = ["row", display.rowCls[lineNo] || ""].filter(Boolean).join(" ");
        const sign = display.signs[lineNo] ? '<span class="gm ' + display.signs[lineNo].cls + '">' + display.signs[lineNo].ch + "</span>" : "";
        const extra = lineNo === display.secondaryLine ? '<span class="mk-cursor hollow"></span>' : "";
        return (
          '<div class="' + cls + '"><span class="gutter">' + sign + (lineNo + 1) + '</span>' +
          '<span class="src">' + lineHtml(text, lang, marks[lineNo], lineNo === cursor.line ? cursor.col : null) + extra + "</span></div>"
        );
      })
      .join("");
  }

  function resolveSession(page, slice) {
    const lines = linesOf(page.lang);
    const st = STATES[page.lang];
    const marks = lines.map(() => []);
    const rowCls = lines.map(() => "");
    const signs = lines.map(() => null);
    const info = { activeIndex: null, cursor: { line: -1, col: null }, diagLines: [], findLine: null };

    const active = idxOf(lines, st.active);
    if (active > -1) { rowCls[active] = "on"; info.activeIndex = active; }

    const selIdx = st.selection.map((a) => idxOf(lines, a)).filter((n) => n > -1);
    selIdx.forEach((n) => { rowCls[n] = (rowCls[n] + " sel").trim(); });

    const findRe = new RegExp(st.find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    lines.forEach((text, n) => {
      findRe.lastIndex = 0;
      let m;
      while ((m = findRe.exec(text))) {
        marks[n].push({ from: m.index, to: m.index + st.find.length, cls: "mk-find" });
        if (info.findLine == null && n >= slice.start && n < slice.end) info.findLine = n;
      }
    });
    /* Prefer a match held inside the selection, so the current-match state is
       actually visible next to ordinary matches. */
    const selectedRows = rowCls.map((c, i) => (c.indexOf("sel") > -1 ? i : -1)).filter((i) => i > -1);
    const selMatch = selectedRows.find((n) => marks[n].some((m) => m.cls === "mk-find"));
    const currentLine = selMatch != null ? selMatch : info.findLine;
    if (currentLine != null) {
      const first = marks[currentLine].find((m) => m.cls === "mk-find");
      if (first) {
        first.cls = "mk-cur";
        let before = 0;
        marks.forEach((ms, n) => {
          if (n < currentLine) before += ms.filter((m) => m.cls === "mk-find" || m.cls === "mk-cur").length;
        });
        const inLine = marks[currentLine].filter((m) => m.cls === "mk-find" || m.cls === "mk-cur");
        info.current = { line: currentLine, position: before + inLine.indexOf(first) + 1 };
      }
    }

    st.diags.forEach((d) => {
      const n = idxOf(lines, d.anchor);
      if (n < 0) return;
      const start = lines[n].indexOf(d.pick);
      const cls = d.level === "error" ? "mk-err" : d.level === "warning" ? "mk-warn" : "mk-info";
      marks[n].push({ from: Math.max(0, start), to: Math.max(0, start) + (d.len || d.pick.length), cls });
      rowCls[n] = (rowCls[n] + (d.level === "error" ? " has-err" : "")).trim();
      info.diagLines.push(n);
      signs[n] = { ch: d.level[0].toUpperCase(), cls: "gm-" + d.level[0] };
    });

    const last = selIdx.length ? selIdx[selIdx.length - 1] : active;
    info.cursor = { line: last, col: last > -1 ? lines[last].length : null };
    info.secondary = idxOf(lines, st.secondary);
    return { marks, rowCls, signs, info };
  }

  function specimenState(page) {
    const lines = linesOf(page.lang);
    const diags = STATES[page.lang].specimenDiags || [];
    const marks = lines.map(() => []);
    const rowCls = lines.map(() => "");
    const signs = lines.map(() => null);
    const list = diags.map((d) => {
      const n = idxOf(lines, d.anchor);
      if (n < 0) return { level: d.level, line: 0, message: d.message };
      const start = Math.max(0, lines[n].indexOf(d.pick));
      const cls = d.level === "error" ? "mk-err" : "mk-warn";
      marks[n].push({ from: start, to: start + (d.len || d.pick.length), cls });
      signs[n] = { ch: d.level[0].toUpperCase(), cls: "gm-" + d.level[0] };
      return { level: d.level, line: n + 1, message: d.message };
    });
    let cursor = { line: -1, col: null };
    if (isVisualSpecimen(page) && page.lang === "rust") {
      const selected = [];
      STATES.rust.selection.forEach((a) => {
        const n = idxOf(lines, a);
        if (n > -1) {
          rowCls[n] = (rowCls[n] + " sel").trim();
          selected.push(n);
        }
      });
      const lastSel = selected.length ? Math.max.apply(null, selected) : -1;
      cursor = { line: lastSel, col: lastSel > -1 ? lines[lastSel].length : null };
    }
    return { marks, rowCls, signs, list, cursor };
  }

  function sliceLines(lines, start, count) {
    const end = Math.min(lines.length, start + count);
    const rows = [];
    for (let i = start; i < end; i++) rows.push([i, lines[i]]);
    return { rows, start, end };
  }

  function notesFor(page, lines) {
    const st = STATES[page.lang];
    if (page.kind === "specimen") {
      const spec = {
        rust: [
          ["pub trait Palette {", "Trait declaration: <b>keyword</b> red, name in foreground, bound in ochre. Helix capture <code>keyword</code> / Zed <code>syntax.keyword</code>."],
          ["fn value<'a>(&'a self", "Lifetime ticks resolve as <b>type</b>, not string. Zed may promote them through semantic tokens; Helix cannot."],
          ["/// A role is named once", "Doc comments share the comment hue at weight 500. No italic and no second comment colour."],
        ],
        typescript: [
          ["export type Role =", "A string-literal union. Six members, one string role — the shape is read before the colour."],
          ["const rules = source.kind === \"inline\"", "A discriminated union narrows on <code>kind</code>. <code>source.rules</code> is a property, not a namespace."],
          ["message: `", "Template literal keeps the sage string role; only the interpolation and escapes move to chestnut."],
        ],
        go: [
          ["type Resolver interface {", "Interface and struct names share the ochre type role; methods stay foreground, so an interface reads as a contract."],
          ["func (r *fileResolver) Resolve", "Receiver, wrap verb and error value: one hue, three meanings. <code>%w</code> is an escape, not a keyword."],
          ["ctx, stop := signal.NotifyContext", "Three-value assignment. The operator is muted and the call is foreground — no fourth accent enters the line."],
        ],
      }[page.lang];
      return spec.map(([anchor, text]) => ({ anchor, text })).map((n) => ({ line: idxOf(lines, n.anchor) + 1, text: n.text }));
    }
    const work = {
      rust: [
        [st.diags[0].anchor, "Error, dotted underline and the <code>E</code> in the gutter carry the same red. The diagnostics panel repeats it in words."],
        [st.selection[0], "Selection uses the canonical editor.selection surface, with syntax colors retained. Real editor rendering may differ."],
        [st.diff[1].anchor, "A staged hunk in the second pane: added, changed and removed lines keep their syntax colour and gain a sign."],
      ],
      typescript: [
        [st.diags[0].anchor, "The type error is fairly placed: the union is narrowed after this line, so the compiler is right to complain here."],
        [st.completion.anchor, "A completion list over the edition union. The menu uses the same two paper tones as the status line."],
        [st.diff[1].anchor, "The changed line keeps its template-literal colouring; the diff wash sits underneath, not on top."],
      ],
      go: [
        [st.diags[0].anchor, "A bad return value: red text, dotted underline, gutter <code>E</code>. The panel names the line."],
        [st.selection[0], "The guarded edition check, selected. `&&` stays muted so the colour of the condition is carried by the keywords."],
        [st.diff[0].anchor, "The context branch arrives as an added hunk. Green wash plus a <code>+</code> sign; no colour is the only cue."],
      ],
    }[page.lang];
    return work.map(([anchor, text]) => ({ line: idxOf(lines, anchor) + 1, text }));
  }

  /* ---------------- editor views -------------------------------------- */
  function helixChrome(page, body, opts) {
    const st = STATES[page.lang];
    const edition = page.variant;
    const server = { rust: "rust-analyzer", typescript: "typescript-language-server", go: "gopls" }[page.lang];
    const visual = page.kind === "work" || isVisualSpecimen(page);
    return (
      '<div class="ed term" data-edition="' + edition + '">' +
        '<div class="term-frame"><span class="dots"><span></span><span></span><span></span></span>' +
          '<span class="path">alacritty — hx</span><span>118 × 38</span><span class="size">truecolor</span></div>' +
        '<div class="bufs">' +
          '<div class="buf on">' + LANGUAGES.find((l) => l.id === page.lang).file + '</div>' +
          '<div class="buf">theme/src/paper.rs</div>' +
          '<div class="buf">Cargo.toml</div>' +
          '<div class="buf">+</div>' +
        '</div>' +
        body +
        '<div class="statusline">' +
          '<span class="' + (visual ? "mode sel" : "mode") + '">' + (visual ? "VIS" : "NOR") + "</span>" +
          '<span><b>' + LANGUAGES.find((l) => l.id === page.lang).file + '</b></span>' +
          '<span class="hide-s">' + (page.kind === "work" ? st.cursorNote : isVisualSpecimen(page) ? "2 lines selected" : "1E 1W") + '</span>' +
          '<span class="hide-s">' + server + '</span>' +
          '<span class="grow"></span>' +
          '<span>' + (page.kind === "work" ? "2 diagnostics" : "utf-8") + '</span>' +
          '<span>13:24</span>' +
          '<span>74%</span>' +
        '</div>' +
        '<div class="cmdline"><i>' + (page.kind === "work" ? "/" : ":") + "</i>" + (page.kind === "work" ? st.searchQuery : "") + '<span class="mk-cursor"></span></div>' +
      '</div>'
    );
  }

  function zedChrome(page, pane, opts) {
    const edition = page.variant;
    const st = STATES[page.lang];
    const file = LANGUAGES.find((l) => l.id === page.lang).file;
    const outline = {
      rust: ["enum Edition", "enum Role", "trait Palette", "fn resolve", "fn audit"],
      typescript: ["type Role", "interface Rule", "type Source", "type Result", "fn compile", "fn parse"],
      go: ["type Edition", "type Palette", "interface Resolver", "fn Resolve", "fn handler", "fn main"],
    }[page.lang];
    const activeLine = idxOf(linesOf(page.lang), st.active) + 1;
    const diagPanel = page.kind === "work"
      ? '<aside class="diagpane"><h4>Diagnostics — ' + st.diags.length + '</h4>' +
        st.diags.map((d) => {
          const n = idxOf(linesOf(page.lang), d.anchor) + 1;
          return '<div class="diag ' + d.level + '"><span class="lvl">' + d.level[0].toUpperCase() + '</span>' +
            '<div><p>' + esc(d.message) + '</p><span class="ref">' + file + ':' + n + '</span></div></div>';
        }).join("") + "</aside>"
      : "";
    const term = page.kind === "work"
      ? '<div class="term-pane"><h4>Terminal</h4>' + terminalOutput(page) + "</div>"
      : "";
    return (
      '<div class="ed zed" data-edition="' + edition + '">' +
        '<div class="zed-top"><span class="dots"><span></span><span></span><span></span></span>' +
          '<span class="title">Lacuna — ' + file + '</span><span class="right"><span>zed · preview build</span></span></div>' +
        '<div class="tabs">' +
          LANGUAGES.map((l) =>
            '<div class="tab' + (l.id === page.lang ? " on" : "") + '">' + l.file.split("/").pop() +
            (l.id === page.lang ? "<em>+</em>" : "") + "</div>").join("") +
          '<div class="tab">Cargo.toml</div>' +
        '</div>' +
        '<div class="zed-body' + (page.kind === "specimen" ? " solo" : "") + '">' +
          '<aside class="dock"><h4>Project</h4><ul>' +
            '<li><b>theme/</b></li>' +
            '<li style="padding-left:22px">src/</li>' +
            '<li class="on" style="padding-left:34px">resolve.rs<span class="m">M</span></li>' +
            '<li style="padding-left:34px">paper.rs</li>' +
            '<li style="padding-left:34px">ink.rs</li>' +
            '<li><b>Cargo.toml</b></li>' +
          '</ul><h4>Outline</h4><ul>' +
            outline.map((o) => "<li>" + o + "</li>").join("") +
          '</ul></aside>' +
          pane +
          diagPanel +
          term +
        '</div>' +
        '<div class="zed-status"><span class="mode">main*</span><span>' + (page.kind === "work" ? "2 diagnostics" : "0 problems") + '</span>' +
          '<span class="right"><span>Ln ' + (page.kind === "work" ? activeLine : 1) + ', Col 1</span><span>UTF-8</span><span>' + LANG_LABEL[page.lang] + "</span></span></div>" +
      '</div>'
    );
  }

  function paneHtml(page, slice, marks, rowCls, signs, cursor, opts) {
    const display = { rows: slice.rows, rowCls, signs, activeIndex: opts && opts.activeIndex, secondaryLine: opts && opts.secondaryLine };
    return (
      '<div class="pane">' +
        (opts && opts.find ? '<div class="findbar"><span>Find</span><b>' + opts.find.query + "</b><span>" + opts.find.count + ' matches</span><span class="grow"></span><span>' + opts.find.position + " / " + opts.find.count + "</span></div>" : "") +
        (opts && opts.crumbs ? '<div class="crumbs-zed"><b>theme</b><span>›</span><b>src</b><span>›</span><b>' +
          LANGUAGES.find((l) => l.id === page.lang).file.split("/").pop() + '</b><span>›</span><span>' + opts.crumbs + "</span></div>" : "") +
        '<div class="lines">' + buildRows(page, display, marks, cursor) + "</div>" +
        (opts && opts.pop ? popHtml(page, opts.pop) : "") +
        (opts && opts.extra ? opts.extra : "") +
      "</div>"
    );
  }

  function popHtml(page, pop) {
    const st = STATES[page.lang];
    return (
      '<div class="pop" style="top:' + pop.top + "px;left:" + pop.left + 'px" aria-hidden="true">' +
        '<div class="pop-h"><span>' + page.lang + ' · edition</span><span>tab</span></div>' +
        st.completion.items.map((item, i) =>
          '<div class="' + (i === 0 ? "on" : "") + '"><i>' + (i === 0 ? "f" : "p") + "</i>" + esc(item) +
          "<em>" + (i === 0 ? "method" : "field") + "</em></div>").join("") +
      "</div>"
    );
  }

  function terminalOutput(page) {
    const file = LANGUAGES.find((l) => l.id === page.lang).file;
    if (page.lang === "rust") {
      return '<div class="ansi"><span class="dim">$</span> cargo test --workspace\n' +
        '<span class="dim">   Compiling</span> lacuna-theme v0.3.0\n' +
        '<span class="ok">    Finished</span> `test` profile [unoptimized] target(s)\n' +
        '<span class="dim">     Running</span> unittests src/lib.rs\n' +
        'test resolve::tests::ink_keeps_roles ... <span class="ok">ok</span>\n' +
        'test audit::tests::comment_on_selection ... <span class="bad">FAILED</span>\n' +
        '<span class="bad">assertion failed</span>: 4.49 &lt; 4.5 at comment/selection\n' +
        '<span class="dim">test result:</span> <span class="bad">FAILED</span>. 1 passed; 1 failed</div>';
    }
    if (page.lang === "typescript") {
      return '<div class="ansi"><span class="dim">$</span> tsc --noEmit\n' +
        '<span class="ty">' + file + '</span><span class="dim">:41:18 - </span><span class="bad">error TS2339</span>: ' +
        "Property 'rules' does not exist on type 'Source'.\n" +
        '<span class="dim">$</span> node --test dist/**/*.test.js\n' +
        '<span class="ok">✔</span> compile ink resolves 6 roles (3.1ms)\n' +
        '<span class="bad">✘</span> compile paper rejects malformed (0.9ms)\n' +
        '<span class="dim">tests 2 · pass 1 · fail 1</span></div>';
    }
    return '<div class="ansi"><span class="dim">$</span> go test ./...\n' +
      '<span class="ok">ok</span>  \tlacuna/cmd/lacunad\t0.021s\n' +
      '<span class="dim">$</span> curl -s "localhost:7314/palette?edition=paper"\n' +
      '{"edition":"paper","roles":{"keyword":"<span class="kw">#b01e28</span>","string":"<span class="ok">#426247</span>"}}\n' +
      '<span class="dim">$</span> curl -s "localhost:7314/palette?edition=dusk"\n' +
      '<span class="bad">unknown edition "dusk"</span>\n' +
      '<span class="dim">$</span> go test -race ./...\n' +
      '<span class="ok">ok</span>  \tlacuna/cmd/lacunad\t1.204s</div>';
  }

  /* ---------------- page render --------------------------------------- */
  function pageHead(page, index) {
    const lang = LANG_LABEL[page.lang];
    const kind = page.kind === "specimen" ? "Code specimen" : "Working environment";
    const variant = page.variant === "paper" ? "Paper" : "Ink";
    const host = HOST_LABEL[page.host];
    const lede = COPY[page.kind][page.lang] + " " +
      (page.variant === "paper"
        ? "Paper resolves the red at #b01e28 on bone and keeps the page in daylight."
        : "Ink raises the red to #d87975 on coal and re-decides every surface rather than inverting Paper.");
    return (
      '<header class="phead" data-od-id="head-' + page.slug + '">' +
        '<span class="ghost" aria-hidden="true">' + String(index).padStart(2, "0") + "</span>" +
        '<div class="phead-grid">' +
          '<div class="folio">' + String(index).padStart(2, "0") +
            '<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5l2.6 7.7 8.1.3-6.4 4.8 2.3 7.8L12 17.4 5.4 22.1l2.3-7.8L1.3 9.5l8.1-.3z" fill="currentColor"/></svg>' +
          "</div>" +
          "<div>" +
            '<p class="kicker">' + kind + " · " + host + " · " + variant + "</p>" +
            "<h1>" + lang + "<small>" + host + " / " + variant + " / " + String(index).padStart(2, "0") + " of 24</small></h1>" +
            '<p class="lede">' + lede + "</p>" +
          "</div>" +
          '<p class="matrix"><b>' + host.toUpperCase() + "</b><br>" +
            '<span class="dim">' + variant.toUpperCase() + "</span><br>" +
            '<span class="dim">' + kind.toUpperCase() + "</span><br>" +
            '<span class="dim">' + String(index).padStart(2, "0") + " / 24</span></p>" +
        "</div>" +
      "</header>"
    );
  }

  function plateHead(page, index, lines) {
    return (
      '<div class="plate-head">' +
        '<span class="fig">Fig. ' + String(index).padStart(2, "0") + "</span>" +
        '<span class="file">' + LANGUAGES.find((l) => l.id === page.lang).file + "</span>" +
        '<span class="right"><span>' + lines + " lines</span>" +
          '<span class="prov pending">Illustrative</span></span>' +
      "</div>"
    );
  }

  function editorBlock(page, lines, spec) {
    const st = STATES[page.lang];
    if (page.kind === "specimen") {
      const slice = sliceLines(lines, 0, lines.length);
      const marks = spec.marks;
      const rowCls = spec.rowCls;
      const signs = spec.signs;
      const cursor = spec.cursor;
      if (page.host === "helix") {
        const body = '<div class="lines">' + buildRows(page, { rows: slice.rows, rowCls, signs, activeIndex: null }, marks, cursor) + "</div>";
        return helixChrome(page, body);
      }
      const pane = paneHtml(page, slice, marks, rowCls, signs, cursor, { crumbs: "impl ResolveError" });
      return zedChrome(page, pane);
    }

    const session = resolveSession(page, { start: 0, end: lines.length });
    const active = session.info.activeIndex;
    const near = session.info.diagLines.filter((n) => n > -1 && Math.abs(n - active) <= 20);
    const focus = [active].concat(near).filter((n) => n > -1);
    const lo = focus.length ? Math.min.apply(null, focus) : 0;
    const hi = focus.length ? Math.max.apply(null, focus) : 12;
    const start = Math.max(0, lo - 5);
    const base = page.host === "helix" ? 22 : 24;
    const slice = sliceLines(lines, start, Math.min(32, Math.max(base, hi - start + 3)));

    const diffIdx = st.diff.map((d) => idxOf(lines, d.anchor)).filter((n) => n > -1);
    const dStart = Math.max(0, Math.min.apply(null, diffIdx) - 3);
    const dSlice = sliceLines(lines, dStart, 12);
    const dMarks = lines.map((_, n) => (session.marks[n] || []).filter((m) => m.cls === "mk-find" || m.cls === "mk-cur"));
    const dCls = lines.map(() => "");
    const dSigns = lines.map(() => null);
    st.diff.forEach((d) => {
      const n = idxOf(lines, d.anchor);
      if (n < dSlice.start || n >= dSlice.end) return;
      const map = { add: ["add", "+", "gm-add"], remove: ["del", "\u2212", "gm-del"], change: ["chg", "~", "gm-chg"] };
      dCls[n] = map[d.type][0];
      dSigns[n] = { ch: map[d.type][1], cls: map[d.type][2] };
    });
    const diffRows = '<div class="lines">' +
      buildRows(page, { rows: dSlice.rows, rowCls: dCls, signs: dSigns, activeIndex: null }, dMarks, { line: -1, col: null }) +
      "</div>";

    if (page.host === "helix") {
      const body =
        '<div class="lines">' + buildRows(page, { rows: slice.rows, rowCls: session.rowCls, signs: session.signs, activeIndex: session.info.activeIndex, secondaryLine: session.info.secondary }, session.marks, session.info.cursor) + "</div>" +
        '<div class="split-line">hsplit · git diff --staged · pane 2/2 · focus stays in pane 1</div>' +
        diffRows;
      return helixChrome(page, body);
    }

    const popLine = idxOf(lines, st.completion.anchor);
    const popCol = Math.max(0, lines[popLine] ? lines[popLine].indexOf(st.completion.pick) : 0);
    const popTop = 10 + (popLine - slice.start) * 22 + 24;
    const popLeft = Math.min(520, 74 + popCol * 7.85);
    const opts = {
      crumbs: "fn " + st.completion.pick.split(".").pop(),
      pop: popLine >= slice.start && popLine < slice.end ? { top: popTop, left: popLeft + "px" } : null,
      find: {
        query: st.searchQuery,
        count: lines.reduce((n, l) => n + l.split(st.searchQuery).length - 1, 0),
        position: session.info.current ? session.info.current.position : 1,
      },
      extra: '<div class="split-line">Staged changes · ' + LANGUAGES.find((l) => l.id === page.lang).file + '</div>' + diffRows,
    };
    opts.secondaryLine = session.info.secondary;
    const pane = paneHtml(page, slice, session.marks, session.rowCls, session.signs, session.info.cursor, opts);
    return zedChrome(page, pane);
  }

  function legendRows(page) {
    const ids = page.kind === "specimen"
      ? ["keyword", "type", "function", "string", "number", "comment", "operator", "attribute"]
      : ["selection", "activeline", "search", "current-match", "diff", "diagnostic", "muted", "surface", "foreground"];
    const notes = {
      activeline: "editor.line-active",
      "current-match": "editor.search-match",
      search: "editor.search-match",
      diff: "diff surface + sign",
    };
    return ids.map((id) => ({
      role: ROLES.find((r) => r.id === id),
      color: id === "activeline" ? surface(page.variant, "active-line")
        : id === "diff" ? surface(page.variant, "diff-add")
          : id === "current-match" ? surface(page.variant, "search")
            : id === "search" ? surface(page.variant, "search-soft")
            : roleColor(page.variant, id),
      hex: notes[id] || roleColor(page.variant, id).toUpperCase(),
    }));
  }

  function legend(page) {
    return (
      '<section class="band" data-od-id="roles-' + page.slug + '">' +
        '<div class="band-head"><h2>Role map — ' + (page.variant === "paper" ? "Paper" : "Ink") + "</h2>" +
        "<span>" + (page.host === "helix" ? "Helix capture" : "Zed key") + "</span></div>" +
        '<div class="roles">' +
        legendRows(page).map((r) =>
          '<div class="role"><span class="sw" style="background:' + r.color + '"></span>' +
          '<span class="nm">' + r.role.label + "</span>" +
          '<span class="hx">' + r.hex + "</span>" +
          '<span class="sc">' + (page.host === "helix" ? r.role.helix : r.role.zed) + "</span></div>").join("") +
        "</div>" +
        (page.host === "helix" ? modeStrip(page) : "") +
      "</section>"
    );
  }

  function modeStrip(page) {
    const rows = [
      ["NOR", "Normal mode", "foreground"],
      ["INS", "Insert mode", "type"],
      ["VIS", "Visual mode", "string"],
    ];
    return '<div class="modes" data-od-id="modes-' + page.slug + '">' +
      rows.map(([tag, label, role]) =>
        '<div class="mode-cell"><span class="tag" style="background:' + roleColor(page.variant, role) +
        ";color:" + ED[page.variant].background + '">' + tag + "</span>" +
        '<span class="lbl">' + label + "</span>" +
        '<span class="hex">' + roleColor(page.variant, role).toUpperCase() + "</span></div>").join("") +
      "</div>";
  }

  function validation(page) {
    const ed = page.variant;
    const visual = page.kind === "work" || isVisualSpecimen(page);
    const pairs = [
      { a: "foreground", b: "background", label: "Editor text" },
      visual
        ? { a: "foreground", b: "selection", label: "Selected text", note: "Normal text on the canonical editor.selection surface." }
        : { a: "comment", b: "selection", label: "Comment on selection", note: "Canonical syntax.comment over editor.selection." },
      { a: "keyword", b: "search", label: "Keyword on current match" },
    ];
    return (
      '<section class="band" data-od-id="validation-' + page.slug + '">' +
        '<div class="band-head"><h2>Contrast — this page</h2><span>Calculated, not host-tested</span></div>' +
        '<div class="val">' +
        pairs.map((p) => {
          const ratio = contrast(roleColor(ed, p.a), roleColor(ed, p.b));
          return '<div class="val-cell"><span class="lbl"><span>' + p.label + '</span><span>' +
            (ratio >= 4.5 ? "PASS" : "FAIL") + "</span></span>" +
            '<span class="num">' + ratio.toFixed(2) + ' <span>:1 · min 4.5</span></span>' +
            "<p>" + (p.note || (p.a === "foreground" ? "Canonical foreground against this surface." : "Measured on resolved canonical color tokens.")) + "</p></div>";
        }).join("") +
        "</div>" +
      "</section>"
    );
  }

  function pageBody(page, index) {
    const lines = linesOf(page.lang);
    const notes = notesFor(page, lines);
    const spec = page.kind === "specimen" ? specimenState(page) : null;
    const errors = spec ? spec.list.filter((d) => d.level === "error" && d.line).length : 0;
    const warnings = spec ? spec.list.filter((d) => d.level === "warning" && d.line).length : 0;
    const annotation = page.kind === "work"
      ? "Session states: active line, selection, search, diagnostics, staged diff, completion. All overlays are staged for this plate."
      : isVisualSpecimen(page)
        ? "Specimen: " + lines.length + " lines of running code. Two diagnostics are underlined, and one selection is held in visual mode."
        : "Specimen: " + lines.length + " lines of running code. Two staged diagnostics are underlined in place and listed below.";
    const lens = spec
      ? '<div class="lens" data-od-id="lens-' + page.slug + '">' +
        '<div class="lens-h"><span>Diagnostics — staged</span><span>' + errors + " error · " + warnings +
        " warning · gutter letter and underline</span></div>" +
        spec.list.map((d) =>
          '<div class="lens-row ' + d.level + '"><span class="lvl">' + d.level[0].toUpperCase() + "</span>" +
          '<span class="ref">L' + (d.line || "—") + "</span><p>" + esc(d.message) + "</p></div>").join("") +
        "</div>"
      : "";
    return (
      '<article class="page" data-od-id="page-' + page.slug + '"><div class="wrap">' +
      pageHead(page, index) +
      '<section class="plate" data-od-id="plate-' + page.slug + '">' +
        plateHead(page, index, lines.length) +
        editorBlock(page, lines, spec) +
      "</section>" +
      '<p class="cap"><span>' + annotation + "</span>" +
        "<span>Host rendering is illustrative · " + (page.host === "helix" ? "terminal emulator and truecolor affect the result" : "Zed build and scheme affect the result") + "</span></p>" +
      lens +
      '<div class="notes">' +
        notes.map((n) =>
          '<div class="note"><span class="ref">L' + (n.line > 0 ? n.line : "—") + " · " +
          (page.kind === "specimen" ? "role" : "state") + "</span><p>" + n.text + "</p></div>").join("") +
      "</div>" +
      legend(page) +
      validation(page) +
      "</div></article>"
    );
  }

  /* ---------------- static pages -------------------------------------- */
  const VIS_SPECIMENS = ["helix-paper-rust-specimen", "helix-ink-rust-specimen"];
  const isVisualSpecimen = (page) => VIS_SPECIMENS.indexOf(page.slug) > -1;
  const fileFor = (p) => (p === MATRIX[0] ? "lacuna-themes.html" : p.slug + ".html");

  function switchTarget(page, key, value) {
    return MATRIX.find((p) =>
      p.host === (key === "host" ? value : page.host) &&
      p.variant === (key === "variant" ? value : page.variant) &&
      p.lang === (key === "lang" ? value : page.lang) &&
      p.kind === (key === "kind" ? value : page.kind));
  }

  function navBar(page) {
    const group = (label, key, items, current) =>
      '<div class="group"><span>' + label + "</span>" +
      items.map((it) => {
        const target = switchTarget(page, key, it.id);
        return '<a class="seg" href="' + fileFor(target) + '"' +
          (it.id === current ? ' aria-current="page"' : "") + ">" + it.label + "</a>";
      }).join("") + "</div>";
    return '<nav class="controlbar" aria-label="Compare pages"><div class="wrap controlbar-in">' +
      '<span class="crumbs">Aporia <b>/</b> Lacuna <b>/</b> ' + HOST_LABEL[page.host] + " <b>/</b> " +
      (page.variant === "paper" ? "Paper" : "Ink") + " <b>/</b> " + LANG_LABEL[page.lang] + "</span>" +
      '<div class="groups">' +
      group("Host", "host", HOSTS, page.host) +
      group("Edition", "variant", [{ id: "paper", label: "Paper" }, { id: "ink", label: "Ink" }], page.variant) +
      group("Language", "lang", LANGUAGES.map((l) => ({ id: l.id, label: l.id === "typescript" ? "TS" : l.label.toUpperCase() })), page.lang) +
      group("View", "kind", [{ id: "specimen", label: "Specimen" }, { id: "work", label: "Working" }], page.kind) +
      "</div></div></nav>";
  }

  function indexPanel(page) {
    const groups = HOSTS.map((host) => VARIANTS.map((variant) => {
      const set = MATRIX.filter((p) => p.host === host.id && p.variant === variant.id);
      return '<div class="idx-group"><h3>' + host.label + " / " + variant.label + " — " +
        (variant.id === "paper" ? "light" : "dark") + "</h3>" +
        set.map((p) => '<a class="idx-row" href="' + fileFor(p) + '"' +
          (p.slug === page.slug ? ' aria-current="page"' : "") + ">" +
          '<span class="n">' + String(MATRIX.indexOf(p) + 1).padStart(2, "0") + "</span>" +
          '<span class="lbl">' + LANG_LABEL[p.lang] + " · " + (p.kind === "specimen" ? "Code specimen" : "Working environment") + "</span>" +
          '<span class="lead"></span><span class="tag">' + (p.kind === "specimen" ? "Fig" : "Session") + "</span></a>").join("") +
        "</div>";
    }).join("")).join("");
    return '<details class="idxbar"><summary class="tbtn">Index · 24</summary>' +
      '<div class="idxpanel"><div class="idxpanel-in">' +
      '<p class="idxnote">24 pages · 3 languages × 2 editions × 2 hosts × 2 presentations. Every row is a file; no page is generated on demand.</p>' +
      groups + "</div></div></details>";
  }

  function footer(page) {
    const i = MATRIX.indexOf(page);
    const prev = MATRIX[(i + 23) % 24];
    const next = MATRIX[(i + 1) % 24];
    const flip = MATRIX.find((p) => p.host === page.host && p.lang === page.lang && p.kind === page.kind && p.variant !== page.variant);
    return '<footer class="foot"><div class="wrap foot-in">' +
      '<div><h3>Lacuna — a family inside Aporia</h3>' +
      "<p>Paper and Ink are one mapping in two editions. Aporia owns the identity; Lacuna carries it into editors and terminals. Nothing here was captured from Helix or Zed.</p>" +
      '<p style="margin-top:8px"><a href="' + fileFor(MATRIX[0]) + '">Page 01</a> · <a href="index.html">Gallery index</a> · <a href="#record">Role map</a></p></div>' +
      '<div class="foot-nav"><span>Previous</span><a href="' + fileFor(prev) + '">' +
      String(MATRIX.indexOf(prev) + 1).padStart(2, "0") + " — " + prev.name + "</a></div>" +
      '<div class="foot-nav"><span>Same page, other edition</span><a href="' + fileFor(flip) + '">' + flip.name + "</a>" +
      '<span style="margin-top:10px">Next</span><a href="' + fileFor(next) + '">' +
      String(MATRIX.indexOf(next) + 1).padStart(2, "0") + " — " + next.name + "</a></div>" +
      "</div></footer>";
  }

  function recordHtml() {
    const roleRows = ROLES.map((r) => {
      const swKey = r.id === "activeline" ? "active-line" : r.id === "diff" ? "diff-add" : r.id === "current-match" ? "search" : r.id === "search" ? "search-soft" : r.id;
      const paperSw = r.paper.indexOf("mix") === 0 ? surface("paper", swKey) : r.paper;
      const inkSw = r.ink.indexOf("mix") === 0 ? surface("ink", swKey) : r.ink;
      const paperTxt = r.paper.indexOf("mix") === 0 ? r.paper.replace("mix(background, foreground 8%)", "8% over bone").replace("mix(background, foreground 4%)", "4% over bone").replace("mix(background, type 12%)", "12% ochre").replace("mix(background, type 7%)", "7% ochre") : r.paper;
      const inkTxt = r.ink.indexOf("mix") === 0 ? r.ink.replace("mix(background, foreground 8%)", "8% over coal").replace("mix(background, foreground 5%)", "5% over coal").replace("mix(background, type 14%)", "14% ochre").replace("mix(background, type 8%)", "8% ochre") : r.ink;
      const isDiag = r.id === "diagnostic";
      return "<tr><td>" + r.label + "</td>" +
        '<td class="m sw"><i style="background:' + (isDiag ? ED.paper.error : paperSw) + '"></i><span>' + (isDiag ? "red / chestnut / muted" : paperTxt) + "</span></td>" +
        '<td class="m sw"><i style="background:' + (isDiag ? ED.ink.error : inkSw) + '"></i><span>' + (isDiag ? "red / ochre / muted" : inkTxt) + "</span></td>" +
        '<td class="m dim">' + r.helix + "<br>" + r.zed + "</td><td class=\"dim\">" + r.provenance + "</td></tr>";
    }).join("");

    const surfaceRows = Object.keys(SURFACES.paper).map((k) =>
      "<tr><td>" + k + '</td><td class="m sw"><i style="background:' + surface("paper", k) + '"></i>' + surface("paper", k) + "</td>" +
      '<td class="m sw"><i style="background:' + surface("ink", k) + '"></i>' + surface("ink", k) + "</td>" +
      '<td class="m dim">' + SURFACES.paper[k].role + "</td></tr>").join("");

    let pass = 0, fail = 0;
    const contrastSection = (edition) => CONTRAST_PAIRS.map((p) => {
      const r = contrast(roleColor(edition, p.fg), roleColor(edition, p.bg));
      const ok = r >= p.min;
      ok ? pass++ : fail++;
      return "<tr><td>" + p.fg + " on " + p.bg + '<br><span class="dim">' + p.use + "</span></td>" +
        '<td class="m">' + r.toFixed(2) + ":1</td><td class=\"m dim\">" + p.min.toFixed(1) + ':1</td><td class="m ' + (ok ? "pass" : "fail") + '">' + (ok ? "PASS" : "FAIL") + "</td></tr>";
    }).join("");
    const paperRows = contrastSection("paper");
    const inkRows = contrastSection("ink");

    const hostBlock = (id) => {
      const h = HOST_NOTES[id];
      return '<h3 class="rec-sub">' + h.title + '</h3><p class="rec-p">' + h.install + "</p><p class=\"rec-p\">" + h.shape + "</p>" +
        '<table class="tbl"><tbody>' + h.scopes.map(([k, v]) => '<tr><td class="m" style="width:34%">' + k + '</td><td class="dim">' + esc(v) + "</td></tr>").join("") + "</tbody></table>" +
        '<ul class="rec-list">' + h.limits.map((l, i) => '<li><span class="k">' + String(i + 1).padStart(2, "0") + "</span><span>" + esc(l) + "</span></li>").join("") + "</ul>";
    };

    return '<details class="record" id="record"><summary><span class="mono">Shared record</span>' +
      '<span class="rec-sum">Role map · host adapters · contrast · open items · handoff</span></summary>' +
      '<div class="wrap rec-body">' +
      '<h2 class="rec-h">Role map</h2>' +
      '<p class="rec-p">One row per semantic role. <b>Paper</b> and <b>Ink</b> resolve the same role differently; the host column is the key each adapter writes. Provenance: <b>taken</b> from the supplied sites, <b>adjusted</b> where a reference value failed a measured floor, <b>derived</b> by reusing an existing role.</p>' +
      '<table class="tbl"><thead><tr><th>Role</th><th class="m">Paper</th><th class="m">Ink</th><th class="m">Helix / Zed</th><th>Prov.</th></tr></thead><tbody>' + roleRows + "</tbody></table>" +
      '<h3 class="rec-sub">Canonical editor surfaces</h3><p class="rec-p">Selection, search and diffs resolve directly from Aporia semantic tokens. The HTML and editor themes are generated from the same roles; host rendering may differ.</p>' +
      '<table class="tbl"><thead><tr><th>Surface</th><th class="m">Paper</th><th class="m">Ink</th><th class="m">Source token</th></tr></thead><tbody>' + surfaceRows + "</tbody></table>" +

      '<h2 class="rec-h">Host adapters</h2>' + hostBlock("helix") + hostBlock("zed") +

      '<h2 class="rec-h">Contrast</h2>' +
      '<p class="rec-p">Every pair is <b>calculated</b> from canonical Aporia tokens using WCAG relative luminance. <b>No pair has been measured in Helix or Zed.</b> Method: calculated (this build) · visually inspected (this build) · real host (pending).</p>' +
      '<h3 class="rec-sub">Lacuna Paper</h3><table class="tbl"><thead><tr><th>Pair</th><th class="m">Ratio</th><th class="m">Min</th><th class="m">Result</th></tr></thead><tbody>' + paperRows + "</tbody></table>" +
      '<h3 class="rec-sub">Lacuna Ink</h3><table class="tbl"><thead><tr><th>Pair</th><th class="m">Ratio</th><th class="m">Min</th><th class="m">Result</th></tr></thead><tbody>' + inkRows + "</tbody></table>" +
      '<p class="rec-p"><b>' + pass + " pass · " + fail + " fail</b> across " + (pass + fail) + " calculated pairs. A terminal that quantises to 256 colours, a Zed build that resolves a semantic token differently, or a different font weight can all change the result." + "</p>" +

      '<h2 class="rec-h">Open items</h2><ul class="rec-list">' +
      OPEN_ITEMS.map((o) => '<li><span class="k">' + o.id.toUpperCase() + "</span><span><b>" + o.title + "</b>" + esc(o.body) + "</span></li>").join("") + "</ul>" +

      '<h2 class="rec-h">Handoff</h2><ul class="rec-list">' +
      HANDOFF.map((h) => '<li><span class="k">' + h.step + "</span><span><b>" + h.title + "</b>" + esc(h.body) + "</span></li>").join("") + "</ul>" +
      '<h3 class="rec-sub">Helix — Lacuna Ink</h3><pre class="snip">' + esc(TOML_SNIPPET) + "</pre>" +
      '<h3 class="rec-sub">Zed — theme family</h3><pre class="snip">' + esc(JSON_SNIPPET) + "</pre>" +
      '<p class="rec-p" style="margin-top:12px">Both files are <b>generated by the repository build</b>. Structural checks have run; actual editor rendering still needs host QA.</p>' +
      "</div></details>";
  }

  function documentHtml(page) {
    const index = MATRIX.indexOf(page) + 1;
    const css = typeof __CSS !== "undefined" ? __CSS : "";
    return "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\" />\n" +
      '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
      "<title>Lacuna — " + page.name + "</title>\n" +
      '<meta name="description" content="Lacuna Paper and Ink in Helix and Zed: ' + page.name + ". Part of a 24-page specimen set inside the Aporia system.\" />\n" +
      "<style>\n" + css + "\n</style>\n</head>\n<body>\n<div class=\"shell\">" +
      '<header class="topbar"><div class="wrap topbar-in">' +
      '<a class="brand" href="' + fileFor(MATRIX[0]) + '">Aporia <i aria-hidden="true"></i> <em>Lacuna</em></a>' +
      '<span class="topbar-sub">Paper + Ink · editors and terminals</span>' +
      '<div class="topbar-actions">' + indexPanel(page) +
      '<a class="tbtn" href="#record">Record ↓</a></div>' +
      "</div></header>" +
      navBar(page) +
      "<main>" + pageBody(page, index) + "</main>" +
      recordHtml() +
      footer(page) +
      "</div>\n" +
      "<script>function openRecord(){if(location.hash==='#record')document.getElementById('record').open=true;}addEventListener('hashchange',openRecord);addEventListener('click',function(e){if(e.target.closest('a[href=\"#record\"]'))document.getElementById('record').open=true;});openRecord();<" + "/script>\n</body>\n</html>";
  }

  globalThis.__LACUNA = { MATRIX, fileFor, documentHtml };
})();
