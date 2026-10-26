import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = path.join(root, 'public');
const parser = remark().use(remarkGfm);
const report = { artifactChecks: 0, routes: 0, htmlCompared: 0, literalCodeNodes: 0, httpChecks: [] };
const read = relative => readFile(path.join(output, decodeURIComponent(relative)), 'utf8');
const visit = (node, callback) => { callback(node); (node.childNodes ?? node.children ?? []).forEach(child => visit(child, callback)); };
const attributes = node => Object.fromEntries((node.attrs ?? []).map(attr => [attr.name, attr.value]));
const text = node => node.value ?? (node.childNodes ?? []).map(text).join('');
const nodes = (tree, predicate) => { const result = []; visit(tree, node => { if (predicate(node)) result.push(node); }); return result; };

function comparableHtml(node, literal = false) {
  const attrs = attributes(node);
  if (node.tagName === 'script' && attrs.type === 'application/ld+json') return undefined;
  if (node.tagName === 'meta' && attrs.name === 'ai-summary') return undefined;
  if (node.tagName === 'link' && (attrs.type === 'text/markdown' || attrs.rel === 'describedby' && /\/(?:ai|llms-full)\.txt$/.test(attrs.href))) return undefined;
  if (node.nodeName === '#text') {
    const value = literal ? node.value.replaceAll('\r\n', '\n') : node.value.replace(/\s+/g, ' ').trim();
    return value || undefined;
  }
  if (node.nodeName === '#comment') return undefined;
  return { tag: node.tagName ?? node.nodeName, attrs: Object.entries(attrs).sort(),
    children: (node.childNodes ?? []).map(child => comparableHtml(child, literal || ['pre', 'code', 'script', 'style'].includes(node.tagName))).filter(value => value !== undefined) };
}

const { routes, buildId } = JSON.parse(await read('api/md/_catalog'));
assert.match(buildId ?? '', /^[a-f0-9]{64}$/, 'Build identity is missing. Run npm run build before verification.');
const coverage = JSON.parse(await readFile(path.join(root, '.tools', 'ai-coverage.json'), 'utf8'));
const byPath = new Map(routes.map(route => [route.path, route]));
const markdownUrls = new Set(routes.map(route => new URL(route.markdown, route.canonical).href));
const sitemap = await read('sitemap.xml');
assert.equal(new Set(routes.map(route => route.markdown)).size, routes.length, 'Markdown URLs must be unique');
const forbidden = ['/admin/', '/auth/', '/dashboard/', '/collaborations/', '/privacy-policy/', '/terms-of-service-agreement/'];
assert.ok(routes.every(route => !forbidden.some(prefix => route.path.startsWith(prefix))), 'Private or excluded route entered catalog');

