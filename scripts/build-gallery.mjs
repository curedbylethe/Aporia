/** Generates the 24 standalone gallery pages and a compare/search index.
 * All displayed colors are read from dist/web/tokens.resolved.json, never maintained here.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const dir=path.join(root,'previews/dist');fs.mkdirSync(dir,{recursive:true});
const src=JSON.parse(read('dist/web/tokens.resolved.json'));
const colors={paper:{},ink:{}};
for(const item of src.semantic){colors.paper[item.key]=item.paper;colors.ink[item.key]=item.ink;}
const canon=JSON.parse(read('aporia/tokens.json'));
const fontValue=(id)=>canon.font[id].$value.map(f=>/\s/.test(f)?JSON.stringify(f):f).join(', ');
const roles={background:'bg.canvas',surface:'bg.surface',foreground:'fg.primary',muted:'editor.line-number',
  comment:'syntax.comment',keyword:'syntax.keyword',type:'syntax.type',string:'syntax.string',
  number:'syntax.number',error:'status.danger',warning:'status.warning',
  function:'syntax.function',parameter:'syntax.variable',attribute:'syntax.macro',
  operator:'syntax.operator',punctuation:'syntax.punctuation'};
const ed=Object.fromEntries(['paper','ink'].map(m=>[m,Object.fromEntries(Object.entries(roles).map(([id,role])=>[id,colors[m][role]]))]));
const bridge=[
  '/* GENERATED: semantic roles resolved by aporia/build.mjs */', ':root {',
  ...['display','body','mono'].map(name=>`  --aporia-font-${name}: ${fontValue(name)};`),
  ...['paper','ink'].flatMap(m=>Object.entries(colors[m]).map(([role,value])=>
    `  --aporia-${m}-${role.replace(/\./g,'-')}: ${value};`)),
  '}', '',
].join('\n');
const css=bridge+'\n'+read('previews/src/lacuna.css');
const prefix=[
  '/* GENERATED from Aporia tokens and platform outputs */',
  `const GALLERY_COLORS = ${JSON.stringify(colors)};`,
  `const GALLERY_ED = ${JSON.stringify(ed)};`,
  `const GALLERY_HELIX_SNIPPET = ${JSON.stringify(read('dist/helix/lacuna-ink.toml'))};`,
  `const GALLERY_ZED_SNIPPET = ${JSON.stringify(read('dist/zed/lacuna.json'))};`,
  '',
].join('\n');
const data=prefix+read('previews/src/lacuna.data.js');
const app=read('previews/src/lacuna.app.js');
for(const [name,text] of [['CSS',css],['data',data],['app',app]]) {
  if (text.includes('</script') || (name==='CSS' && text.includes('</style'))) throw new Error(`${name} would break inline HTML`);
}
const context={console,__CSS:css};vm.createContext(context);
vm.runInContext(data+'\n'+app,context,{timeout:15000});
const {MATRIX,fileFor,documentHtml}=context.__LACUNA;
if (MATRIX.length !==24 || new Set(MATRIX.map(p=>p.slug)).size !== 24) throw new Error('Gallery matrix incomplete');
for(const page of MATRIX){
  const output=documentHtml(page);
  if (/\[object Object\]|>undefined<|>NaN/.test(output)) throw new Error(`Invalid HTML ${page.slug}`);
  fs.writeFileSync(path.join(dir,fileFor(page)),output);
}
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const code=`// Aporia / Lacuna
interface Theme { name: string; mode: 'paper' | 'ink'; }
const themes: Theme[] = [
  { name: 'Lacuna Paper', mode: 'paper' },
  { name: 'Lacuna Ink', mode: 'ink' },
];
function resolve(mode: Theme['mode']) {
  return themes.find(theme => theme.mode === mode);
}`;
const samples=['paper','ink'].map(m=>{
  const c=colors[m];
  return `<section class="sample ${m}" style="--surface:${c['bg.canvas']};--fg:${c['fg.primary']};--raised:${c['bg.surface']};--red:${c['syntax.keyword']};--line:${c['editor.line-number']}">
    <div class="sample-heading"><span>LACUNA ${m.toUpperCase()}</span><span>${m==='paper'?'01 / LIGHT':'02 / DARK'}</span></div>
    <div class="windowbar"><span>theme/resolve.ts</span><span>TypeScript · generated</span></div>
    <pre><code>${escape(code)}</code></pre>
    <div class="swatches">${['syntax.keyword','syntax.type','syntax.string','syntax.number','syntax.comment','editor.selection'].map(k=>`<span title="${k}: ${c[k]}" style="background:${c[k]}"></span>`).join('')}</div>
  </section>`;
}).join('');
const links=MATRIX.map((p,i)=>{
  const label=`${p.host} / ${p.variant} / ${p.lang} / ${p.kind}`;
  return `<a class="entry" href="${fileFor(p)}" data-search="${label}"><span class="entry-number">${String(i+1).padStart(2,'0')}</span><span>${escape(label)}</span><span aria-hidden="true">↗</span></a>`;
}).join('\n');
const index=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Lacuna Paper and Ink — Aporia semantic theme gallery for Helix and Zed."><title>Lacuna / Theme Gallery — Aporia</title><style>
:root{--paper:${colors.paper['bg.canvas']};--ink:${colors.paper['fg.primary']};--red:${colors.paper['accent.text']};--line:${colors.paper['border.control']}}*{box-sizing:border-box}html{font-family:ui-sans-serif,system-ui,sans-serif}body{margin:0;background:var(--paper);color:var(--ink)}.wrap{max-width:1180px;padding:28px 30px;margin:0 auto}.top{display:flex;align-items:center;gap:18px;border-bottom:2px solid var(--ink);padding-bottom:12px;font-size:.76rem;letter-spacing:.1em;text-transform:uppercase}.top b{font-size:1.1rem}.top .right{margin-left:auto}h1{font-family:Impact,'Arial Black',sans-serif;text-transform:uppercase;letter-spacing:-.04em;font-size:clamp(3rem,8vw,7rem);line-height:.96;margin:45px 0 12px}h1 span{color:var(--red)}.lead{max-width:65ch;font-size:1rem;line-height:1.65}.kicker{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase}a{color:inherit}a:focus-visible,input:focus-visible{outline:3px solid var(--red);outline-offset:4px}.samples{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:38px 0}.sample{background:var(--surface);color:var(--fg);border:1px solid var(--fg);min-width:0}.sample-heading,.windowbar{display:flex;justify-content:space-between;gap:8px;padding:10px 14px;font-size:.7rem;letter-spacing:.06em}.windowbar{background:var(--raised);letter-spacing:0;border-block:1px solid color-mix(in srgb,var(--fg) 22%,var(--surface))}.sample pre{overflow:auto;line-height:1.65;padding:10px 18px 20px;font-size:.76rem}.swatches{display:flex;gap:3px;padding:12px 14px;border-top:1px solid color-mix(in srgb,var(--fg) 18%,var(--surface))}.swatches span{width:35px;height:8px;border:1px solid color-mix(in srgb,var(--fg) 28%,transparent)}.gallery-head{display:flex;gap:12px;align-items:center;justify-content:space-between;border-top:2px solid var(--ink);padding:20px 0}h2{margin:0;font-size:1.35rem}input{font:inherit;border:1px solid var(--ink);background:transparent;padding:12px 14px;width:min(300px,100%);border-radius:0}.entries{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:24px}.entry{display:grid;grid-template-columns:40px 1fr 18px;gap:12px;text-decoration:none;border-top:1px solid var(--line);padding:13px 5px;font-size:.88rem}.entry:hover{background:color-mix(in srgb,var(--ink) 6%,var(--paper))}.entry[hidden]{display:none}.entry-number{color:var(--red);font-size:.75rem}.footer{border-top:2px solid var(--ink);margin-top:38px;padding:18px 0;font-size:.75rem}#empty{display:none} @media(max-width:760px){.wrap{padding:20px}.samples,.entries{grid-template-columns:1fr}.gallery-head{align-items:flex-start;flex-direction:column}input{width:100%}h1{font-size:clamp(3rem,13vw,5rem)}}
</style></head><body><main class="wrap"><header class="top"><b>APORIA <span style="color:var(--red)">/</span> LACUNA</b><span class="right">THEME RECORD — 01</span></header><h1>Made for <span>code.</span></h1><p class="lead">Two editions, one identity. Aporia's canonical semantic tokens generate the color themes for Helix, Zed, VS Code and terminal emulators. These 24 specimens are browser illustrations, not screenshots of the editors.</p><div class="samples">${samples}</div><div class="gallery-head"><div><p class="kicker">Evidence plates / 24</p><h2>Browse the specimen matrix</h2></div><label class="kicker">Filter pages <input id="filter" type="search" placeholder="Host, mode, language or view" autocomplete="off"></label></div><div class="entries" id="entries">${links}</div><p id="empty" role="status">No specimens match this filter.</p><footer class="footer">Aporia Core → Lacuna Paper / Ink · Source: <code>aporia/tokens.json</code> · Build: <code>npm run build</code></footer></main><script>const filter=document.querySelector('#filter');filter.addEventListener('input',()=>{let shown=0;for(const a of document.querySelectorAll('.entry')){const terms=filter.value.toLowerCase().trim().split(/\\s+/).filter(Boolean);const yes=terms.every(t=>a.dataset.search.includes(t));a.hidden=!yes;if(yes)shown++;}document.querySelector('#empty').style.display=shown?'none':'block';});<`+`/script></body></html>`;
fs.writeFileSync(path.join(dir,'index.html'),index);
fs.writeFileSync(path.join(dir,'lacuna-themes.html'),index);
console.log(`aporia: generated ${MATRIX.length} standalone specimens + searchable index`);
