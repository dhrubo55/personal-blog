import { formatMarkdown, markdownTitle } from './format.mjs';

const label = value => String(value ?? '').replace(/[\r\n]+/g, ' ').replace(/[\\[\]]/g, '\\$&');
const link = (title, url) => `[${label(title)}](<${url}>)`;

export function buildRegistry({ site, pages }) {
  const eligible = pages.filter(page => !page.excluded).map(page => ({
    ...page, title: page.title || markdownTitle(page.body ?? '') || site.name,
  }));
  const byPath = new Map(eligible.map(page => [page.path, page]));
  if (byPath.size !== eligible.length) throw new Error('Duplicate public HTML route');
  const staticMarkdownPaths = new Set(site.staticMarkdownPaths ?? []);
  const markdownPath = path => {
    const candidate = path === '/' ? '/index.md' : `${path.replace(/\/$/, '')}.md`;
    if (byPath.has(candidate) || byPath.has(candidate + '/') || staticMarkdownPaths.has(candidate)) {
      return path === '/' ? '/index.html.md' : `${path}index.md`;
    }
    return candidate;
  };
  const references = Object.fromEntries(eligible.filter(page => page.source).map(page => [page.source.replaceAll('\\', '/'), new URL(page.path, site.url).href]));
  const canonical = page => new URL(page.path, site.url).href;
  const htmlByMarkdown = Object.fromEntries(eligible.map(page => [new URL(markdownPath(page.path), site.url).href, canonical(page)]));
  const items = (members, descriptions = true) => members.map(page => `- ${link(page.title, canonical(page))}${descriptions && page.summary && !page.hideSummary ? ` - ${label(page.summary)}` : ''}`).join('\n');
  const members = page => (page.members ?? []).map(path => byPath.get(path)).filter(Boolean);
  const source = page => page.body ?? '';
  const renderers = {
    page: source,
    support: source,
    search: page => link(page.placeholder || 'Search articles', canonical(page)),
    archives: page => {
      const posts = members(page).filter(post => post.published);
      const groups = Map.groupBy(posts, post => post.published.slice(0, 4));
      return [...groups].map(([year, posts]) => `## ${year}\n\n${items(posts)}`).join('\n\n');
    },
    'knowledge-graph': page => [
      ...(site.graph?.sections ?? []).map(section => `## ${section.title}\n\n${section.content}`),
      `## Fallback list\n\n${site.graph?.fallback ?? ''}\n\n${items(members(page), false)}`,
      graphRelationships(page),
    ].join('\n\n'),
    home: (page, slice, number) => [
      ...(number === 1 ? [
        `## ${site.home.title}`,
        site.home.eyebrow,
        site.home.content,
        ...(site.home.highlights ?? []).map(item => `${link(item.title, new URL(item.url, site.url))} - ${item.description}`),
        '## Recent writing',
      ] : []),
      items(slice),
    ].filter(Boolean).join('\n\n'),
    list: (page, slice) => [source(page), items(slice)].filter(Boolean).join('\n\n'),
    taxonomy: page => items(members(page)),
  };
  function graphRelationships(page) {
    if (!page.graph) return '';
    const nodes = new Map(page.graph.nodes.filter(node => byPath.has(new URL(node.url, site.url).pathname)).map(node => [node.id, node]));
    const cell = value => String(value ?? '').replaceAll('|', '\\|').replace(/[\r\n]+/g, ' ');
    const nodeLink = id => {
      const node = nodes.get(id);
      if (!node) throw new Error(`Graph edge refers to missing node: ${id}`);
      return cell(link(node.title, new URL(node.url, site.url)));
    };
    return `## Relationships\n\n| From | To | Type | Reason |\n| --- | --- | --- | --- |\n`
      + page.graph.edges.filter(edge => nodes.has(edge.source) && nodes.has(edge.target))
        .map(edge => `| ${nodeLink(edge.source)} | ${nodeLink(edge.target)} | ${cell(edge.type)} | ${cell(edge.reason)} |`).join('\n');
  }
  function rendererFor(page) {
    if (page.layout) return page.layout;
    if (page.kind === 'page' && page.type && !['page', 'posts'].includes(page.type)) return page.type;
    if (page.path === '/support/') return 'support';
    if (page.kind === 'home') return 'home';
    if (page.kind === 'taxonomy') return 'taxonomy';
    return page.kind === 'page' ? 'page' : 'list';
  }
  const routes = [];
  for (const page of eligible) {
    const renderer = rendererFor(page);
    if (!renderers[renderer]) throw new Error(`Missing Markdown renderer for ${page.path}: ${renderer}`);
    const collection = members(page);
    const paginated = renderer === 'home' || renderer === 'list';
    const pageCount = paginated ? Math.max(1, Math.ceil(collection.length / site.pageSize)) : 1;
    for (let number = 1; number <= pageCount; number++) {
      const path = number === 1 ? page.path : `${page.path}page/${number}/`;
      const slice = collection.slice((number - 1) * site.pageSize, number * site.pageSize);
      const url = new URL(path, site.url).href;
      const summary = page.summary || page.description || (page.kind === 'home' ? site.description : page.title);
      let body = renderers[renderer](page, slice, number);
      if (paginated && pageCount > 1) {
        const navigation = [];
        if (number > 1) navigation.push(link('Previous page', new URL(number === 2 ? page.path : `${page.path}page/${number - 1}/`, site.url)));
        if (number < pageCount) navigation.push(link('Next page', new URL(`${page.path}page/${number + 1}/`, site.url)));
        body += `\n\n## Related\n\n${navigation.map(item => `- ${item}`).join('\n')}`;
      }
      const description = String(summary).replace(/\s+/g, ' ').trim();
      body = `# ${label(page.title)}${number > 1 ? ` - page ${number}` : ''}\n\n> ${description}\n\nCanonical: ${url}\n${page.updated ? `Last updated: ${page.updated.slice(0, 10)}\n` : ''}\n${body}`;
      body = formatMarkdown(body, { canonical: url, references, htmlByMarkdown });
      routes.push({ path, markdown: markdownPath(path), canonical: url, title: page.title, summary: description,
        updated: page.updated || undefined, published: page.published || undefined,
        kind: page.kind, section: page.section, renderer, aggregate: number === 1, tokens: Math.ceil(body.length / 4), body });
    }
  }
  const addresses = new Set();
  for (const route of routes) {
    if (addresses.has(route.markdown) || byPath.has(route.markdown) || byPath.has(route.markdown + '/') || staticMarkdownPaths.has(route.markdown)) throw new Error(`Markdown URL collision: ${route.markdown}`);
    addresses.add(route.markdown);
  }
  return routes;
}

