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
eq(resolved.refs.length,48,'expected original Aporia primitive count');
eq(resolved.semantic.length,79,'expected original Aporia semantic count');
eq(resolved.contrast.length,327,'expected original Aporia contrast coverage');
eq(resolved.contrast.filter(r=>!r.pass).length,0,'contrast regression');
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
eq(htmlCount,25,'24 standalone specimens + index');
const checkPython = spawnSync('python3',['-c','import tomllib,sys;[tomllib.load(open(f,"rb")) for f in sys.argv[1:]]',
  ...['dist/helix/lacuna-paper.toml','dist/helix/lacuna-ink.toml',
  'dist/alacritty/lacuna-paper.toml','dist/alacritty/lacuna-ink.toml']
  .map(p=>path.join(root,p))],{encoding:'utf8'});
if(checkPython.status===0)checks+=4;
else if(checkPython.error?.code==='ENOENT') console.log('Optional Python TOML parser unavailable; TOML parser test skipped');
else throw new Error(`TOML parsing failed: ${checkPython.stderr}`);
console.log(`aporia: ${checks} structural assertions passed; ${htmlCount} standalone HTML pages verified`);
console.log('aporia: 327/327 original WCAG pairs passed; real host rendering remains unverified');
