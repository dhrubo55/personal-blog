import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const { formatMarkdown } = await import('../scripts/ai/format.mjs');
const options = {
  canonical: 'https://example.com/posts/example/',
  references: { 'posts/next.md': 'https://example.com/posts/next/' },
};

test('links, images, definitions, and fragments become absolute without altering code', () => {
  const source = '[About](/about/) ![Photo](../photo.png) [Section](#part) [Ref][r]\n\n[r]: /resume/\n\n```java\nString sample = "[Keep](/relative/)";\n```\n';
  const markdown = formatMarkdown(source, options);
  assert.match(markdown, /\[About\]\(https:\/\/example.com\/about\/\)/);
  assert.match(markdown, /https:\/\/example.com\/posts\/photo.png/);
  assert.match(markdown, /https:\/\/example.com\/posts\/example\/#part/);
  assert.match(markdown, /\[r\]: https:\/\/example.com\/resume\//);
  assert.ok(markdown.includes('String sample = "[Keep](/relative/)";'));
});

test('GFM tables and nested lists remain Markdown', () => {
  const markdown = formatMarkdown('| Name | Link |\n| --- | --- |\n| Java | [Read](/java/) |\n\n- One\n  - Nested\n', options);
  assert.match(markdown, /\| Name/);
  assert.match(markdown, /https:\/\/example.com\/java\//);
  assert.match(markdown, /- One\n  - Nested/);
});

test('Hugo shortcodes resolve from the same page references and preserve embedded source links', () => {
  const source = '[Next]({{< relref "posts/next.md" >}})\n\n{{<replit src="https://replit.com/example">}}\n';
  const markdown = formatMarkdown(source, options);
  assert.match(markdown, /\[Next\]\(https:\/\/example.com\/posts\/next\/\)/);
  assert.match(markdown, /https:\/\/replit.com\/example/);
  assert.doesNotMatch(markdown, /\{\{[<%]/);
});

test('raw source HTML retains visible text and links but excludes hidden panels and scripts', () => {
  const source = '{{< rawhtml >}}\n<section><h2>Support</h2><p>Visible <strong>text</strong>.</p><a href="/about/">About</a><div hidden>SECRET-A</div><section style="display: none">SECRET-B</section><script>SECRET-C</script><button data-copy="SECRET-D">Copy</button><div class="support-qr-overlay">SECRET-E</div></section>\n{{< /rawhtml >}}';
  const markdown = formatMarkdown(source, options);
  assert.match(markdown, /## Support/);
  assert.match(markdown, /Visible \*\*text\*\*/);
  assert.match(markdown, /\[About\]\(https:\/\/example.com\/about\/\)/);
  assert.doesNotMatch(markdown, /SECRET|<script|data-copy|rawhtml/);
});

test('embedded HTML inside a fenced example remains literal code', () => {
  const source = '```html\n<script>alert("demo")</script>\n<a href="/relative">Example</a>\n```\n';
  const markdown = formatMarkdown(source, options);
  assert.ok(markdown.includes('<script>alert("demo")</script>'));
  assert.ok(markdown.includes('<a href="/relative">Example</a>'));
});

test('the real support source retains the visible bank section without leaking placeholders or hidden panels', async () => {
  const source = (await readFile(new URL('../content/support.md', import.meta.url), 'utf8')).replace(/^---[\s\S]*?---/, '');
  const markdown = formatMarkdown(source, options);
  assert.match(markdown, /BRAC Bank PLC/);
  assert.match(markdown, /SATMASJID ROAD BRANCH/);
  assert.match(markdown, /LinkedIn/);
  assert.doesNotMatch(markdown, /AI_SOURCE_LITERAL|AILITERAL|chowdhu_mohibul|support-qr-overlay/);
});

test('shortcode examples in inline code and longer code fences stay literal', () => {
  const source = 'Use `{{< unknown >}}` literally.\n\n````md\n{{< unknown >}}\n```\nnested example\n```\n`````\n';
  const markdown = formatMarkdown(source, options);
  assert.ok(markdown.includes('`{{< unknown >}}`'));
  assert.ok(markdown.includes('{{< unknown >}}\n```\nnested example'));
});

test('unknown shortcodes and broken relrefs stop generation instead of publishing template syntax', () => {
  assert.throws(() => formatMarkdown('{{< secret >}}', options), /Unsupported shortcode/);
  assert.throws(() => formatMarkdown('[Bad]({{< relref "private.md" >}})', options), /Unresolved relref/);
});
