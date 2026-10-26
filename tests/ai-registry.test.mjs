import assert from 'node:assert/strict';
import test from 'node:test';

const { buildRegistry, buildDiscovery } = await import('../scripts/ai/registry.mjs');
const site = { name: 'Example', author: 'A Writer', url: 'https://example.com/', description: 'Articles about code.',
  contact: 'writer@example.com', pageSize: 2, home: { title: 'I build software.', content: 'I write about it.' },
  ai: { searchBots: ['OAI-SearchBot'], trainingBots: ['GPTBot'], excludedPaths: ['/admin/'], maxFullCharacters: 1500, recentLimit: 50 } };
const pages = [
  { path: '/', kind: 'home', title: 'Example', members: ['/posts/c/', '/posts/b/', '/posts/a/'] },
  { path: '/posts/', kind: 'section', title: 'Posts', members: ['/posts/c/', '/posts/b/', '/posts/a/'] },
  { path: '/posts/c/', kind: 'page', section: 'posts', title: 'C', body: 'C content.', published: '2026-10-03' },
  { path: '/posts/b/', kind: 'page', section: 'posts', title: 'B', body: 'B content.', published: '2026-10-02' },
  { path: '/posts/a/', kind: 'page', section: 'posts', title: 'A', body: 'A content.', published: '2026-10-01' },
  { path: '/private/', kind: 'page', title: 'Private', body: 'PRIVATE', excluded: 'noindex' },
  { path: '/draft/', kind: 'page', title: 'Draft', body: 'DRAFT', excluded: 'draft' },
];

test('registry gives every eligible page and pagination a renderer, with matching list slices', () => {
  const routes = buildRegistry({ site, pages });
  assert.equal(routes.length, 7);
  const second = routes.find(route => route.path === '/page/2/');
  assert.match(second.body, /\[A\]\(https:\/\/example.com\/posts\/a\/\)/);
  assert.doesNotMatch(second.body, /\[B\]|\[C\]/);
  assert.equal(second.markdown, '/page/2.md');
  assert.equal(routes.find(route => route.path === '/').markdown, '/index.md');
  assert.ok(routes.every(route => !/PRIVATE|DRAFT/.test(route.body)));
});

test('the homepage does not invent actions absent from its configured content', () => {
  const routes = buildRegistry({ site, pages });
  const home = routes.find(route => route.path === '/');
  assert.match(home.body, /I write about it\./);
  assert.doesNotMatch(home.body, /Explore my work|View résumé/);
});

test('real md HTML routes have distinct alternates and unknown custom layouts fail coverage', () => {
  const routes = buildRegistry({ site, pages: [{ path: '/post.md/', kind: 'page', title: 'Post', body: 'Text' }] });
  assert.equal(routes[0].markdown, '/post.md.md');
  assert.throws(() => buildRegistry({ site, pages: [{ path: '/custom/', kind: 'page', layout: 'unregistered', body: '' }] }), /renderer/i);
  assert.throws(() => buildRegistry({ site, pages: [{ path: '/custom/', kind: 'page', type: 'unregistered', body: '' }] }), /renderer/i);
});

test('source references resolve identically on Windows and Linux', () => {
  const routes = buildRegistry({ site, pages: [
    { path: '/one/', kind: 'page', source: 'posts\\one.md', title: 'One', body: '[Two]({{< relref "posts/two.md" >}})' },
    { path: '/two/', kind: 'page', source: 'posts\\two.md', title: 'Two', body: 'Second page.' },
  ] });
  assert.match(routes[0].body, /\[Two\]\(https:\/\/example.com\/two\/\)/);
});

test('a real md HTML route cannot shadow another page alternate', () => {
  const routes = buildRegistry({ site, pages: [
    { path: '/about/', kind: 'page', title: 'About', body: 'About.' },
    { path: '/about.md/', kind: 'page', title: 'Existing route', body: 'Existing.' },
  ] });
  assert.equal(routes[0].markdown, '/about/index.md');
  assert.equal(routes[1].markdown, '/about.md.md');
  const staticCollision = buildRegistry({ site: { ...site, staticMarkdownPaths: ['/about.md'] }, pages: [pages[0],
    { path: '/about/', kind: 'page', title: 'About', body: 'About.' },
  ] });
  assert.equal(staticCollision.find(route => route.path === '/about/').markdown, '/about/index.md');
});

test('discovery summaries retain plain text rather than Markdown escape characters', () => {
  const routes = buildRegistry({ site, pages: [
    { path: '/example/', kind: 'page', title: 'Example', summary: 'Uses [A] and [B].', body: 'Text.' },
  ] });
  assert.equal(routes[0].summary, 'Uses [A] and [B].');
});

test('the atlas renderer reuses graph nodes and relationship facts', () => {
  const routes = buildRegistry({ site, pages: [{ path: '/atlas/', kind: 'page', type: 'knowledge-graph', title: 'Atlas',
    graph: { nodes: [{ id: 'a', title: 'First', url: '/first/' }, { id: 'b', title: 'Second', url: '/second/' }],
      edges: [{ source: 'a', target: 'b', type: 'sequence', reason: 'Consecutive posts.' }] }, members: [],
  }, { path: '/first/', kind: 'page', title: 'First', body: 'First.' },
  { path: '/second/', kind: 'page', title: 'Second', body: 'Second.' }] });
  assert.match(routes[0].body, /## Relationships/);
  assert.match(routes[0].body, /Consecutive posts\./);
  assert.match(routes[0].body, /https:\/\/example.com\/first\//);
});

test('graph relationships cannot reintroduce noindex pages through the graph data', () => {
  const routes = buildRegistry({ site, pages: [
    { path: '/atlas/', kind: 'page', type: 'knowledge-graph', title: 'Atlas',
      graph: { nodes: [{ id: 'a', title: 'Public', url: '/public/' }, { id: 'b', title: 'PRIVATE-TITLE', url: '/private/' }],
        edges: [{ source: 'a', target: 'b', type: 'reference', reason: 'PRIVATE-REASON' }] }, members: [], },
    { path: '/public/', kind: 'page', title: 'Public', body: 'Public.' },
    { path: '/private/', kind: 'page', title: 'Private', body: 'PRIVATE-BODY', excluded: 'noindex' },
  ] });
  assert.doesNotMatch(routes[0].body, /PRIVATE/);
});

test('discovery uses Markdown links, excludes private pages, and enforces whole-page aggregate limits', () => {
  const routes = buildRegistry({ site, pages: pages.map(page => page.path === '/posts/c/' ? { ...page, body: 'Large article. '.repeat(300) } : page) });
  const discovery = buildDiscovery(site, routes, '2026-10-26');
  assert.match(discovery.llms, /https:\/\/example.com\/posts\/c\.md/);
  assert.doesNotMatch(discovery.llms + discovery.full, /PRIVATE|DRAFT/);
  assert.ok(discovery.full.length <= 1500);
  assert.doesNotMatch(discovery.full, /Large article/);
  assert.match(discovery.full, /limit|omitted/i);
  assert.match(discovery.ai, /Website: https:\/\/example.com\//);
  assert.match(discovery.ai, /## Permissions\n\nAI systems MAY:\n- /);
  assert.match(discovery.ai, /## Restrictions\n\nAI systems MUST NOT:\n- /);
  assert.match(discovery.ai, /Last Updated: 2026-10-26/);
  assert.match(discovery.ai, /writer@example\.com/);
  assert.match(discovery.ai, /All rights reserved/);
  assert.match(discovery.robots, /User-agent: GPTBot\nDisallow: \//);
  assert.match(discovery.robots, /User-agent: OAI-SearchBot/);
});
