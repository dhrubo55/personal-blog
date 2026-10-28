import { createHash } from 'node:crypto';
import { readFile, mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { parse } from 'parse5';
import { inventory, nodes, attributes } from './audit-site.mjs';

export function summarize(reports) {
  if (reports.length !== 3) throw new Error('Exactly three completed measurements are required');
  if (reports.some(report => !report.browserVersion)) throw new Error('Incomplete browser identity');
  const identity = report => JSON.stringify([report.lighthouseVersion, report.browserVersion, report.environment?.hostUserAgent,
    report.configSettings, report.requestedUrl, report.artifact]);
  if (new Set(reports.map(identity)).size !== 1) throw new Error('Incompatible measurements');
  if (reports.some(report => report.runtimeError || report.configSettings?.blockedUrlPatterns?.length)) throw new Error('Failed or diagnostic measurement');
  const median = values => values.sort((a, b) => a - b)[1];
  const scores = {};
  for (const category of ['performance', 'accessibility', 'best-practices', 'seo']) {
    const values = reports.map(report => report.categories?.[category]?.score);
    if (values.some(value => !Number.isFinite(value))) throw new Error(`Incomplete ${category} measurement`);
    scores[category] = median(values.map(value => Math.round(value * 100)));
  }
  const metrics = {};
  for (const [label, id] of [['lcp', 'largest-contentful-paint'], ['tbt', 'total-blocking-time']]) {
    const values = reports.map(report => report.audits?.[id]?.numericValue);
    if (values.some(value => !Number.isFinite(value))) throw new Error(`Incomplete ${label} measurement`);
    metrics[label] = median(values);
  }
  return { scores, metrics };
}

export async function artifactIdentity(directory) {
  const hash = createHash('sha256');
  for (const file of await inventory(directory)) hash.update(file).update('\0').update(await readFile(path.join(directory, file)));
  return hash.digest('hex');
}

export async function verifyServedArtifact(base, directory, routes) {
  const checks = new Map(routes.map(route => [route, route.replace(/^\//, '') + 'index.html']));
  for (const route of routes) {
    const html = await readFile(path.join(directory, route.slice(1), 'index.html'), 'utf8');
    const tree = parse(html);
    const canonical = nodes(tree, node => node.tagName === 'link' && attributes(node).rel === 'canonical')[0];
    const sourceURL = attributes(canonical ?? {}).href || new URL(route, base).href;
    const assets = nodes(tree, node => node.tagName === 'script' && attributes(node).src
      || node.tagName === 'link' && attributes(node).rel === 'stylesheet').map(node => attributes(node).src || attributes(node).href);
    for (const config of nodes(tree, node => attributes(node).id === 'java-graph-config')) {
      assets.push(JSON.parse(config.childNodes.map(node => node.value ?? '').join('')).dataUrl);
    }
    for (const asset of assets) {
      const url = new URL(asset, sourceURL);
      if (url.origin === new URL(sourceURL).origin) checks.set(url.pathname + url.search, decodeURIComponent(url.pathname.slice(1)));
    }
  }
  for (const [url, filename] of checks) {
    const response = await fetch(new URL(url, base), { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Artifact HTTP ${response.status}: ${url}`);
    const expected = await readFile(path.join(directory, filename));
    const actual = Buffer.from(await response.arrayBuffer());
    if (!expected.equals(actual)) throw new Error(`Served artifact differs: ${url}`);
  }
  return [...checks.keys()];
}

async function run() {
  const { default: lighthouse } = await import('lighthouse');
  const { launch } = await import('chrome-launcher');
  const { default: desktopConfig } = await import('lighthouse/core/config/desktop-config.js');
  const protocol = JSON.parse(await readFile(new URL('./lighthouse.config.json', import.meta.url), 'utf8'));
  const { positionals, values } = parseArgs({ allowPositionals: true, options: { route: { type: 'string', multiple: true }, profile: { type: 'string', multiple: true } } });
  const [base, artifactDirectory = 'public', destination = '.tools/site-quality/lighthouse'] = positionals;
  if (!base) throw new Error('Usage: npm run audit:lighthouse -- <preview URL> [artifact directory] [report directory]');
  const routes = values.route ?? protocol.routes;
  const profiles = values.profile ?? protocol.profiles;
  if (routes.some(route => !protocol.routes.includes(route)) || profiles.some(profile => !protocol.profiles.includes(profile))) throw new Error('Unknown protocol route or profile');
  await mkdir(destination, { recursive: true });
  const profileRoot = path.resolve(destination, 'profiles');
  await mkdir(profileRoot, { recursive: true });
  const artifact = await artifactIdentity(artifactDirectory);
  const hugoBin = process.env.HUGO_BIN || (process.platform === 'win32' ? path.resolve('.tools/hugo-0.146.7/hugo.exe') : 'hugo');
  const summary = { artifact, base, protocol, platform: { os: os.platform(), arch: os.arch(), cpu: os.cpus()[0]?.model, node: process.version },
    hugo: execFileSync(hugoBin, ['version'], { encoding: 'utf8' }).trim(),
    trackedTheme: execFileSync('git', ['ls-tree', 'HEAD', 'themes/hugo-PaperMod'], { encoding: 'utf8' }).trim(),
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), selection: { routes, profiles }, browserVersion: null, status: 'running', results: [], failures: [], transportObservations: [] };
  const saveSummary = () => writeFile(path.join(destination, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  await saveSummary();
  try { summary.httpArtifacts = await verifyServedArtifact(base, artifactDirectory, routes); }
  catch (error) {
    summary.status = 'failed';
    summary.failures.push({ error: error.message });
    await saveSummary();
    process.exitCode = 1;
    return;
  }
  for (const route of routes) {
    for (const profile of profiles) {
      const reports = [];
      const name = (route === '/' ? 'home' : route.replaceAll('/', '_')) + '-' + profile;
      for (let run = 1; run <= protocol.runs; run++) {
        let chrome;
        const userDataDir = await mkdtemp(path.join(profileRoot, 'run-'));
        try {
          chrome = await launch({ userDataDir, chromeFlags: ['--headless=new', '--no-first-run', '--disable-dev-shm-usage'], chromePath: process.env.CHROME_PATH });
          const version = await (await fetch(`http://127.0.0.1:${chrome.port}/json/version`, { signal: AbortSignal.timeout(15000) })).json();
          if (summary.browserVersion && summary.browserVersion !== version.Browser) throw new Error('Chrome version changed during measurement');
          summary.browserVersion = version.Browser;
          const result = await lighthouse(new URL(route, base).href, { port: chrome.port, output: ['json', 'html'], logLevel: 'error', onlyCategories: protocol.categories }, profile === 'desktop' ? desktopConfig : undefined);
          if (result.lhr.lighthouseVersion !== protocol.version) throw new Error('Unexpected Lighthouse version');
          const transport = (result.artifacts?.DevtoolsLog ?? []).filter(event => event.method === 'Network.responseReceived').flatMap(event => {
            const response = event.params.response;
            const headers = Object.fromEntries(Object.entries(response.headers).map(([key, value]) => [key.toLowerCase(), value]));
            return headers['x-content-encoding-over-network'] ? [{ url: response.url, upstreamEncoding: headers['x-content-encoding-over-network'], browserEncoding: headers['content-encoding'] ?? null }] : [];
          });
          const report = { ...result.lhr, browserVersion: version.Browser, artifact, transportObservations: transport };
          summary.transportObservations.push(...transport.filter(item => !summary.transportObservations.some(previous => previous.url === item.url)));
          await writeFile(path.join(destination, `${name}-${run}.json`), JSON.stringify(report));
          await writeFile(path.join(destination, `${name}-${run}.html`), result.report[1]);
          if (report.runtimeError) throw new Error(report.runtimeError.message);
          reports.push(report);
          console.log(`${name} ${run}/3: ${JSON.stringify(Object.fromEntries(Object.entries(report.categories).map(([key, value]) => [key, value.score])))}`);
        } catch (error) {
          summary.failures.push({ route, profile, run, error: error.message });
        } finally {
          try { if (chrome) await chrome.kill(); }
          catch (error) { summary.failures.push({ route, profile, run, error: `Chrome shutdown: ${error.message}` }); }
          const resolved = await realpath(userDataDir);
          if (path.dirname(resolved) !== await realpath(profileRoot)) throw new Error('Unexpected profile cleanup target');
          await rm(resolved, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }).catch(error => {
            console.warn(`Retained locked Chrome profile: ${resolved}: ${error.message}`);
          });
        }
      }
      try { summary.results.push({ route, profile, ...summarize(reports) }); }
      catch (error) { summary.failures.push({ route, profile, error: error.message }); }
      await saveSummary();
    }
  }
  if (await artifactIdentity(artifactDirectory) !== artifact) summary.failures.push({ error: 'Artifact changed during measurement' });
  try { await verifyServedArtifact(base, artifactDirectory, routes); }
  catch (error) { summary.failures.push({ error: error.message }); }
  const shortfalls = summary.results.filter(({ scores, route, profile, metrics }) => Object.values(scores).some(score => score < 100)
    || route === '/java/100daysofjava/graph/' && profile === 'mobile' && (metrics.lcp > 2500 || metrics.tbt > 200));
  await writeFile(path.join(destination, 'shortfalls.json'), JSON.stringify(shortfalls, null, 2) + '\n');
  summary.status = summary.failures.length ? 'failed' : shortfalls.length ? 'shortfall' : 'passed';
  await saveSummary();
  console.log(`${summary.results.length} report sets; ${summary.failures.length} failures; ${shortfalls.length} target shortfalls.`);
  if (summary.failures.length || shortfalls.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await run();
