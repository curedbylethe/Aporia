/** Platform outputs use the resolved semantic JSON emitted by aporia/build.mjs.
 * This script contains mappings, never independent colors or a second palette.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const resolved = JSON.parse(fs.readFileSync(path.join(dist, 'web/tokens.resolved.json'), 'utf8'));
const sem = Object.fromEntries(resolved.semantic.map(t => [t.key, t]));
const modes = ['paper', 'ink'];
const write = (f, content) => {const p = path.join(dist, f); fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,content);};
const json = obj => JSON.stringify(obj, null, 2) + '\n';
const color = (mode, role) => {
  const entry = sem[role];
  if (!entry) throw new Error(`Missing canonical role ${role}`);
  const value = entry[mode];
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value.toUpperCase();
  const match = /^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\s*\)$/.exec(value);
  if (match) {
    const bg = color(mode, 'bg.canvas');
    const alpha = Number(match[4]);
    const rgb = [1,2,3].map((i,j) => Math.round(Number(match[i])*alpha+parseInt(bg.slice(1+2*j,3+2*j),16)*(1-alpha)));
    return '#' + rgb.map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
  }
  throw new Error(`Expected HEX or transparent RGB ${mode}.${role}: ${value}`);
};
const colorSlots = m => Array.from({length: 16}, (_,i)=>color(m,`terminal.ansi-${i}`));
const pair = (m, entries) => Object.fromEntries(Object.entries(entries).map(([name, role])=>[name, color(m,role)]));

function vscode(m) {
  const c = r => color(m,r);
  const semanticColors = pair(m, {
    'namespace': 'syntax.type', 'type': 'syntax.type', 'class': 'syntax.type', 'interface': 'syntax.type',
    'enum': 'syntax.type', 'typeParameter': 'syntax.type', 'struct': 'syntax.type',
    'function': 'syntax.function', 'method': 'syntax.function', 'macro': 'syntax.macro',
    'variable': 'syntax.variable', 'parameter': 'syntax.variable', 'property': 'syntax.property',
    'enumMember': 'syntax.number', 'decorator': 'syntax.macro', 'keyword': 'syntax.keyword',
    'string': 'syntax.string', 'number': 'syntax.number', 'comment': 'syntax.comment',
    'operator': 'syntax.operator', 'regexp': 'syntax.string',
  });
  const colors = pair(m, {
    'foreground': 'fg.primary', 'focusBorder': 'border.focus',
    'editor.background': 'bg.canvas', 'editor.foreground': 'fg.primary',
    'editorCursor.foreground': 'editor.cursor', 'editor.selectionBackground': 'editor.selection',
    'editor.inactiveSelectionBackground': 'interactive.selected',
    'editor.lineHighlightBackground': 'editor.line-active',
    'editorLineNumber.foreground': 'editor.line-number',
    'editorLineNumber.activeForeground': 'editor.line-number-active',
    'editor.findMatchBackground': 'editor.search-match',
    'editor.findMatchHighlightBackground': 'interactive.selected',
    'editorBracketMatch.border': 'border.control',
    'editorIndentGuide.background1': 'border.soft',
    'editorIndentGuide.activeBackground1': 'border.control',
    'editorWhitespace.foreground': 'border.control',
    'editorGutter.background': 'bg.canvas',
    'editorOverviewRuler.border': 'border.soft',
    'editorError.foreground': 'status.danger',
    'editorWarning.foreground': 'status.warning',
    'editorInfo.foreground': 'status.info',
    'editorGutter.addedBackground': 'editor.diff-added-mark',
    'editorGutter.deletedBackground': 'editor.diff-removed-mark',
    'editorGutter.modifiedBackground': 'editor.diff-modified-mark',
    'diffEditor.insertedTextBackground': 'editor.diff-added',
    'diffEditor.removedTextBackground': 'editor.diff-removed',
    'sideBar.background': 'bg.surface', 'sideBar.foreground': 'fg.primary',
    'sideBar.border': 'border.decorative',
    'activityBar.background': 'bg.surface-warm', 'activityBar.foreground': 'fg.primary',
    'activityBarBadge.background': 'accent.text', 'activityBarBadge.foreground': 'accent.on',
    'statusBar.background': 'bg.surface', 'statusBar.foreground': 'fg.primary',
    'statusBar.noFolderBackground': 'bg.surface',
    'titleBar.activeBackground': 'bg.surface-warm', 'titleBar.activeForeground': 'fg.primary',
    'titleBar.inactiveBackground': 'bg.surface-warm', 'titleBar.inactiveForeground': 'fg.secondary',
    'tab.activeBackground': 'bg.canvas', 'tab.activeForeground': 'fg.primary',
    'tab.inactiveBackground': 'bg.surface', 'tab.inactiveForeground': 'fg.secondary',
    'tab.border': 'border.soft', 'tab.activeBorderTop': 'accent.text',
    'editorGroupHeader.tabsBackground': 'bg.surface',
    'panel.background': 'bg.surface', 'panel.border': 'border.decorative',
    'input.background': 'bg.surface', 'input.foreground': 'fg.primary',
    'input.border': 'border.control', 'input.placeholderForeground': 'fg.secondary',
    'inputOption.activeBorder': 'accent.text',
    'button.background': 'interactive.primary-bg', 'button.foreground': 'interactive.primary-fg',
    'button.hoverBackground': 'interactive.primary-hover',
    'list.activeSelectionBackground': 'interactive.selected',
    'list.activeSelectionForeground': 'fg.primary',
    'list.inactiveSelectionBackground': 'interactive.hover',
    'list.hoverBackground': 'interactive.hover', 'list.focusOutline': 'border.focus',
    'dropdown.background': 'bg.surface', 'dropdown.foreground': 'fg.primary',
    'menu.background': 'bg.overlay', 'menu.foreground': 'fg.primary',
    'menu.selectionBackground': 'interactive.selected',
    'scrollbarSlider.background': 'border.soft',
    'scrollbarSlider.hoverBackground': 'border.decorative',
    'terminal.background': 'terminal.bg', 'terminal.foreground': 'terminal.fg',
    'terminalCursor.foreground': 'editor.cursor',
    'terminal.selectionBackground': 'editor.selection',
    ...Object.fromEntries(['Black','Red','Green','Yellow','Blue','Magenta','Cyan','White',
      'BrightBlack','BrightRed','BrightGreen','BrightYellow','BrightBlue','BrightMagenta','BrightCyan','BrightWhite']
      .map((name,i)=>[`terminal.ansi${name}`,`terminal.ansi-${i}`])),
  });
  const rules = [
    ['Keywords','syntax.keyword',['keyword','storage','storage.type','keyword.control','support.type.primitive']],
    ['Types','syntax.type',['entity.name.type','entity.name.class','entity.name.struct','entity.name.interface','support.type','support.class']],
    ['Functions','syntax.function',['entity.name.function','support.function','variable.function']],
    ['Strings','syntax.string',['string','string.quoted','string.template']],
    ['Numbers','syntax.number',['constant.numeric','constant.language.boolean','constant.language.null']],
    ['Comments','syntax.comment',['comment','punctuation.definition.comment']],
    ['Variables','syntax.variable',['variable','variable.other.readwrite']],
    ['Properties','syntax.property',['variable.other.property','variable.other.member','meta.object-literal.key']],
    ['Operators','syntax.operator',['keyword.operator','keyword.operator.logical']],
    ['Punctuation','syntax.punctuation',['punctuation','meta.brace','meta.delimiter']],
    ['Macros','syntax.macro',['entity.name.function.macro','support.function.macro','meta.annotation','entity.name.tag']],
    ['Markdown headings','syntax.markup-heading',['markup.heading','entity.name.section']],
    ['Markdown links','syntax.markup-link',['markup.underline.link','string.other.link']],
    ['Markup code','syntax.markup-code',['markup.raw','markup.inline.raw']],
  ].map(([name, role, scope])=>({name, scope, settings:{foreground:c(role)}}));
  rules.find(r=>r.name==='Comments').settings.fontStyle='italic';
  const o = {$schema:'vscode://schemas/color-theme',name:`Lacuna ${m==='paper'?'Paper':'Ink'}`,
    type:m==='paper'?'light':'dark', semanticHighlighting:true, colors, tokenColors:rules,
    semanticTokenColors:semanticColors};
  write(`vscode/themes/lacuna-${m}-color-theme.json`,json(o));
}

function kitty(m) {
  const c=r=>color(m,r); const ansi=colorSlots(m);
  const lines = [
    `# Lacuna ${m} — generated from aporia/tokens.json`,
    `foreground ${c('terminal.fg')}`, `background ${c('terminal.bg')}`,
    `cursor ${c('editor.cursor')}`, `cursor_text_color ${c('editor.cursor-text')}`,
    `selection_background ${c('editor.selection')}`, `selection_foreground ${c('fg.primary')}`,
    `url_color ${c('link.default')}`, `active_border_color ${c('border.focus')}`,
    `inactive_border_color ${c('border.decorative')}`, `active_tab_background ${c('bg.canvas')}`,
    `active_tab_foreground ${c('fg.primary')}`, `inactive_tab_background ${c('bg.surface')}`,
    `inactive_tab_foreground ${c('fg.secondary')}`,
    ...ansi.map((hex,i)=>`color${i} ${hex}`), ''
  ];
  write(`kitty/lacuna-${m}.conf`,lines.join('\n'));
}
function ghostty(m) {
  const c=r=>color(m,r); const ansi=colorSlots(m);
  write(`ghostty/lacuna-${m}`, [
    `# Lacuna ${m} — generated from aporia/tokens.json`,
    `background = ${c('terminal.bg')}`, `foreground = ${c('terminal.fg')}`,
    `cursor-color = ${c('editor.cursor')}`, `cursor-text = ${c('editor.cursor-text')}`,
    `selection-background = ${c('editor.selection')}`, `selection-foreground = ${c('fg.primary')}`,
    ...ansi.map((hex,i)=>`palette = ${i}=${hex}`),'',
  ].join('\n'));
}
function alacritty(m) {
  const c=r=>color(m,r); const ansi=colorSlots(m);
  const asEntries=(items, offset=0)=>items.map((key,i)=>`${key} = "${ansi[i+offset]}"`);
  const columns=['black','red','green','yellow','blue','magenta','cyan','white'];
  write(`alacritty/lacuna-${m}.toml`,[
    `# Lacuna ${m} — generated from aporia/tokens.json`,
    '[colors.primary]', `background = "${c('terminal.bg')}"`,`foreground = "${c('terminal.fg')}"`,
    '', '[colors.cursor]',`text = "${c('editor.cursor-text')}"`,`cursor = "${c('editor.cursor')}"`,
    '', '[colors.selection]',`text = "${c('fg.primary')}"`,`background = "${c('editor.selection')}"`,
    '', '[colors.normal]',...asEntries(columns),
    '', '[colors.bright]',...asEntries(columns,8), '',
  ].join('\n'));
}
function wezterm(m) {
  const c=r=>color(m,r); const ansi=colorSlots(m);
  const luaList=xs=>'{ '+xs.map(x=>`"${x}"`).join(', ')+' }';
  write(`wezterm/lacuna-${m}.lua`,[
    `-- Lacuna ${m} — generated from aporia/tokens.json`,
    '-- Use with: config.colors = require("colors.lacuna-'+m+'")',
    'return {',`  foreground = "${c('terminal.fg')}",`,
    `  background = "${c('terminal.bg')}",`,
    `  cursor_bg = "${c('editor.cursor')}",`,`  cursor_fg = "${c('editor.cursor-text')}",`,
    `  cursor_border = "${c('editor.cursor')}",`,
    `  selection_bg = "${c('editor.selection')}",`,`  selection_fg = "${c('fg.primary')}",`,
    `  ansi = ${luaList(ansi.slice(0,8))},`,`  brights = ${luaList(ansi.slice(8))},`,
    '}','',
  ].join('\n'));
}

for (const m of modes) { vscode(m); kitty(m); ghostty(m); alacritty(m); wezterm(m); }
const extensionPkg = {
  name:'lacuna-theme', displayName:'Lacuna — Aporia Themes',
  description:'Lacuna Paper and Lacuna Ink color themes generated from Aporia design tokens.',
  version:'0.1.0', publisher:'aporia', license:'UNLICENSED', private:true,
  engines:{vscode:'^1.85.0'}, categories:['Themes'],
  contributes:{themes:modes.map(m=>({
    label:`Lacuna ${m==='paper'?'Paper':'Ink'}`,
    uiTheme:m==='paper'?'vs':'vs-dark',
    path:`./themes/lacuna-${m}-color-theme.json`,
  }))},
};
write('vscode/package.json',json(extensionPkg));
write('zed/extension.toml', [
  'id = "lacuna"', 'name = "Lacuna"','version = "0.1.0"',
  'schema_version = 1', 'authors = ["Aporia"]',
  'description = "Lacuna Paper and Lacuna Ink, generated from Aporia tokens"',
  '# Planned repository address; verify or change before publishing the extension.',
  'repository = "https://github.com/curedbylethe/aporia"', '',
].join('\n'));
// Self-contained Zed extension directory alongside the standalone local theme.
write('zed/themes/lacuna.json',fs.readFileSync(path.join(dist,'zed/lacuna.json'),'utf8'));
console.log('aporia: built VS Code, Kitty, Ghostty, Alacritty, WezTerm and Zed extension assets');
