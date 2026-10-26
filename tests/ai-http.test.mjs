import assert from 'node:assert/strict';
import test from 'node:test';

const { createHandler } = await import('../scripts/ai/worker.mjs');
const origin = 'https://example.com';
const routes = [
  { path: '/', markdown: '/index.md', canonical: `${origin}/`, tokens: 7, updated: '2026-10-01T00:00:00Z' },
  { path: '/about/', markdown: '/about.md', canonical: `${origin}/about/`, tokens: 5 },
  { path: '/post.md/', markdown: '/post.md.md', canonical: `${origin}/post.md/`, tokens: 6 },
  { path: '/caf%C3%A9/', markdown: '/caf%C3%A9.md', canonical: `${origin}/caf%C3%A9/`, tokens: 3 },
];
const files = new Map([
  ['/', ['<html>Home</html>', 'text/html']],
  ['/about/', ['<html>About</html>', 'text/html']],
  ['/post.md/', ['<html>Real md route</html>', 'text/html']],
  ['/index.md', ['# Home\n\nA public homepage.\n', 'text/markdown']],
  ['/about.md', ['# About\n\nAbout this site.\n', 'text/markdown']],
  ['/post.md.md', ['# Real md route\n', 'text/markdown']],
  ['/llms.txt', ['# Site\n', 'text/plain']],
  ['/index.json', ['[]', 'application/json']],
  ['/image.svg', ['<svg/>', 'image/svg+xml']],
  ['/admin/', ['<html>Admin</html>', 'text/html']],
  ['/SKILL.md', ['# Existing static document\n', 'text/plain']],
  ['/caf%C3%A9.md', ['# Café\n', 'text/markdown']],
]);
const handler = createHandler(routes, { url: `${origin}/`, staticMarkdownPaths: ['/SKILL.md'], buildId: 'fixture-build' });
const env = {
  ASSETS: {
    async fetch(request) {
      const file = files.get(new URL(request.url).pathname);
      return file
        ? new Response(request.method === 'HEAD' ? null : file[0], { headers: { 'Content-Type': file[1] } })
        : new Response('<html>Not found</html>', { status: 404, headers: { 'Content-Type': 'text/html' } });
    },
  },
};
const request = (path, accept, method = 'GET') => handler(new Request(origin + path, {
  method, headers: accept === undefined ? {} : { Accept: accept },
}), env);

test('ordinary clients and HTML-preferred Accept values retain HTML', async () => {
  for (const accept of [undefined, '*/*', 'text/html', 'text/markdown;q=0.5,text/html;q=0.9',
    'text/markdown;q=0.8,text/html;q=0.8', 'text/markdown;q=0,*/*;q=1',
    'text/markdown;q=bogus,text/html;q=0', 'text/markdown;q=1.1,text/html;q=0',
    'application/json', 'text/*', '*/*;q=0.1', 'text/markdown;q=1=0,text/html;q=0.1',
    'text/markdown;q=1;q=0,text/html;q=0.1', 'text/markdown;charset=iso-8859-1,text/html;q=0.5']) {
    const response = await request('/about/', accept);
    assert.equal(response.status, 200, accept);
    assert.match(response.headers.get('content-type'), /text\/html/, accept);
    assert.match(response.headers.get('vary'), /Accept/i);
    assert.match(response.headers.get('link'), /llms-full\.txt.*describedby/);
  }
});

test('content negotiation honors quality, specificity, case, and parameters', async () => {
  for (const accept of ['text/markdown', 'text/markdown;q=0.9,text/html;q=0.2',
    'text/markdown;q=0.7,text/html;q=0,*/*;q=1', 'TEXT/MARKDOWN; charset=utf-8; Q=1,text/html;q=0.5',
    'text/markdown;q=0.5,text/html;q=1,text/html;charset=utf-8;q=0',
    'text/markdown;q=1;note="quoted, with \\"escape\\"",text/html;q=0.5']) {
    const response = await request('/about/', accept);
    assert.equal(response.status, 200, accept);
    assert.equal(await response.text(), '# About\n\nAbout this site.\n');
    assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8');
    assert.equal(response.headers.get('content-location'), `${origin}/about/`);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow');
    assert.equal(response.headers.get('x-markdown-tokens'), '5');
    assert.match(response.headers.get('vary'), /Accept/);
  }
});

