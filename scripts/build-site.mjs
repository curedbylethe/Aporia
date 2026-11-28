import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { marked } from 'marked';
import { posix } from 'node:path';

const target = 'site-output';
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
for (const name of ['site', 'assets', 'references', 'previews/dist', 'previews/fixtures', 'dist', 'docs',
  'AGENTS.md', 'DESIGN.md', 'CHANGELOG.md', 'LICENSE', 'NOTICE', 'aporia', 'packages/agent-skill/README.md', 'CONTRIBUTING.md']) {
  cpSync(name, `${target}/${name}`, { recursive: true });
}

const pages = [
  'DESIGN.md', 'AGENTS.md', 'docs/PHILOSOPHY.md', 'docs/COMPOSITION.md',
  'docs/TYPOGRAPHY.md', 'docs/EDITORIAL.md', 'docs/INTERFACE.md', 'docs/TERMINAL.md',
  'docs/DATA-VISUALIZATION.md', 'docs/VOICE.md', 'docs/ANTI-PATTERNS.md',
  'docs/decisions/README.md', ...Array.from({ length: 8 }, (_, index) =>
    `docs/decisions/${String(index + 1).padStart(3, '0')}.md`),
  'docs/screenshots/README.md', 'docs/INSTALL.md', 'aporia/RULES.md',
  'docs/ARCHITECTURE.md', 'docs/QA.md', 'references/CAPTURES.md', 'packages/agent-skill/README.md', 'CONTRIBUTING.md',
];
for (const name of pages) {
  const prefix = '../'.repeat(name.split('/').length - 1);
  const markdown = readFileSync(name, 'utf8');
  const html = linkHtml(marked.parse(markdown), name)
    .replaceAll('<table>', '<div class="table-wrap" tabindex="0" aria-label="Table"><table>')
    .replaceAll('</table>', '</table></div>');
  writeFileSync(`${target}/${name.replace(/\.md$/, '.html')}`, `<!doctype html>
<html lang="en" data-theme="paper"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name.split('/').pop().replace('.md', '')} | Aporia</title><link rel="stylesheet" href="${prefix}assets/fonts/fonts.css"><link rel="stylesheet" href="${prefix}dist/web/aporia.css"><link rel="stylesheet" href="${prefix}site/aporia.css"></head><body><header class="top"><a href="${prefix}site/index.html">Aporia design system</a></header><main>${html}</main></body></html>\n`);
}
const indexPath = `${target}/site/index.html`;
writeFileSync(indexPath, linkHtml(readFileSync(indexPath, 'utf8'), 'site/index.html'));
writeFileSync(`${target}/index.html`, '<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=site/index.html"><title>Aporia</title><a href="site/index.html">Aporia design system</a></html>\n');
writeFileSync(`${target}/.nojekyll`, '');
console.log(`Static site written to ${target}/`);

function linkHtml(html, source) {
  return html.replace(/href="([^":#]+)\/"(?=[ >])/g, (attribute, path) => {
    const directory = posix.normalize(posix.join(posix.dirname(source), path));
    if (directory === 'references') return `href="${path}/index.html"`;
    if (pages.includes(`${directory}/README.md`)) return `href="${path}/README.html"`;
    return attribute;
  }).replace(/href="([^":#]+)\.md(#[^"]*)?"/g, (attribute, path, anchor = '') => {
    const resolved = posix.normalize(posix.join(posix.dirname(source), `${path}.md`));
    return pages.includes(resolved) ? `href="${path}.html${anchor}"` : attribute;
  });
}
