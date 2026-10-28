import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRegistry, buildDiscovery } from './registry.mjs';
import { addGeometry } from '../graph-layout.mjs';
import { auditSite } from '../audit-site.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const staging = path.join(root, '.tools', 'ai-staging');
const output = path.join(root, 'public');

async function clearGenerated(directory) {
  const resolvedRoot = await realpath(root);
  const parent = await realpath(path.dirname(directory));
  const resolved = path.join(parent, path.basename(directory));
  if (![path.join(resolvedRoot, 'public'), path.join(resolvedRoot, '.tools', 'ai-staging')].includes(resolved)) {
    throw new Error(`Refusing to clear unexpected build directory: ${resolved}`);
  }
  // Never follow a replaced output directory into another part of the filesystem.
  const actual = await realpath(directory).catch(error => error.code === 'ENOENT' ? resolved : Promise.reject(error));
  if (actual !== resolved) throw new Error(`Build directory is a link: ${directory}`);
  await rm(directory, { recursive: true, force: true });
}

async function findHugo() {
  if (process.env.HUGO_BIN) return process.env.HUGO_BIN;
  if (spawnSync('hugo', ['version'], { stdio: 'ignore' }).status === 0) return 'hugo';
  const bundled = path.join(root, '.tools', 'hugo-0.146.7', process.platform === 'win32' ? 'hugo.exe' : 'hugo');
  if (spawnSync(bundled, ['version'], { stdio: 'ignore' }).status === 0) return bundled;
  throw new Error('Install Hugo Extended >= 0.146.0 or set HUGO_BIN to its executable.');
}

function hugo(executable, args, capture = false) {
  const result = spawnSync(executable, args, { cwd: root, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Hugo failed with status ${result.status}: ${result.stderr ?? ''}`);
  return result.stdout;
}

async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(file));
    else files.push(file);
  }
  return files;
}

const escapeAttribute = text => String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

async function build() {
  await mkdir(path.join(root, '.tools'), { recursive: true });
  await clearGenerated(staging);
  const executable = await findHugo();
  const config = JSON.parse(hugo(executable, ['config', '--format', 'json'], true));
  hugo(executable, ['--minify', '--enableGitInfo', '--destination', staging, '--cacheDir', path.join(root, '.tools', 'hugo-cache')]);
  const data = JSON.parse(await readFile(path.join(staging, 'ai-data.json'), 'utf8'));
  data.site.pageSize = config.pagination.pagersize;
  const staticMarkdownPaths = (await filesIn(staging)).filter(file => file.endsWith('.md'))
    .map(file => '/' + path.relative(staging, file).replaceAll('\\', '/'));
  data.site.staticMarkdownPaths = staticMarkdownPaths;
  for (const page of data.pages.filter(page => !page.excluded && page.type === 'knowledge-graph')) {
    const graphFile = path.join(staging, decodeURIComponent(page.path), 'index.json');
    page.graph = addGeometry(JSON.parse(await readFile(graphFile, 'utf8')));
    await writeFile(graphFile, JSON.stringify(page.graph) + '\n');
  }
  const routes = buildRegistry(data);
  const metadata = routes.map(({ body, ...route }) => route);
  const discovery = buildDiscovery(data.site, routes, new Date().toISOString().slice(0, 10));
  const write = async (relative, content) => {
    const target = path.resolve(staging, decodeURIComponent(relative));
    if (!target.startsWith(staging + path.sep)) throw new Error(`Output path escapes staging: ${relative}`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  };
  for (const route of routes) {
    await write(route.markdown.slice(1), route.body);
    const htmlFile = path.join(staging, decodeURIComponent(route.path), 'index.html');
    const html = await readFile(htmlFile, 'utf8');
    const signals = `<meta name="ai-summary" content="${escapeAttribute(route.summary)}"><link rel="alternate" type="text/markdown" href="${escapeAttribute(new URL(route.markdown, data.site.url).href)}">`;
    if (!html.includes('</head>')) throw new Error(`HTML head is missing: ${route.path}`);
    await writeFile(htmlFile, html.replace('</head>', signals + '</head>'), 'utf8');
  }
  const byPath = new Map(routes.map(route => [decodeURIComponent(route.path), route]));
  const exclusions = data.pages.filter(page => page.excluded).map(({ path, excluded }) => ({ path, reason: excluded }));
  for (const file of await filesIn(staging)) {
    if (!file.endsWith('.html')) continue;
    const relative = path.relative(staging, file).replaceAll('\\', '/');
    const route = '/' + relative.replace(/index\.html$/, '');
    if (byPath.has(route)) continue;
    const html = await readFile(file, 'utf8');
    const reason = relative === '404.html' ? 'error page' : /http-equiv=["']?refresh/i.test(html) ? 'redirect alias'
      : /<meta\b[^>]*name=["']?robots\b[^>]*content=["']?noindex/i.test(html) ? 'noindex' : undefined;
    if (!reason) throw new Error(`Public HTML route has no Markdown renderer or explicit exclusion: ${route}`);
    if (!exclusions.some(item => item.path === route)) exclusions.push({ path: route, reason });
  }
  await write('llms.txt', discovery.llms);
  await write('llms-full.txt', discovery.full);
  await write('ai.txt', discovery.ai);
  await write('robots.txt', discovery.robots);
  const worker = await readFile(new URL('./worker.mjs', import.meta.url), 'utf8');
  const workerSite = { url: data.site.url, staticMarkdownPaths };
  workerSite.buildId = createHash('sha256').update(worker).update(JSON.stringify({ metadata, workerSite })).digest('hex');
  await write('api/md/_catalog', JSON.stringify({ buildId: workerSite.buildId, routes: metadata }, null, 2) + '\n');
  await write('_worker.js', `${worker}\nexport default { fetch: createHandler(${JSON.stringify(metadata)}, ${JSON.stringify(workerSite)}) };\n`);
  await rm(path.join(staging, 'ai-data.json'));
  const sources = data.pages.filter(page => !page.excluded && page.source).map(page => ({ path: page.path, source: page.source }));
  await writeFile(path.join(root, '.tools', 'ai-coverage.json'), JSON.stringify({ routes: metadata, exclusions, sources,
    aggregate: { characters: discovery.full.length, included: discovery.included, omitted: discovery.omitted } }, null, 2));
  const quality = await auditSite(staging, { tracking: config.params.tracking });
  await writeFile(path.join(root, '.tools', 'site-quality-build.json'), JSON.stringify(quality, null, 2) + '\n');
  if (quality.errors.length) throw new Error(`Site quality failed before publication: ${JSON.stringify(quality.errors.slice(0, 10))}`);
  await clearGenerated(output);
  await cp(staging, output, { recursive: true });
  console.log(`AI build: ${routes.length} Markdown routes; ${discovery.full.length} aggregate characters; ${discovery.omitted} complete pages omitted from aggregate.`);
  if (discovery.omitted) console.warn('Full-content limit applied. Omitted pages remain available through their Markdown URLs and the catalog.');
}

await build();