for (const route of routes) {
  const markdown = await read(route.markdown.slice(1));
  assert.equal(route.tokens, Math.ceil(markdown.length / 4), route.path);
  assert.ok(markdown.startsWith('# '), `Missing title: ${route.path}`);
  assert.ok(markdown.includes(route.canonical), `Missing canonical: ${route.path}`);
  assert.ok(!sitemap.includes(`<loc>${new URL(route.markdown, route.canonical)}</loc>`), 'Markdown alternate entered sitemap');
  visit(parser.parse(markdown), node => {
    if (['link', 'image', 'definition'].includes(node.type)) {
      assert.match(node.url, /^[a-z][a-z\d+.-]*:/i, `Relative URL on ${route.path}: ${node.url}`);
      assert.ok(!markdownUrls.has(node.url), `Main-content link targets a Markdown alternate: ${route.path}`);
    }
    if (node.type === 'text') assert.doesNotMatch(node.value, /AILITERALPROTECTX\d+END|AI_SOURCE_LITERAL_\d+_END|\{\{[<%]/, `Unexpanded source on ${route.path}`);
  });
  const htmlPath = path.join(route.path.slice(1), 'index.html');
  const html = await read(htmlPath);
  const tree = parse(html);
  const summary = nodes(tree, node => node.tagName === 'meta' && attributes(node).name === 'ai-summary');
  assert.equal(summary.length, 1, `Summary count on ${route.path}`);
  assert.equal(attributes(summary[0]).content, route.summary);
  const alternate = nodes(tree, node => node.tagName === 'link' && attributes(node).type === 'text/markdown');
  assert.equal(alternate.length, 1, `Alternate count on ${route.path}`);
  assert.equal(attributes(alternate[0]).href, new URL(route.markdown, route.canonical).href);
  if (['home', 'list', 'archives'].includes(route.renderer)) {
    const htmlLinks = nodes(tree, node => node.tagName === 'a' && attributes(node).class === 'entry-link').map(node => new URL(attributes(node).href, route.canonical).href);
    const markdownLinks = nodes(parser.parse(markdown), node => node.type === 'link' && htmlLinks.includes(node.url)).map(node => node.url);
    assert.deepEqual(markdownLinks, htmlLinks, `Listing order or pagination differs: ${route.path}`);
  }
  if (route.renderer === 'knowledge-graph') {
    const fallback = nodes(tree, node => attributes(node).id === 'java-graph-fallback')[0];
    const htmlLinks = nodes(fallback, node => node.tagName === 'a').map(node => new URL(attributes(node).href, route.canonical).href);
    const markdownTree = parser.parse(markdown);
    const relationshipIndex = markdownTree.children.findIndex(node => node.type === 'heading' && node.children?.some(child => child.value === 'Relationships'));
    assert.ok(relationshipIndex >= 0, 'Graph relationships are missing');
    const fallbackTree = { children: markdownTree.children.slice(0, relationshipIndex) };
    const markdownLinks = nodes(fallbackTree, node => node.type === 'link' && htmlLinks.includes(node.url)).map(node => node.url);
    assert.deepEqual(markdownLinks, htmlLinks, 'Graph fallback differs from its HTML source set');
    const graph = JSON.parse(await read(path.join(route.path.slice(1), 'index.json')));
    const publicNodes = new Map(graph.nodes.filter(node => byPath.has(new URL(node.url, route.canonical).pathname)).map(node => [node.id, node]));
    const edges = graph.edges.filter(edge => publicNodes.has(edge.source) && publicNodes.has(edge.target));
    const table = markdownTree.children.find(node => node.type === 'table');
    assert.equal(table.children.length - 1, edges.length, 'Graph relationship count differs from source JSON');
    for (const [index, edge] of edges.entries()) {
      const links = nodes(table.children[index + 1], node => node.type === 'link').map(node => node.url);
      assert.deepEqual(links, [edge.source, edge.target].map(id => new URL(publicNodes.get(id).url, route.canonical).href));
    }
  }
  const baseline = path.join(root, '.tools', 'ai-baseline', decodeURIComponent(htmlPath));
  const previous = await readFile(baseline, 'utf8').catch(error => error.code === 'ENOENT' ? undefined : Promise.reject(error));
  if (previous !== undefined) {
    assert.deepEqual(comparableHtml(tree), comparableHtml(parse(previous)), `HTML changed outside allowed metadata: ${route.path}`);
    report.htmlCompared++;
  }
  report.artifactChecks++;
}

for (const source of coverage.sources ?? []) {
  const route = byPath.get(source.path);
  if (!route || route.renderer !== 'page') continue;
  const raw = (await readFile(path.join(root, 'content', source.source), 'utf8'))
    .replace(/^\uFEFF?(---|\+\+\+)\r?\n[\s\S]*?\r?\n\1(?:\r?\n|$)/, '');
  const code = value => nodes(parser.parse(value), node => node.type === 'code' || node.type === 'inlineCode').map(node => [node.type, node.value]);
  const before = code(raw);
  assert.deepEqual(code(await read(route.markdown.slice(1))), before, `Code examples changed on ${route.path}`);
  report.literalCodeNodes += before.length;
}

const full = await read('llms-full.txt');
assert.ok(full.length <= 500000, 'Aggregate exceeds limit');
const llms = await read('llms.txt');
const ai = await read('ai.txt');
const robots = await read('robots.txt');
assert.ok(!llms.includes('undefined') && !full.includes('undefined') && !ai.includes('undefined'));
assert.equal((await readdir(output)).includes('ai-data.json'), false, 'Intermediate source export must not be deployed');
for (const bot of ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'Bytespider']) {
  assert.ok(robots.includes(`User-agent: ${bot}\nDisallow: /\n`), `Training crawler not blocked: ${bot}`);
}
for (const bot of ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User']) {
  const group = robots.split(`User-agent: ${bot}\n`)[1]?.split('\n\n')[0];
  assert.ok(group?.includes('Disallow: /admin/'), `Search crawler exclusions missing: ${bot}`);
  assert.ok(!group.split('\n').includes('Disallow: /'), `Search crawler blocked: ${bot}`);
}
const support = await read('support.md');
assert.match(support, /BRAC Bank PLC/);
assert.doesNotMatch(support, /chowdhu_mohibul|support-qr-overlay|switchSupportTab/);
const home = parse(await read('index.html'));
const schemas = nodes(home, node => node.tagName === 'script' && attributes(node).type === 'application/ld+json').map(node => JSON.parse(text(node)));
assert.ok(schemas.some(schema => schema['@type'] === 'Person'));
assert.ok(schemas.some(schema => schema['@type'] === 'WebSite'));
for (const route of routes.filter(route => route.section === 'posts' && route.kind === 'page')) {
  const htmlTree = parse(await read(path.join(route.path.slice(1), 'index.html')));
  for (const script of nodes(htmlTree, node => node.tagName === 'script' && attributes(node).type === 'application/ld+json')) JSON.parse(text(script));
}

const base = process.argv[2];
if (base) {
  async function check(relative, { method = 'GET', accept, status = 200, type } = {}) {
    const response = await fetch(new URL(relative, base), { method, redirect: 'manual', headers: accept ? { Accept: accept } : {}, signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, status, `${method} ${relative} (${accept ?? 'default'})`);
    if (type) assert.match(response.headers.get('content-type') ?? '', new RegExp(type), relative);
    report.httpChecks.push({ path: relative, method, accept: accept ?? 'default', status: response.status, type: response.headers.get('content-type') });
    return response;
  }
  const liveCatalog = await (await check('/api/md/_catalog', { type: 'application/json' })).json();
  assert.equal(liveCatalog.buildId, buildId, 'Local Worker does not match the built artifact. Restart wrangler pages dev after rebuilding.');
  report.buildId = buildId;
  for (const [accept, expectedType] of [[undefined, 'text/html'],
    ['text/markdown;q=1=0,text/html;q=0.1', 'text/html'],
    ['text/markdown;q=0.5,text/html;q=1,text/html;charset=utf-8;q=0', 'text/markdown'],
    ['text/markdown;charset=iso-8859-1,text/html;q=0.5', 'text/html']]) {
    const url = new URL('/about/', base);
    const transport = url.protocol === 'https:' ? https : http;
    const result = await new Promise((resolve, reject) => {
      const request = transport.get(url, { headers: accept === undefined ? {} : { Accept: accept }, timeout: 15000 }, response => {
        response.resume();
        response.on('end', () => resolve({ status: response.statusCode, type: response.headers['content-type'] }));
      });
      request.on('timeout', () => request.destroy(new Error('Raw HTTP check timed out')));
      request.on('error', reject);
    });
    assert.equal(result.status, 200);
    assert.ok(result.type.startsWith(expectedType), `Wrong raw HTTP type for ${accept ?? 'absent Accept'}: ${result.type}`);
    report.httpChecks.push({ path: '/about/', method: 'GET', accept: accept ?? 'absent (raw HTTP)', ...result });
  }
  const sample = await check('/about.md', { method: 'HEAD', type: 'text/markdown' });
  for (const header of ['x-markdown-tokens', 'content-location', 'link', 'x-robots-tag', 'access-control-allow-origin']) assert.ok(sample.headers.get(header), `Missing ${header}`);
  assert.equal(await sample.text(), '');
  for (const accept of ['*/*', 'text/html', 'text/markdown;q=0.2,text/html;q=0.8', 'text/markdown;q=0.8,text/html;q=0.8']) await check('/', { accept, type: 'text/html' });
  await check('/about/', { type: 'text/html' });
  await check('/about/', { accept: 'text/markdown;q=1,text/html;q=0.4', type: 'text/markdown' });
  await check('/about.md', { method: 'OPTIONS', status: 204 });
  for (const route of routes) {
    const response = await check(route.markdown, { type: 'text/markdown' });
    assert.equal(await response.text(), await read(route.markdown.slice(1)), `Wrong HTTP content: ${route.markdown}`);
  }
  for (const relative of ['/admin.md', '/api/md/admin', '/api/md/privacy-policy', '/does-not-exist.md', '/api/md/services']) await check(relative, { status: 404, type: 'text/markdown' });
  await check('/api/md/about', { type: 'text/markdown' });
  await check('/api/md/_catalog', { type: 'application/json' });
  await check('/about.md', { method: 'POST', status: 405, type: 'text/markdown' });
  for (const relative of ['/llms.txt', '/llms-full.txt', '/ai.txt', '/robots.txt']) await check(relative, { type: 'text/plain' });
  await check('/posts/posts/java/100daysofjava/day100-capstone.md/', { accept: 'text/markdown', type: 'text/html' });
}
report.routes = routes.length;
report.aggregate = coverage.aggregate;
report.exclusions = coverage.exclusions;
await writeFile(path.join(root, '.tools', 'ai-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Verified ${routes.length} Markdown documents, ${report.htmlCompared} unchanged HTML pages, ${report.httpChecks.length} HTTP requests, schema JSON, crawler policy, and aggregate size.`);
