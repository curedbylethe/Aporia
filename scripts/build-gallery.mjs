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
const canonicalCss=read('dist/web/aporia.css');
const css=bridge+'\n'+canonicalCss+'\n'+read('previews/src/lacuna.css');
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
const {MATRIX,fileFor,documentHtml,tokenize}=context.__LACUNA;
if (MATRIX.length !==24 || new Set(MATRIX.map(p=>p.slug)).size !== 24) throw new Error('Gallery matrix incomplete');
for(const page of MATRIX){
  const output=documentHtml(page);
  if (/\[object Object\]|>undefined<|>NaN/.test(output)) throw new Error(`Invalid HTML ${page.slug}`);
  fs.writeFileSync(path.join(dir,fileFor(page)),output);
}
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const code=read('previews/fixtures/resolve.ts').trimEnd();
const syntaxClasses={
  't-k':'keyword','t-t':'type','t-s':'string','t-n':'number','t-c':'comment',
  't-d':'comment','t-f':'function','t-p':'punctuation','t-o':'operator',
  't-a':'macro','t-v':'variable','t-ns':'type','t-e':'string',
};
const highlighted=code.split('\n').map(line=>tokenize(line,'typescript').map(([className, token])=>{
  const role=syntaxClasses[className];
  return role ? `<span data-syntax="${role}">${escape(token)}</span>` : escape(token);
}).join('')).join('\n');
const samples=['paper','ink'].map(m=>{
  const c=colors[m];
  return `<section class="sample ${m}" style="--surface:${c['bg.canvas']};--fg:${c['fg.primary']};--raised:${c['bg.surface']};--sample-border:${c['border.control']};--border-focus:${c['border.focus']};${Object.keys(c).filter(k=>k.startsWith('syntax.')).map(k=>`--${k.replace('.', '-')}:${c[k]}`).join(';')}">
    <div class="sample-heading"><span>LACUNA ${m.toUpperCase()}</span><span>${m==='paper'?'01 / LIGHT':'02 / DARK'}</span></div>
    <div class="windowbar"><span>resolve.ts</span><span>TypeScript · specimen</span></div>
    <pre tabindex="0" aria-label="TypeScript source"><code>${highlighted}</code></pre>
    <div class="swatches">${['syntax.keyword','syntax.type','syntax.string','syntax.number','syntax.comment','editor.selection'].map(k=>`<span title="${k}: ${c[k]}" style="background:${c[k]}"></span>`).join('')}</div>
  </section>`;
}).join('');
const links=MATRIX.map((p,i)=>{
  const label=`${p.host} / ${p.variant} / ${p.lang} / ${p.kind}`;
  return `<a class="entry" href="${fileFor(p)}" data-search="${label}"><span class="entry-number">${String(i+1).padStart(2,'0')}</span><span>${escape(label)}</span><span aria-hidden="true">↗</span></a>`;
}).join('\n');
const fonts=read('assets/fonts/fonts.css').replace(/url\("([a-z-]+\.woff2)"\)/g, (_, name) =>
  `url("data:font/woff2;base64,${fs.readFileSync(path.join(root,'assets/fonts',name)).toString('base64')}")`);
const index=`<!doctype html><html lang="en" data-theme="paper"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Lacuna Paper and Ink — Aporia semantic theme gallery for Helix and Zed."><title>Lacuna / Theme Gallery — Aporia</title><style>
${canonicalCss}
${fonts}
${read('previews/src/gallery.css')}
${[...new Set(Object.values(syntaxClasses))].map(role=>`[data-syntax="${role}"]{color:var(--syntax-${role})}`).join('\n')}
</style></head><body><main class="wrap"><header class="top"><b>APORIA / LACUNA</b><span class="right">Theme gallery</span></header><h1>Lacuna<span>.</span></h1><p class="lead">Two editions, one identity. Aporia's canonical semantic tokens generate the color themes for Helix, Zed, VS Code and terminal emulators. These 24 specimens are browser illustrations, not screenshots of the editors.</p><div class="samples">${samples}</div><div class="gallery-head"><div><p class="kicker">Browser specimens</p><h2>Browse the specimen matrix</h2></div><label class="kicker">Filter pages <input id="filter" type="search" placeholder="Host, mode, language or view" autocomplete="off"></label></div><div class="entries" id="entries">${links}</div><p id="empty" role="status">No specimens match this filter.</p><footer class="footer">Aporia Core → Lacuna Paper / Ink · Source: <code>aporia/tokens.json</code> · Build: <code>npm run build</code></footer></main><script>const filter=document.querySelector('#filter');filter.addEventListener('input',()=>{let shown=0;const terms=filter.value.toLowerCase().trim().split(/\\s+/).filter(Boolean);for(const a of document.querySelectorAll('.entry')){const yes=terms.every(t=>a.dataset.search.toLowerCase().includes(t));a.hidden=!yes;if(yes)shown++;}document.querySelector('#empty').style.display=shown?'none':'block';});<`+`/script></body></html>`;
fs.writeFileSync(path.join(dir,'index.html'),index);
fs.writeFileSync(path.join(dir,'lacuna-themes.html'),index);
console.log(`aporia: generated ${MATRIX.length} standalone specimens + searchable index`);
