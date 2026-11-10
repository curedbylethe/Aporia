/** One entrypoint and one dependency chain: canonical -> adapters -> previews. */
import { spawnSync } from 'node:child_process';
for (const step of ['aporia/build.mjs','scripts/build-platforms.mjs','scripts/build-gallery.mjs']) {
  const x=spawnSync(process.execPath,[step],{stdio:'inherit'});
  if (x.status!==0)process.exit(x.status||1);
}