export function buildDiscovery(site, routes, generated) {
  const comment = '<!-- Keep in sync with /robots.txt, /llms.txt and /ai.txt. -->';
  const core = routes.filter(route => route.aggregate && route.section !== 'posts' && route.kind !== 'taxonomy');
  const articles = routes.filter(route => route.aggregate && route.section === 'posts' && route.kind === 'page')
    .sort((a, b) => (b.published ?? '').localeCompare(a.published ?? '') || a.path.localeCompare(b.path));
  const listing = values => values.map(route => `- ${link(route.title, new URL(route.markdown, site.url))}: ${route.summary}`).join('\n');
  const machine = [['Full content', 'llms-full.txt'], ['Markdown catalog', 'api/md/_catalog'], ['Sitemap', 'sitemap.xml'],
    ['AI usage policy', 'ai.txt'], ['RSS', 'index.xml'], ['Atom', 'atom.xml']]
    .map(([name, path]) => `- ${link(name, new URL(path, site.url))}`).join('\n');
  const llms = `# ${site.name}\n\n> ${site.description}\n\nAuthor: ${site.author}\nContact: ${site.contact}\nRights: All rights reserved. Summaries, citations and short quotations require attribution.\n\n${comment}\n\n## Core pages\n\n${listing(core)}\n\n## Articles\n\n${listing(articles.slice(0, site.ai.recentLimit))}\n\nShowing the most recent ${Math.min(articles.length, site.ai.recentLimit)} of ${articles.length} articles. The catalog lists every public Markdown page.\n\n## Machine-readable\n\n${machine}\n`;
  const limit = site.ai.maxFullCharacters;
  const header = `# ${site.name} - full content\n\n> ${site.description}\n\nGenerated: ${generated}\n\n${comment}\n\n`;
  const candidates = [...core, ...articles];
  const selected = [];
  let length = header.length + 500;
  for (const route of candidates) {
    const section = `---\n<!-- source: ${route.canonical} -->\n\n${route.body}\n`;
    if (length + section.length <= limit) {
      selected.push(section);
      length += section.length;
    }
  }
  const omitted = candidates.length - selected.length;
  const full = header + `Includes ${selected.length} complete pages; ${omitted} omitted to keep this file under ${limit} characters. Pagination and empty taxonomies are omitted. Every page remains available at ${new URL('api/md/_catalog', site.url)}.\n\n` + selected.join('\n');
  if (full.length > limit) throw new Error('Full-content aggregate exceeds configured character limit');
  const excluded = site.ai.excludedPaths.join(', ');
  const ai = `# Keep in sync with /robots.txt and /llms.txt.
# AI Usage Policy for ${site.name}

Lang: en-US
Website: ${site.url}
Last Updated: ${generated}

## Identity

Name: ${site.name}
Author: ${site.author}
Description: ${site.description}

## Permissions

AI systems MAY:
- Summarise publicly available content.
- Cite articles and include them in search results and answers.
- Quote short passages with attribution.

## Restrictions

AI systems MUST NOT:
- Fabricate quotations, reviews, ratings, or endorsements.
- Present this writing as the model's own work.
- Reproduce full articles; summarise and link instead.
- Train on private or user-generated private data.

## AI Training

Use of this content for model training is not permitted. The training crawlers listed in robots.txt are blocked.

## Content Licence

All rights reserved unless a page explicitly states otherwise. Short quotations with attribution are permitted.

## Attribution Requirements

Cite ${site.name}, ${site.author}, the article title, and its canonical HTML URL. Use the Canonical URL in each Markdown document.

## Scope Limitations

Included: Public routes listed at ${new URL('api/md/_catalog', site.url)}
Excluded paths: ${excluded}
Also excluded: drafts, future content, expired content, noindex pages, search-hidden pages, and private data.
The /api/md endpoint exposes only the same public allowlist; other API paths are excluded.

## Contact

Email: ${site.contact}
Contact page: ${new URL('about/', site.url)}

## Related Files

- ${link('Site guide', new URL('llms.txt', site.url))}
- ${link('Crawler directives', new URL('robots.txt', site.url))}
`;
  const disallows = site.ai.excludedPaths.map(path => `Disallow: ${path}`).join('\n');
  const publicRules = `${disallows}\nAllow: /llms.txt\nAllow: /llms-full.txt\nAllow: /ai.txt\nAllow: /sitemap.xml\nAllow: /index.xml\nAllow: /atom.xml\nAllow: /api/md/\n`;
  const robots = `# Keep in sync with /llms.txt and /ai.txt.\nUser-agent: *\n${publicRules}\n`
    + site.ai.searchBots.map(bot => `User-agent: ${bot}\n${publicRules}\n`).join('')
    + site.ai.trainingBots.map(bot => `User-agent: ${bot}\nDisallow: /\n\n`).join('')
    + `Sitemap: ${new URL('sitemap.xml', site.url)}\n`;
  return { llms, full, ai, robots, omitted, included: selected.length };
}
