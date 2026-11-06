import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from 'parse5';
import { fixture, source } from './helpers/site-fixture.mjs';
import { nodes, attributes } from '../scripts/audit-site.mjs';

const schemas = html => nodes(parse(html), node => node.tagName === 'script' && attributes(node).type === 'application/ld+json').map(node => JSON.parse(node.childNodes.map(child => child.value).join('')));
test('author entity is stable and only explicit representative article images enter schema', async () => {
  const site = await fixture({
    'layouts/index.html': '{{ partial "templates/schema_json.html" . }}{{ range site.RegularPages }}{{ partial "templates/schema_json.html" . }}{{ end }}',
    'layouts/_partials/templates/schema_json.html': await source('layouts/_partials/templates/schema_json.html'),
    'content/about.md': '---\ntitle: About\ndate: 2020-01-01\n---\nAuthor',
    'content/posts/plain.md': '---\ntitle: Plain\ndate: 2020-01-01\n---\nText',
    'content/posts/picture.md': '---\ntitle: Picture\ndate: 2020-01-01\nlastmod: 2026-10-28\ncover:\n  image: /diagram.svg\n---\nText'
  }, { params: { author: 'Test Author' }, frontmatter: { lastmod: ['lastmod', 'date', 'publishDate'] } });
  try {
    const first = schemas(await site.build());
    const person = first.find(schema => schema['@type'] === 'Person');
    assert.equal(person['@id'], 'https://example.com/#author');
    assert.equal(person.url, 'https://example.com/about/');
    assert.equal(Object.hasOwn(person, 'image'), false);
    const articles = first.filter(schema => schema['@type'] === 'BlogPosting');
    for (const article of articles) {
      assert.equal(article.author['@id'], person['@id']);
      assert.equal(article.dateModified, article.name === 'Picture' ? '2026-10-28T00:00:00Z' : '2020-01-01T00:00:00Z');
    }
    assert.equal(articles.find(article => article.name === 'Picture').image, 'https://example.com/diagram.svg');
    assert.equal(Object.hasOwn(articles.find(article => article.name === 'Plain'), 'image'), false);
    assert.deepEqual(schemas(await site.build()), first);
  } finally { await site.close(); }
});