test('suffix and direct API return identical Markdown with canonical headers', async () => {
  for (const path of ['/about.md', '/api/md/about', '/api/md/about/', '/api/md/index', '/index.md']) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type'), /^text\/markdown/);
    assert.match(response.headers.get('link'), /rel="canonical"/);
    assert.equal(response.headers.get('access-control-allow-origin'), '*');
    assert.match(response.headers.get('cache-control'), /s-maxage=3600/);
  }
  assert.equal(await (await request('/api/md/about')).text(), await (await request('/about.md')).text());
});

test('HEAD has GET headers and no body; OPTIONS supports preflight', async () => {
  const get = await request('/index.md');
  const head = await request('/index.md', undefined, 'HEAD');
  assert.equal(await head.text(), '');
  for (const key of ['content-type', 'content-location', 'x-markdown-tokens', 'last-modified', 'link']) {
    assert.equal(head.headers.get(key), get.headers.get(key), key);
  }
  assert.equal(head.headers.get('last-modified'), 'Thu, 01 Oct 2026 00:00:00 GMT');
  const options = await request('/about.md', undefined, 'OPTIONS');
  assert.equal(options.status, 204);
  assert.equal(await options.text(), '');
  assert.equal(options.headers.get('access-control-allow-methods'), 'GET, HEAD, OPTIONS');
});

test('unknown and excluded Markdown requests fail closed, including encoded paths', async () => {
  for (const path of ['/missing.md', '/admin.md', '/api/md/admin', '/api/md/privacy-policy',
    '/api/md/unknown', '/api/md/%2Fadmin', '/api/md/..%2fadmin', '/api/md/bad%ZZ',
    '/admin/index.md', '/api/md/llms.txt', '/api/md/index.json', '/api/md/_catalog/unknown']) {
    const response = await request(path);
    assert.equal(response.status, 404, path);
    assert.match(response.headers.get('content-type'), /^text\/markdown/);
    assert.match(await response.text(), /^# Not found/);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow');
    assert.doesNotMatch(response.headers.get('cache-control'), /s-maxage=3600/);
  }
});

test('assets, discovery files, admin HTML, and genuine md HTML routes bypass negotiation', async () => {
  for (const [path, type] of [['/llms.txt', 'text/plain'], ['/index.json', 'application/json'],
    ['/image.svg', 'image/svg+xml'], ['/admin/', 'text/html'], ['/post.md/', 'text/html'], ['/SKILL.md', 'text/plain']]) {
    const response = await request(path, 'text/markdown');
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('content-type').split(';')[0], type, path);
  }
  assert.equal(await (await request('/post.md.md')).text(), '# Real md route\n');
});

test('catalog contains only registered public routes and rejects writes', async () => {
  const response = await request('/api/md/_catalog');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  const catalog = await response.json();
  assert.equal(catalog.buildId, 'fixture-build');
  assert.deepEqual(catalog.routes.map(route => route.path), ['/', '/about/', '/post.md/', '/caf%C3%A9/']);
  const rejected = await request('/about.md', undefined, 'POST');
  assert.equal(rejected.status, 405);
  assert.equal(rejected.headers.get('allow'), 'GET, HEAD, OPTIONS');
});

test('encoded Unicode slugs resolve consistently through all three Markdown interfaces', async () => {
  for (const [path, accept] of [['/caf%C3%A9.md'], ['/caf%C3%A9/', 'text/markdown'], ['/api/md/caf%C3%A9']]) {
    const response = await request(path, accept);
    assert.equal(response.status, 200, path);
    assert.equal(await response.text(), '# Café\n');
    assert.equal(response.headers.get('content-location'), `${origin}/caf%C3%A9/`);
  }
});

test('missing Markdown assets never become successful HTML responses', async () => {
  const incomplete = createHandler([{ path: '/gone/', markdown: '/gone.md', canonical: `${origin}/gone/` }], { url: `${origin}/` });
  const response = await incomplete(new Request(`${origin}/gone.md`), env);
  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type'), /text\/markdown/);
});
