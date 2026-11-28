import { cpSync, mkdirSync, readdirSync } from 'node:fs';

const target = 'packages/agent-skill/dist/aporia-design';
mkdirSync(target, { recursive: true });
const files = {
  'packages/agent-skill/SKILL.md': 'SKILL.md',
  'DESIGN.md': 'DESIGN.md',
  'aporia/RULES.md': 'RULES.md',
  'dist/web/aporia.css': 'TOKENS.css',
  'LICENSE': 'LICENSE',
  'NOTICE': 'NOTICE',
  'CHANGELOG.md': 'CHANGELOG.md',
};
for (const [source, name] of Object.entries(files)) cpSync(source, `${target}/${name}`);
mkdirSync(`${target}/docs`, { recursive: true });
for (const name of readdirSync('docs').filter(name => name.endsWith('.md'))) {
  cpSync(`docs/${name}`, `${target}/docs/${name}`);
}
cpSync('docs/decisions', `${target}/docs/decisions`, { recursive: true });
cpSync('references', `${target}/references`, { recursive: true });
cpSync('site/aporia.css', `${target}/site/aporia.css`);
cpSync('site/index.html', `${target}/site/index.html`);
cpSync('site/explore.js', `${target}/site/explore.js`);
cpSync('dist/web', `${target}/dist/web`, { recursive: true });
cpSync('assets/fonts', `${target}/assets/fonts`, { recursive: true });
cpSync('AGENTS.md', `${target}/AGENTS.md`);
cpSync('aporia/RULES.md', `${target}/aporia/RULES.md`);
cpSync('aporia/tokens.json', `${target}/aporia/tokens.json`);
console.log(`Packaged ${target}`);
