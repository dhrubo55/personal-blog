import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFile } from 'node:fs/promises';
import { fixture, source } from './helpers/site-fixture.mjs';

test('support CSS is fingerprinted once and downloaded only by the support page', async () => {
  const site = await fixture({
    'layouts/index.html': '{{ partial "extend_head.html" . }}',
    'content/_index.md': '---\ntitle: Home\n---',
    'layouts/_partials/extend_head.html': await source('layouts/_partials/extend_head.html'),
    'assets/css/pages/support.css': '.support-shell { color: red; }'
  });
  try {
    assert.doesNotMatch(await site.build(), /support\.min\.[a-f0-9]+\.css/);
    await writeFile(site.directory + '/content/_index.md', '---\ntitle: Support\nsupportStyles: true\n---');
    const enabled = await site.build();
    assert.equal([...enabled.matchAll(/href="[^"]*support\.min\.[a-f0-9]+\.css"/g)].length, 1);
    assert.match(enabled, /integrity="sha256-/);
  } finally { await site.close(); }
});
