import assert from 'node:assert/strict';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const executablePath = process.env.APORIA_CHROMIUM || undefined;
const browser = await chromium.launch({
  executablePath,
  args: executablePath ? ['--no-zygote', '--single-process', '--disable-dev-shm-usage'] : [],
});
const capture = process.argv.includes('--capture');
const folders = [
  'editorial/dossier', 'editorial/field-manual', 'editorial/resume', 'editorial/proposal',
  'documentation/study-guide', 'interface/instrument', 'interface/dense-dashboard', 'terminal/process-review',
];
const references = folders.map(folder => `references/${folder}/index.html`);
const gallery = 'previews/dist/index.html';
const specimen = 'previews/dist/helix-ink-typescript-work.html';
const galleryPages = (await readdir('previews/dist')).filter(name => /-(work|specimen)\.html$/.test(name))
  .map(name => `previews/dist/${name}`);
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const open = async file => {
  await page.goto(pathToFileURL(resolve(file)).href);
  await page.evaluate(() => document.fonts.ready.then(() => true));
};
async function screenshot(path, fullPage = true) {
  await mkdir(dirname(path), { recursive: true });
  await page.screenshot({ path, fullPage, animations: 'disabled' });
}
async function checkOverflow(file, width) {
  const [documentWidth, available] = await page.evaluate(() =>
    [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  assert.ok(documentWidth <= available, `${file} at ${width}px overflows (${documentWidth}/${available})`);
}

try {
  const pages = ['site/index.html', 'references/index.html', ...references, gallery, ...galleryPages,
    'site-output/site/index.html', 'site-output/AGENTS.html', 'site-output/docs/INSTALL.html',
    'site-output/docs/screenshots/README.html', 'site-output/docs/ANTI-PATTERNS.html'];
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const file of pages) {
      await open(file);
      await checkOverflow(file, width);
    }
  }
  for (const file of ['site/index.html', ...references, gallery]) {
    await open(file);
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const violations = await page.evaluate(async () => {
      const { violations } = await window.axe.run({ runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] });
      return violations.map(({ id, nodes }) => [id, nodes.map(node => node.target)]);
    });
    assert.deepEqual(violations, [], `Accessibility violations in ${file}`);
  }

  await open(gallery);
  const panels = page.locator('.sample code');
  assert.equal(await panels.nth(0).textContent(), await panels.nth(1).textContent());
  const keywords = page.locator('.sample [data-syntax=keyword]');
  const [paper, ink] = await keywords.evaluateAll(nodes => {
    const paper = nodes.find(node => node.closest('.paper'));
    const ink = nodes.find(node => node.closest('.ink'));
    return [getComputedStyle(paper).color, getComputedStyle(ink).color];
  });
  assert.notEqual(paper, ink, 'Paper and Ink syntax colors');
  await page.locator('#filter').fill('ZED Ink GO');
  assert.equal(await page.locator('.entry:visible').count(), 2);
  await page.locator('#filter').fill('no-such-host');
  assert.equal(await page.locator('.entry:visible').count(), 0);
  assert.equal(await page.locator('#empty').isVisible(), true);

  await open(references[4]);
  const model = page.getByRole('tab', { name: 'Execution model' });
  await model.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: 'Practice' }).getAttribute('aria-selected'), 'true');
  const solution = page.locator('summary');
  await solution.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('details').getAttribute('open'), '');
  await model.evaluate(node => node.click());
  await page.getByRole('button', { name: 'Run fixture' }).click();
  await page.waitForFunction(() => document.querySelector('#result').textContent === 'A, B, C');

  await open(references[5]);
  await page.locator('#string').selectOption('110');
  assert.equal(await page.locator('#frequency').textContent(), '110');
  await page.locator('#tone').click();
  await page.waitForFunction(() => document.querySelector('#tone-status').textContent === 'Playing');
  await page.locator('#tone').click();
  assert.equal(await page.locator('#tone-status').textContent(), 'Stopped');

  await open(references[6]);
  await page.locator('#process-filter').fill('reader');
  assert.equal(await page.locator('#row-count').textContent(), '1 record');
  await page.locator('#process-filter').fill('missing');
  assert.equal(await page.locator('#row-count').textContent(), 'No matching processes');

  await open(references[7]);
  await page.keyboard.press('ArrowDown');
  assert.match(await page.locator('#detail').textContent(), /python/);
  await page.locator('#close').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('dialog').isVisible(), true);
  assert.equal(await page.locator(':focus').textContent(), 'Cancel');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.activeElement.id === 'close');
  assert.equal(await page.locator('dialog').isVisible(), false);
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Simulate close' }).click();
  await page.waitForFunction(() => document.querySelector('#review-status').textContent.includes('python'));

  await open('site-output/site/index.html');
  await page.getByRole('link', { name: 'Philosophy Eight design principles' }).click();
  assert.match(page.url(), /docs\/PHILOSOPHY\.html$/);
  assert.equal(await page.getByRole('heading', { level: 1 }).textContent(), 'Design philosophy');

  await open('site/index.html');
  await page.locator('#token-filter').fill('syntax.keyword');
  assert.equal(await page.locator('#roles tr:visible').count(), 1);
  await page.locator('#reading-mode').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'ink');
  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(237, 228, 211)');
  await page.emulateMedia({ media: 'screen' });
  assert.deepEqual(errors, [], 'Uncaught browser errors');

  if (capture) {
    for (const file of references) {
      await open(file);
      await screenshot(`${dirname(file)}/screenshot.png`, false);
    }
    await open('site/identity.html');
    await page.setViewportSize({ width: 1280, height: 550 });
    await screenshot('docs/screenshots/aporia-identity.png', false);
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const [file, path] of [
      [gallery, 'gallery-browser'], [specimen, 'helix-ink-browser'],
      ['previews/dist/zed-paper-typescript-specimen.html', 'zed-paper-browser'],
    ]) {
      await open(file);
      await screenshot(`docs/screenshots/${path}.png`, false);
    }
  }
  else {
    for (const file of references) assert.ok((await stat(`${dirname(file)}/screenshot.png`)).size > 0);
  }
  console.log(`Aporia browser checks passed · Chromium ${browser.version()}`);
} finally {
  await browser.close();
}
