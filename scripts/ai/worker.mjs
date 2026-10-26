function splitHeader(value, delimiter) {
  const parts = [];
  let start = 0;
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < value.length; index++) {
    const character = value[index];
    if (escaped) escaped = false;
    else if (quoted && character === '\\') escaped = true;
    else if (character === '"') quoted = !quoted;
    else if (!quoted && character === delimiter) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function prefersMarkdown(accept) {
  if (!accept) return false;
  const ranges = splitHeader(accept, ',').map(value => {
    const [type, ...parameters] = splitHeader(value, ';').map(part => part.trim().toLowerCase());
    const qualities = parameters.filter(part => /^q\s*=/.test(part));
    const raw = qualities[0]?.slice(qualities[0].indexOf('=') + 1).trim();
    const firstQuality = parameters.findIndex(part => /^q\s*=/.test(part));
    const mediaParameters = parameters.slice(0, firstQuality < 0 ? parameters.length : firstQuality).filter(Boolean);
    const quality = qualities.length > 1 || (raw !== undefined && !/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(raw))
      ? 0 : raw === undefined ? 1 : Number(raw);
    return { type, quality, parameters: mediaParameters.length,
      matches: mediaParameters.every(part => /^charset\s*=\s*(?:utf-8|"utf-8")$/.test(part)) };
  });
  const quality = type => {
    for (const range of [type, 'text/*', '*/*']) {
      const matches = ranges.filter(item => item.type === range && item.matches);
      if (matches.length) {
        const specificity = Math.max(...matches.map(item => item.parameters));
        return Math.max(...matches.filter(item => item.parameters === specificity).map(item => item.quality));
      }
    }
    return 0;
  };
  return ranges.some(item => item.type === 'text/markdown' && item.matches && item.quality > 0)
    && quality('text/markdown') > quality('text/html');
}

export function createHandler(routes, site) {
  const html = new Map(routes.map(route => [decodeURIComponent(route.path), route]));
  const markdown = new Map(routes.map(route => [decodeURIComponent(route.markdown), route]));
  const discovery = new Set(['/llms.txt', '/llms-full.txt', '/ai.txt']);
  const staticMarkdownPaths = new Set((site.staticMarkdownPaths ?? []).map(path => decodeURIComponent(path)));
  const describedBy = [...discovery].map(path => `<${new URL(path, site.url)}>; rel="describedby"`).join(', ');
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Access-Control-Expose-Headers': 'Content-Location, Link, X-Markdown-Tokens, Last-Modified',
  };

  function decorate(response, request, vary = false) {
    const headers = new Headers(response.headers);
    headers.set('Link', [headers.get('Link'), describedBy].filter(Boolean).join(', '));
    if (vary && !headers.get('Vary')?.split(',').some(value => value.trim().toLowerCase() === 'accept')) {
      headers.set('Vary', [headers.get('Vary'), 'Accept'].filter(Boolean).join(', '));
    }
    return new Response(request.method === 'HEAD' ? null : response.body, {
      status: response.status, statusText: response.statusText, headers,
    });
  }

  function textResponse(body, request, { status = 200, route, type = 'text/markdown; charset=utf-8' } = {}) {
    const headers = new Headers({
      ...cors,
      'Content-Type': type,
      'X-Robots-Tag': 'noindex, follow',
      'Cache-Control': status === 200 ? 'public, s-maxage=3600, stale-while-revalidate=86400' : 'no-store',
    });
    if (type.startsWith('text/markdown')) headers.set('X-Markdown-Tokens', String(route?.tokens ?? Math.ceil(body.length / 4)));
    if (route) {
      headers.set('Content-Location', route.canonical);
      headers.set('Link', `<${route.canonical}>; rel="canonical"`);
      if (route.updated) headers.set('Last-Modified', new Date(route.updated).toUTCString());
    }
    if (status === 405) headers.set('Allow', 'GET, HEAD, OPTIONS');
    return decorate(new Response(request.method === 'HEAD' ? null : body, { status, headers }), request, true);
  }

  const missing = request => textResponse('# Not found\n\nNo public Markdown page exists at this address.\n', request, { status: 404 });

  return async function fetch(request, env) {
    const url = new URL(request.url);
    let path;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      return missing(request);
    }
    if (/%2f|%5c/i.test(url.pathname) || path.includes('\\') || path.includes('\0')) return missing(request);

    const isApi = path === '/api/md' || path.startsWith('/api/md/');
    const catalog = path === '/api/md/_catalog';
    const ordinaryRoute = html.get(path) ?? html.get(`${path}/`);
    const realMarkdownNamedPage = ordinaryRoute && /\.md\/?$/i.test(path);
    const excluded = /^\/(?:api|\.well-known|_next|assets|css|js|images|icons)(?:\/|$)/.test(path);
    const explicitMarkdown = !realMarkdownNamedPage && !staticMarkdownPaths.has(path) && !excluded && path.endsWith('.md');
    const negotiated = ordinaryRoute && !realMarkdownNamedPage && prefersMarkdown(request.headers.get('Accept'));
    const machineRequest = isApi || explicitMarkdown || negotiated || discovery.has(path);

    if (!machineRequest) return decorate(await env.ASSETS.fetch(request), request, Boolean(ordinaryRoute));
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return textResponse('# Method not allowed\n', request, { status: 405 });
    }
    if (request.method === 'OPTIONS') {
      return decorate(new Response(null, { status: 204, headers: cors }), request, true);
    }
    if (catalog) {
      return textResponse(JSON.stringify({ buildId: site.buildId, routes }), request, { type: 'application/json; charset=utf-8' });
    }
    if (discovery.has(path)) {
      const asset = await env.ASSETS.fetch(new Request(url, { method: 'GET' }));
      if (asset.status !== 200) return missing(request);
      const response = textResponse(await asset.text(), request, { type: 'text/plain; charset=utf-8' });
      if (path === '/llms-full.txt') response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
      return response;
    }

    let route = explicitMarkdown ? markdown.get(path) : negotiated ? ordinaryRoute : undefined;
    if (isApi) {
      const tail = path.slice('/api/md'.length).replace(/^\//, '').replace(/\/$/, '');
      route = tail === '' || tail === 'index' ? html.get('/') : html.get(`/${tail}/`) ?? html.get(`/${tail}`);
    }
    if (!route) return missing(request);
    const asset = await env.ASSETS.fetch(new Request(new URL(route.markdown, url), { method: 'GET' }));
    if (asset.status !== 200 || /text\/html/i.test(asset.headers.get('Content-Type') ?? '')) return missing(request);
    return textResponse(await asset.text(), request, { route });
  };
}
