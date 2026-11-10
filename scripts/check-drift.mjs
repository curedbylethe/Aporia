/** Builds a second time and verifies every generated output is byte-identical. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function digestTree(){
  const hash={};
  const collect=(folder)=>{
    for(const f of fs.readdirSync(path.join(root,folder),{withFileTypes:true})){
      const p=path.join(folder,f.name);
      if(f.isDirectory())collect(p);
      else if(f.isFile())hash[p]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
    }
  };
  for(const f of ['dist','previews/dist'])collect(f);
  return hash;
}
if (!fs.existsSync(path.join(root,'dist/web/tokens.resolved.json'))) throw new Error('Run npm run build first');
const before=digestTree();
const result=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,encoding:'utf8'});
if(result.status!==0)throw new Error(`Second build failed:\n${result.stderr}\n${result.stdout}`);
const after=digestTree();
const changed=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>before[k]!==after[k]);
if(changed.length){console.error('Generated file drift:\n'+changed.join('\n'));process.exitCode=1;}
else console.log(`aporia: byte-identical regeneration confirmed (${Object.keys(after).length} files)`);
