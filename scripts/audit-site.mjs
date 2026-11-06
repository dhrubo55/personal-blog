import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';

export const attributes = node => Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));
const textContent = node => node.value ?? (node.childNodes ?? []).map(textContent).join('');
export function nodes(tree, predicate) {
  const found = [];
  function visit(node) {
    if (predicate(node)) found.push(node);
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(tree);
  return found;
}
export async function inventory(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await inventory(path.join(directory, entry.name), relative + '/'));
    else files.push(relative);
  }
  return files.sort();
}
export async function auditSite(directory, { tracking = {} } = {}) {
  const integrations = Object.fromEntries(Object.entries(tracking ?? {}).map(([name, enabled]) => [name.toLowerCase(), enabled]));
  const files = await inventory(directory);
  const artifacts = new Set(files.map(file => '/' + file));
  const errors = [];
  const images = [];
  const routes = [];
  const trees = new Map();
  const treeFor = async file => {
    if (!trees.has(file)) trees.set(file, parse(await readFile(path.join(directory, file), 'utf8')));
    return trees.get(file);
  };
  const add = (kind, page, detail) => errors.push({ kind, page, detail });
  for (const file of files.filter(file => file.endsWith('.html'))) {
    const page = '/' + file.replace(/index\.html$/, '');
    const tree = await treeFor(file);
    const canonical = nodes(tree, node => node.tagName === 'link' && attributes(node).rel === 'canonical')[0];
    const base = attributes(canonical ?? {}).href || 'https://mohibul.pages.dev' + page;
    routes.push({ path: page, canonical: attributes(canonical ?? {}).href ?? null });
    for (const img of nodes(tree, node => node.tagName === 'img')) {
      const attrs = attributes(img);
      images.push({ page, ...attrs });
      if (!Object.hasOwn(attrs, 'alt')) add('missing-alt', page, attrs.src);
      if (!(Number(attrs.width) > 0 && Number(attrs.height) > 0)) add('unreserved-image', page, attrs.src);
    }
    for (const script of nodes(tree, node => node.tagName === 'script' && attributes(node).type === 'application/ld+json')) {
      try {
        const schema = JSON.parse(script.childNodes.map(node => node.value ?? '').join(''));
        if (!schema['@context'] || !(schema['@type'] || schema['@graph'])) throw new Error('Missing schema identity');
      } catch (error) { add('invalid-schema', page, error.message); }
    }
    const rangeNames = new Set();
    for (const input of nodes(tree, node => node.tagName === 'input' && attributes(node).type === 'range')) {
      const attrs = attributes(input);
      const labels = nodes(tree, node => node.tagName === 'label' && attributes(node).for === attrs.id);
      const references = (attrs['aria-labelledby'] ?? '').split(/\s+/).filter(Boolean)
        .flatMap(id => nodes(tree, node => attributes(node).id === id));
      let parent = input.parentNode;
      while (parent && parent.tagName !== 'label') parent = parent.parentNode;
      const name = (references.map(textContent).join(' ') || attrs['aria-label'] || labels.map(textContent).join(' ') || (parent && textContent(parent)) || '').trim();
      if (!name) add('unlabeled-range', page, attrs.id);
      else if (rangeNames.has(name)) add('duplicate-range-name', page, name);
      else rangeNames.add(name);
    }
    for (const a of nodes(tree, node => node.tagName === 'a' && attributes(node).href)) {
      const href = attributes(a).href;
      let url;
      try { url = new URL(href, base); } catch { add('invalid-link', page, href); continue; }
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== new URL(base).origin) continue;
      let pathname;
      try { pathname = decodeURIComponent(url.pathname); } catch { add('invalid-link', page, href); continue; }
      const target = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
      // Compare POSIX URL identities, even on a case-insensitive Windows filesystem.
      const destination = artifacts.has(target) ? target : artifacts.has(pathname + '/index.html') ? pathname + '/index.html' : null;
      if (!destination) add('broken-link', page, href);
      else if (url.hash && destination.endsWith('.html')) {
        let fragment;
        try { fragment = decodeURIComponent(url.hash.slice(1)); }
        catch { add('invalid-link', page, href); continue; }
        const destinationTree = await treeFor(destination.slice(1));
        const alias = nodes(destinationTree, node => node.tagName === 'meta' && attributes(node)['http-equiv']?.toLowerCase() === 'refresh').length;
        if (!alias && !nodes(destinationTree, node => attributes(node).id === fragment || node.tagName === 'a' && attributes(node).name === fragment).length) add('broken-fragment', page, href);
      }
    }
    for (const script of nodes(tree, node => node.tagName === 'script')) {
      const source = attributes(script).src ?? '';
      const body = script.childNodes.map(node => node.value ?? '').join('');
      for (const [integration, pattern] of [
        ['googleAnalytics', /googletagmanager\.com\/gtag|gtag\(\s*['"]config['"]/],
        ['adsense', /googlesyndication\.com\/pagead/],
        ['twitter', /ads-twitter\.com\/uwt|twq\(\s*['"]init['"]/]
      ]) {
        if (integrations[integration.toLowerCase()] !== true && pattern.test(source + body)) add('default-tracking', page, source || body.slice(0, 100));
      }
    }
  }
  return { pages: routes.length, imageCount: images.length, routes, images, errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = path.resolve(process.argv[2] || 'public');
  const report = await auditSite(directory);
  const destination = path.resolve(process.argv[3] || '.tools/site-quality/site-audit.json');
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(report, null, 2) + '\n');
  console.log(`Audited ${report.pages} HTML pages and ${report.imageCount} images: ${report.errors.length} defects. Report: ${destination}`);
  if (report.errors.length) {
    console.log(JSON.stringify(Object.fromEntries(Object.entries(Object.groupBy(report.errors, error => error.kind)).map(([kind, errors]) => [kind, { count: errors.length, examples: errors.slice(0, 5) }])), null, 2));
    process.exitCode = 1;
  }
}
