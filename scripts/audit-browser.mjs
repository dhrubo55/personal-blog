import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { launch } from 'chrome-launcher';
import puppeteer from 'puppeteer-core';

const base = process.argv[2] || 'http://127.0.0.1:8792/';
const destination = process.argv[3] || '.tools/site-quality/browser';
await mkdir(destination, { recursive: true });
const chrome = await launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ['--headless=new', '--no-first-run'] });
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });
const evidence = { browser: await browser.version(), base, checks: [] };
try {
  for (const width of [1440, 390]) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
      await page.evaluateOnNewDocument(pref => localStorage.setItem('pref-theme', pref), theme);
      const requests = [];
      page.on('request', request => requests.push(request.url()));
      const label = `${width}-${theme}`;
      await page.goto(new URL('/java/100daysofjava/graph/', base).href, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => document.getElementById('java-graph-status').textContent.startsWith('Loaded'));
      const initial = await page.evaluate(() => {
        const canvas = document.getElementById('java-graph-canvas');
        const cy = canvas._cyreg.cy;
        window.auditLayouts = [];
        cy.on('layoutstart', event => window.auditLayouts.push(event.layout.options.name));
        return { layout: cy._private.options.layout.name, count: cy.nodes(':visible').length,
          labels: ['min', 'max'].map(key => document.getElementById(`java-graph-day-${key}`).getAttribute('aria-label')) };
      });
      assert.equal(initial.layout, 'preset');
      assert.ok(initial.count > 90);
      assert.deepEqual(initial.labels, ['Minimum day', 'Maximum day']);
      await page.screenshot({ path: path.join(destination, `atlas-${label}.png`), fullPage: false });
      const setSearch = async value => {
        await page.$eval('#java-graph-search', (input, value) => { input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); }, value);
      };
      await setSearch('no-such-topic-5147');
      assert.match(await page.$eval('#java-graph-status', el => el.textContent), /0 nodes/);
      await page.click('#java-graph-reset');
      const topic = await page.$eval('#java-graph-topic-filter', el => el.options[1].value);
      await page.select('#java-graph-topic-filter', topic);
      assert.ok(await page.evaluate(() => document.getElementById('java-graph-canvas')._cyreg.cy.nodes(':visible').every(node => node.data('topic') === document.getElementById('java-graph-topic-filter').value)));
      await page.click('#java-graph-reset');
      await page.click('#java-graph-cluster-toggle');
      assert.ok(await page.evaluate(() => {
        const edges = document.getElementById('java-graph-canvas')._cyreg.cy.edges();
        return edges.length > 0 && edges.every(edge => edge.source().length && edge.target().length);
      }));
      await page.click('#java-graph-reset');
      await page.focus('#java-graph-day-min');
      await page.keyboard.press('End');
      assert.equal(await page.$eval('#java-graph-day-min-value', el => el.textContent), '100');
      await page.click('#java-graph-cluster-toggle');
      assert.match(await page.$eval('#java-graph-status', el => el.textContent), /Collapsed view:/);
      await page.focus('#java-graph-day-max');
      await page.keyboard.press('Home');
      assert.equal(await page.$eval('#java-graph-day-min-value', el => el.textContent), '1');
      await page.click('#java-graph-cluster-toggle');
      await page.click('#java-graph-reset');
      for (const relation of ['sequence', 'reference', 'topic']) await page.click(`input.java-graph-edge-type[value="${relation}"]`);
      assert.match(await page.$eval('#java-graph-status', el => el.textContent), /0 edges/);
      await page.click('#java-graph-reset');
      await page.click('#java-graph-layout-refresh');
      await setSearch('thread');
      assert.equal(await page.evaluate(() => window.auditLayouts.filter(name => name === 'cose').length), 1);
      await page.click('#java-graph-reset');
      const preset = await page.evaluate(async () => {
        const config = JSON.parse(document.getElementById('java-graph-config').textContent);
        const response = await fetch(config.dataUrl);
        const graph = await response.json();
        const matches = document.getElementById('java-graph-canvas')._cyreg.cy.nodes().every(node => {
          const expected = graph.geometry.expanded[node.id()];
          return Math.abs(node.position('x') - expected.x) < 0.01 && Math.abs(node.position('y') - expected.y) < 0.01;
        });
        return { matches, transport: { upstreamEncoding: response.headers.get('x-content-encoding-over-network'), browserEncoding: response.headers.get('content-encoding') } };
      });
      assert.ok(preset.matches);
      evidence.transport ??= preset.transport;
      const point = await page.evaluate(() => {
        const canvas = document.getElementById('java-graph-canvas');
        const cy = canvas._cyreg.cy;
        const position = cy.nodes(':visible')[0].renderedPosition();
        const rect = canvas.getBoundingClientRect();
        return { x: rect.x + position.x, y: rect.y + position.y };
      });
      await page.mouse.click(point.x, point.y);
      assert.equal(await page.$eval('#java-graph-open-link', el => el.hidden), false);
      const article = await page.$eval('#java-graph-open-link', el => el.getAttribute('href'));
      assert.match(article, /\/posts\//);
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.click('#java-graph-open-link')]);
      assert.equal(new URL(page.url()).pathname, new URL(article, base).pathname);
      await page.goto(new URL('/posts/posts/java/100daysofjava/day99/', base).href, { waitUntil: 'networkidle0' });
      const contrast = await page.evaluate(() => {
        const element = document.querySelector('.chroma .lnt, .chroma .ln');
        if (!element) throw new Error('Code line numbers are missing');
        const rgb = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
        const luminance = color => rgb(color).map(value => { const s = value / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
        let background = element;
        while (getComputedStyle(background).backgroundColor === 'rgba(0, 0, 0, 0)') background = background.parentElement;
        const colors = [luminance(getComputedStyle(element).color), luminance(getComputedStyle(background).backgroundColor)].sort((a, b) => b - a);
        return (colors[0] + 0.05) / (colors[1] + 0.05);
      });
      assert.ok(contrast >= 4.5, `Line number contrast ${label}: ${contrast}`);
      assert.ok(await page.$('button.copy-code'), 'Code copy control missing');
      await page.screenshot({ path: path.join(destination, `article-${label}.png`), fullPage: false });
      assert.equal(requests.filter(url => /\/css\/pages\/support\./.test(url)).length, 0);
      await page.goto(new URL('/support/', base).href, { waitUntil: 'networkidle0' });
      await page.click('[onclick*="switchSupportTab"][onclick*="intl"]');
      await page.click('[onclick*="switchSupportTab"][onclick*="local"]');
      await page.click('[onclick*="showSupportQR("]');
      assert.equal(await page.$eval('#support-qr-overlay', el => el.hidden), false);
      await page.click('.support-qr-close');
      assert.equal(await page.$eval('#support-qr-overlay', el => el.hidden), true);
      await page.screenshot({ path: path.join(destination, `support-${label}.png`), fullPage: false });
      const supportBundles = requests.filter(url => /\/css\/pages\/support\./.test(url));
      assert.equal(supportBundles.length, 1);
      assert.equal(requests.filter(url => /google-analytics\.com|googletagmanager\.com|googlesyndication\.com|doubleclick\.net|ads-twitter\.com|analytics\.twitter\.com/.test(url)).length, 0);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `${label}: horizontal page overflow`);
      evidence.checks.push({ width, theme, initialNodes: initial.count, lineNumberContrast: contrast, trackingRequests: 0, supportBundles: supportBundles.length, article });
      await page.close();
    }
  }
  const fallback = await browser.newPage();
  const html = await (await fetch(new URL('/java/100daysofjava/graph/', base))).text();
  await fallback.goto(base);
  await fallback.setContent(html.replace('<head>', `<head><base href="${base}">`).replace(/"dataUrl":"[^"]+"/, '"dataUrl":"/missing-graph-data.json"'), { waitUntil: 'networkidle0' });
  await fallback.waitForFunction(() => document.getElementById('java-graph-status').textContent.startsWith('Could not load graph data'));
  assert.ok(await fallback.$eval('#java-graph-fallback', el => el.getBoundingClientRect().height > 0 && el.querySelectorAll('a').length > 90));
  evidence.fallback = 'Textual article links remain visible after graph fetch failure';
  await fallback.close();
  const missingEngine = await browser.newPage();
  await missingEngine.setRequestInterception(true);
  missingEngine.on('request', request => request.url().includes('/cytoscape@3.29.2/') ? request.abort() : request.continue());
  await missingEngine.goto(new URL('/java/100daysofjava/graph/', base).href, { waitUntil: 'networkidle0' });
  await missingEngine.waitForFunction(() => document.getElementById('java-graph-status').textContent.includes('Graph engine unavailable'));
  assert.ok(await missingEngine.$eval('#java-graph-fallback', el => el.getBoundingClientRect().height > 0 && el.querySelectorAll('a').length > 90));
  evidence.engineFailure = 'Textual article links remain visible in an explicit missing-library fault test';
  await missingEngine.close();
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await writeFile(path.join(destination, 'report.json'), JSON.stringify(evidence, null, 2) + '\n');
  await browser.disconnect();
  await chrome.kill();
}
