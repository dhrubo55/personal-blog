import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';

const compress = promisify(gzip);

const directory = path.resolve(process.argv[2] || 'public');
const port = Number(process.argv[3] || 8792);
const { default: worker } = await import(pathToFileURL(path.join(directory, '_worker.js')));
const types = { '.html': 'text/html', '.md': 'text/markdown', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.txt': 'text/plain', '.xml': 'application/xml', '.pdf': 'application/pdf', '.ico': 'image/x-icon' };
const assets = {
  async fetch(request) {
    const url = new URL(request.url);
    let filename;
    try { filename = path.resolve(directory, '.' + decodeURIComponent(url.pathname)); }
    catch { return new Response('Bad path', { status: 400 }); }
    if (filename !== directory && !filename.startsWith(directory + path.sep)) return new Response('Forbidden', { status: 403 });
    if ((await stat(filename).catch(() => null))?.isDirectory()) filename = path.join(filename, 'index.html');
    let body = await readFile(filename).catch(() => null);
    if (!body && !path.extname(filename)) {
      filename = path.join(filename, 'index.html');
      body = await readFile(filename).catch(() => null);
    }
    const status = body ? 200 : 404;
    if (!body) { filename = path.join(directory, '404.html'); body = await readFile(filename); }
    return new Response(request.method === 'HEAD' ? null : body, { status, headers: { 'Content-Type': (types[path.extname(filename)] || 'application/octet-stream') + (['.html', '.md', '.css', '.js', '.json', '.txt', '.xml'].includes(path.extname(filename)) ? '; charset=utf-8' : '') } });
  }
};
http.createServer(async (incoming, outgoing) => {
  try {
    const request = new Request(`http://127.0.0.1:${port}${incoming.url}`, { method: incoming.method, headers: incoming.headers });
    const response = await worker.fetch(request, { ASSETS: assets });
    const headers = Object.fromEntries(response.headers);
    let body = Buffer.from(await response.arrayBuffer());
    const acceptsGzip = (incoming.headers['accept-encoding'] ?? '').split(',').some(value => {
      const [encoding, ...parameters] = value.trim().split(';').map(part => part.trim());
      const quality = parameters.find(part => part.startsWith('q='))?.slice(2) ?? '1';
      return encoding === 'gzip' && Number(quality) > 0;
    });
    if (body.length > 1024 && /text\/|javascript|json|xml|svg/.test(headers['content-type'] ?? '')) {
      headers.vary = [headers.vary, 'Accept-Encoding'].filter(Boolean).join(', ');
      if (acceptsGzip) {
        body = await compress(body);
        headers['content-encoding'] = 'gzip';
      }
    }
    if (incoming.method !== 'HEAD') headers['content-length'] = String(body.length);
    outgoing.writeHead(response.status, headers);
    outgoing.end(body);
  } catch (error) { outgoing.writeHead(500); outgoing.end(error.message); }
}).listen(port, '127.0.0.1', () => console.log(`Built Worker preview: http://127.0.0.1:${port}`));
