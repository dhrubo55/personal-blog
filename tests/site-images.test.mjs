import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from 'parse5';
import { fixture, source } from './helpers/site-fixture.mjs';
import { nodes, attributes, auditSite } from '../scripts/audit-site.mjs';

test('rendered image descriptions, escaping, resource resolution and exact dimension keys', async () => {
  const svgURL = 'https://example.net/diagram.svg?version=1#part';
  const site = await fixture({
    'layouts/index.html': '{{ .Content }}{{ range site.RegularPages }}{{ .Content }}{{ end }}',
    'layouts/_markup/render-image.html': await source('layouts/_markup/render-image.html'),
    'data/image_dimensions.json': JSON.stringify({ [svgURL]: { width: 400, height: 200 } }),
    'content/_index.md': `![A &quot;quote&quot; &amp; a &lt;tag&gt;](${svgURL})\n\n![](${svgURL})\n\n![local](/pixel.png)\n\n![resource](asset.png?v=1#part)\n\n![missing](https://example.net/missing.png)\n\n![local SVG](/diagram.svg?v=2#part)\n\n![sized](${svgURL})\n{width=200 loading="eager" class="author-image"}`,
    'content/bundle/index.md': '---\ntitle: Bundle\n---\n![bundle](photo.png?size=1#part)',
    'content/bundle/photo.png': Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWa0AAAAASUVORK5CYII=', 'base64'),
    'static/diagram.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"></svg>',
    // One-pixel PNG with actual intrinsic dimensions.
    'static/pixel.png': Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWa0AAAAASUVORK5CYII=', 'base64'),
    'assets/asset.png': Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWa0AAAAASUVORK5CYII=', 'base64')
  }, { markup: { goldmark: { parser: { attribute: { block: true }, wrapStandAloneImageWithinParagraph: false } } } });
  try {
    const html = await site.build();
    const images = nodes(parse(html), node => node.tagName === 'img').map(attributes);
    assert.equal(images[0].alt, 'A "quote" & a <tag>');
    assert.equal(images[0].src, svgURL);
    assert.equal(images[1].alt, '');
    assert.equal(images[0].width, '400');
    assert.equal(images[0].height, '200');
    assert.equal(images[2].width, '1');
    assert.equal(images[3].src, '/asset.png?v=1#part');
    assert.equal(images[3].height, '1');
    assert.equal(images[5].width, '800');
    assert.equal(images[5].height, '400');
    assert.equal(images[6].width, '200');
    assert.equal(images[6].height, '100');
    assert.equal(images[6].loading, 'eager');
    assert.equal(images[6].class, 'author-image');
    assert.equal(images[7].src, '/bundle/photo.png?size=1#part');
    assert.equal(images[7].width, '1');
    const report = await auditSite(site.directory + '/public');
    assert.deepEqual(report.errors.filter(error => error.kind === 'unreserved-image').map(error => error.detail), ['https://example.net/missing.png']);
  } finally { await site.close(); }
});
