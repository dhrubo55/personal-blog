import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { auditSite } from '../scripts/audit-site.mjs';
import { summarize, verifyServedArtifact } from '../scripts/audit-lighthouse.mjs';

test('artifact inventory catches broken and case-only paths on every OS, accepts aliases and assets', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'site-audit-'));
  try {
    await mkdir(path.join(root, 'alias'));
    await writeFile(path.join(root, 'alias/index.html'), '<meta http-equiv="refresh" content="0;url=/">');
    await writeFile(path.join(root, 'resume.pdf'), 'fixture');
    await writeFile(path.join(root, 'index.html'), '<a href="/Missing/">bad</a><a href="/Resume.pdf">case</a><a href="/resume.pdf">asset</a><a href="/alias/">alias</a><a href="#missing">fragment</a><img src="x"><input type="range" id="day"><script type="application/ld+json">{</script><script>gtag("config", "fixture")</script>');
    const report = await auditSite(root);
    assert.deepEqual(report.errors.filter(error => error.kind === 'broken-link').map(error => error.detail), ['/Missing/', '/Resume.pdf']);
    for (const kind of ['missing-alt', 'unreserved-image', 'unlabeled-range', 'invalid-schema', 'broken-fragment', 'default-tracking']) assert.ok(report.errors.some(error => error.kind === kind));
    assert.equal((await auditSite(root, { tracking: { googleAnalytics: true } })).errors.some(error => error.kind === 'default-tracking'), false);
    await writeFile(path.join(root, 'ranges.html'), '<input type="range" aria-labelledby="missing"><input type="range" aria-label="Day"><input type="range" aria-label="Day">');
    const ranges = (await auditSite(root)).errors.filter(error => error.page === '/ranges.html');
    assert.equal(ranges.filter(error => error.kind === 'unlabeled-range').length, 1);
    assert.equal(ranges.filter(error => error.kind === 'duplicate-range-name').length, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});

const report = score => ({ lighthouseVersion: '13.5.0', browserVersion: 'Chrome/fixture', environment: { hostUserAgent: 'Chrome/fixture' }, requestedUrl: 'https://example.com/', artifact: 'fixed', configSettings: { formFactor: 'mobile', blockedUrlPatterns: [] }, categories: Object.fromEntries(['performance', 'accessibility', 'best-practices', 'seo'].map(name => [name, { score }])), audits: { 'largest-contentful-paint': { numericValue: 2000 }, 'total-blocking-time': { numericValue: 50 } } });
test('Lighthouse aggregation requires three complete matching ordinary runs', () => {
  assert.equal(summarize([report(0.9), report(1), report(0.95)]).scores.performance, 95);
  assert.throws(() => summarize([report(1)]), /three/);
  for (const changed of [{ lighthouseVersion: 'other' }, { browserVersion: 'Chrome/other' }, { artifact: 'changed' }, { environment: { hostUserAgent: 'other' } }, { configSettings: { formFactor: 'desktop' } }]) {
    assert.throws(() => summarize([report(1), report(1), { ...report(1), ...changed }]), /Incompatible/);
  }
  assert.throws(() => summarize(Array.from({ length: 3 }, () => ({ ...report(1), runtimeError: { code: 'FAILED' } }))), /Failed/);
  assert.throws(() => summarize(Array.from({ length: 3 }, () => ({ ...report(1), categories: {} }))), /Incomplete/);
  assert.throws(() => summarize(Array.from({ length: 3 }, () => ({ ...report(1), configSettings: { blockedUrlPatterns: ['*tracker*'] } }))), /diagnostic/);
});

test('HTTP evidence rejects a stale stylesheet even when HTML and catalog identity match', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'artifact-http-'));
  const html = '<link rel="canonical" href="https://example.com/"><link rel="stylesheet" href="/style.css">';
  let css = 'body{color:red}';
  const server = http.createServer((request, response) => response.end(request.url === '/' ? html : css));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  try {
    await writeFile(path.join(root, 'index.html'), html);
    await writeFile(path.join(root, 'style.css'), css);
    assert.deepEqual(await verifyServedArtifact(base, root, ['/']), ['/', '/style.css']);
    css = 'body{color:blue}';
    await assert.rejects(() => verifyServedArtifact(base, root, ['/']), /Served artifact differs: \/style.css/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});
