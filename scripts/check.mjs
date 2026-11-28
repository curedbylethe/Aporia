/** Dependency-free validation of canonical roles, artifacts, links, and host formats.
 * This cannot replace real Helix, Zed, VS Code or terminal runtime testing.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const json=(p)=>JSON.parse(read(p));
let checks=0;
const ok=(value,msg)=>{assert.ok(value,msg);checks++;};
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;};
const rel=(folder)=>fs.readdirSync(path.join(root,folder),{withFileTypes:true}).filter(f=>f.isFile()).map(f=>f.name);
const canon=json('aporia/tokens.json'); const resolved=json('dist/web/tokens.resolved.json');
ok(canon.color?.paper && canon.color?.ink,'canonical tree must define both modes');
const leaves = (tree, prefix = '') => Object.entries(tree).flatMap(([key, token]) => {
  const name = prefix ? `${prefix}.${key}` : key;
  if (key.startsWith('$')) return [];
  if (Object.hasOwn(token, '$value')) {
    ok(typeof token.$type === 'string' && token.$value !== null, `invalid token ${name}`);
    return [name];
  }
  return leaves(token, name);
});
leaves(canon);
const paperKeys = leaves(canon.color.paper).sort();
eq(paperKeys, leaves(canon.color.ink).sort(), 'Paper and Ink role parity');
eq(paperKeys, resolved.semantic.map(({ key }) => key).sort(), 'resolved semantic role coverage');
eq(leaves(canon.color.ref).sort(), resolved.refs.map(({ name }) => name).sort(), 'resolved primitive coverage');
const tokenValue = (value) => {
  const alias = typeof value === 'string' && /^\{(.+)\}$/.exec(value);
  if (!alias) return value;
  const target = alias[1].split('.').reduce((tree, key) => tree[key], canon);
  return tokenValue(target.$value);
};
for (const [name, role] of Object.entries(canon.type)) {
  for (const metric of ['size', 'leading', 'tracking', 'weight']) {
    eq(resolved.typography[name][metric], tokenValue(role[metric].$value), `resolved typography ${name}.${metric}`);
    ok(read('dist/web/aporia.css').includes(`--type-${name}-${metric}: `), `missing CSS type role ${name}.${metric}`);
  }
}
const contrast = new Map(resolved.contrast.map(pair => [`${pair.mode}/${pair.fg}/${pair.bg}`, pair]));
eq(contrast.size, resolved.contrast.length, 'unique contrast pairs');
const requirePair = (mode, fg, bg, min) => {
  const pair = contrast.get(`${mode}/${fg}/${bg}`);
  ok(pair?.pass && pair.min === min, `missing or failed contrast ${mode} ${fg} on ${bg}`);
};
for (const mode of ['paper', 'ink']) {
  for (const fg of paperKeys.filter(key => key.startsWith('syntax.'))) {
    for (const bg of ['bg.canvas', 'editor.line-active', 'editor.selection', 'editor.search-match', 'editor.diff-added', 'editor.diff-removed'])
      requirePair(mode, fg, bg, 4.5);
  }
  for (const fg of paperKeys.filter(key => key.startsWith('chart.'))) requirePair(mode, fg, 'bg.canvas', 3);
  requirePair(mode, 'fg.primary', 'bg.canvas', 4.5);
  requirePair(mode, 'border.focus', 'bg.canvas', 3);
  requirePair(mode, 'terminal.fg', 'terminal.bg', 4.5);
}
ok(resolved.contrast.every(({ ratio, min, pass }) => pass && ratio >= min), 'contrast regression');
const sem=Object.fromEntries(resolved.semantic.map(s=>[s.key,s]));
const hex=/^#[0-9A-Fa-f]{6}$/;
for(const m of ['paper','ink']){
  for(const k of ['bg.canvas','fg.primary','syntax.keyword','syntax.comment','syntax.type','syntax.string','terminal.bg','terminal.fg']) {
    ok(hex.test(sem[k][m]),`missing solid semantic ${m}.${k}`);
  }
  const hx=read(`dist/helix/lacuna-${m}.toml`);
  ok(hx.includes('"ui.background"'),`Helix ${m} missing ui.background`);
  ok(hx.includes('"ui.selection"'),`Helix ${m} missing selection`);
  ok(hx.includes('"diagnostic.error"'),`Helix ${m} missing diagnostic`);
  ok(hx.includes(sem['bg.canvas'][m]),`Helix ${m} missing canonical canvas`);
  const vs=json(`dist/vscode/themes/lacuna-${m}-color-theme.json`);
  eq(vs.type,m==='paper'?'light':'dark',`VS Code appearance ${m}`);
  eq(vs.colors['editor.background'],sem['bg.canvas'][m],`VS Code ${m} canonical canvas`);
  eq(vs.colors['editor.foreground'],sem['fg.primary'][m],`VS Code ${m} canonical foreground`);
  ok(vs.tokenColors.length>=12,`VS Code ${m} syntax scopes`);
  ok(vs.semanticHighlighting && Object.keys(vs.semanticTokenColors).length>10,`VS Code ${m} semantic tokens`);
  const kitty=read(`dist/kitty/lacuna-${m}.conf`);
  ok(kitty.includes(`background ${sem['terminal.bg'][m]}`),`Kitty ${m} canvas`);
  eq([...kitty.matchAll(/^color(?:[0-9]|1[0-5]) /gm)].length,16,`Kitty ${m} has 16 ANSI colors`);
  const ghost=read(`dist/ghostty/lacuna-${m}`);
  eq([...ghost.matchAll(/^palette = (?:[0-9]|1[0-5])=/gm)].length,16,`Ghostty ${m} has 16 ANSI colors`);
  ok(ghost.includes(`background = ${sem['terminal.bg'][m]}`),`Ghostty ${m} canvas`);
  const alacritty=read(`dist/alacritty/lacuna-${m}.toml`);
  ok(alacritty.includes('[colors.normal]')&&alacritty.includes('[colors.bright]'),`Alacritty ${m} sections`);
  const wez=read(`dist/wezterm/lacuna-${m}.lua`);
  ok(wez.includes('return {') && wez.includes('brights = {'),`WezTerm ${m} output`);
}
const zed=json('dist/zed/lacuna.json');
eq(zed.$schema,'https://zed.dev/schema/themes/v0.2.0.json','Zed published schema version');
eq(zed.themes.length,2,'Zed family modes');
for(const [i,m] of ['paper','ink'].entries()){
  const z=zed.themes[i];
  eq(z.appearance,m==='paper'?'light':'dark',`Zed ${m} appearance`);
  eq(z.style['editor.background'],sem['bg.canvas'][m],`Zed ${m} canvas`);
  eq(z.style.syntax.keyword.color,sem['syntax.keyword'][m],`Zed ${m} syntax`);
  eq(z.style.players.length,4,`Zed ${m} collaborators`);
}
eq(json('dist/zed/themes/lacuna.json'),zed,'Zed extension theme copy drift');
const vspkg=json('dist/vscode/package.json');
eq(vspkg.contributes.themes.length,2,'VS Code extension contributions');
for(const t of vspkg.contributes.themes)ok(fs.existsSync(path.join(root,'dist/vscode',t.path)),'VS Code extension path missing');
let htmlCount=0;
for(const name of rel('previews/dist').filter(f=>f.endsWith('.html'))){
  htmlCount++;
  const html=read(`previews/dist/${name}`);
  ok(html.startsWith('<!doctype html>'),`no doctype in ${name}`);
  ok(!html.includes('href="aporia.html"')&&!html.includes('href="lacuna.html"'),`stale links in ${name}`);
  ok(!html.includes('[object Object]'),`object string in ${name}`);
  ok(!html.includes('class="m fail"'),`illustrative gallery contrast regression in ${name}`);
  for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
    if(href.startsWith('#') || /^(?:https?:|mailto:|data:)/.test(href)) continue;
    const target=href.split('#')[0].split('?')[0];
    if(target)ok(fs.existsSync(path.join(root,'previews/dist',target)),`broken ${name} -> ${href}`);
  }
}
for (const host of ['helix', 'zed'])
  for (const mode of ['paper', 'ink'])
    for (const lang of ['go', 'rust', 'typescript'])
      for (const kind of ['work', 'specimen'])
        ok(read('previews/dist/index.html').includes(`href="${host}-${mode}-${lang}-${kind}.html"`), `gallery entry ${host}/${mode}/${lang}/${kind}`);
const gallery = read('previews/dist/index.html');
for (const role of ['keyword', 'type', 'string', 'comment', 'number']) {
  ok(gallery.includes(`data-syntax="${role}"`), `gallery sample missing syntax role ${role}`);
}
eq(gallery, read('previews/dist/lacuna-themes.html'), 'legacy gallery entrypoint');
const checkPython = spawnSync('python3',['-c','import tomllib,sys;[tomllib.load(open(f,"rb")) for f in sys.argv[1:]]',
  ...['dist/helix/lacuna-paper.toml','dist/helix/lacuna-ink.toml',
  'dist/alacritty/lacuna-paper.toml','dist/alacritty/lacuna-ink.toml']
  .map(p=>path.join(root,p))],{encoding:'utf8'});
if(checkPython.status===0)checks+=4;
else if(checkPython.error?.code==='ENOENT') console.log('Optional Python TOML parser unavailable; TOML parser test skipped');
else throw new Error(`TOML parsing failed: ${checkPython.stderr}`);
console.log(`aporia: ${checks} structural assertions passed; ${htmlCount} standalone HTML pages verified`);
console.log(`aporia: ${contrast.size} WCAG pairs passed`);
