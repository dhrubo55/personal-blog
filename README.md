# Mohibul Hassan's Blog

Personal website and writing archive for Mohibul Hassan Chowdhury.

The site is built with [Hugo](https://gohugo.io/) and the [PaperMod](https://adityatelange.github.io/hugo-PaperMod/) theme, then deployed to [Cloudflare Pages](https://mohibul.pages.dev/).

## Development

Run a local preview:

```powershell
hugo server
```

Install Node.js 22 or newer and Hugo Extended 0.146.0 or newer. Install the
build dependencies and run a production build:

```powershell
npm ci
npm run build
```

## Cloudflare Pages deployment

Install Hugo Extended and Node.js, then sign in to Cloudflare:

```powershell
npx --yes wrangler@4.152.0 login
```

The homepage is `https://mohibul.pages.dev/`, configured as `baseURL` in
`config.yml`. The writing archive is at `/blog/`. Build and deploy with:

```powershell
npm run build
npx --yes wrangler@4.152.0 pages deploy public --project-name mohibul --branch main
```

Wrangler uploads `public/` as static assets to the existing `mohibul` Pages
project. The deployment uses the free Pages plan and serves the site's custom
404 page for unknown URLs. Builds and uploads run locally; Git pushes do not
automatically deploy this Direct Upload project.

You can also deploy through the Cloudflare dashboard. Zip the contents of
`public/` with `index.html` at the archive root, open the `mohibul` Pages project,
choose **Create deployment**, upload the ZIP, and deploy to production.

To preview Cloudflare's routing locally:

```powershell
$env:HUGO_BASEURL = 'http://127.0.0.1:8787/'
npm run build
npx --yes wrangler@4.152.0 pages dev public --ip 127.0.0.1 --port 8787
```

After closing the preview, clear the override before deploying:

```powershell
Remove-Item Env:HUGO_BASEURL
```

## Markdown and AI discovery

`npm run build` runs Hugo in an ignored staging directory, generates Markdown
from the same page sources, verifies route coverage, and copies the completed
site to `public/`. It replaces the previous generated `public/` directory.
Set `HUGO_BIN` if Hugo is installed outside your PATH. The build also checks
the locally bundled `.tools/hugo-0.146.7/hugo.exe` on Windows.

Every eligible HTML route has a `.md` alternate, advertised in its HTML head.
The homepage uses `/index.md`. The existing HTML route ending in
`day100-capstone.md/` keeps that address; its alternate ends in
`day100-capstone.md.md`. Real HTML routes ending in `.md` bypass negotiation.

Cloudflare Pages runs the generated `public/_worker.js`. It serves Markdown
when its explicit `Accept: text/markdown` quality is higher than HTML, or
through `/api/md/<path>`. Missing Accept headers, wildcards, and equal quality
values retain HTML. `/api/md/_catalog` lists every eligible route.
Raw `hugo server` previews the writing and layout; use `wrangler pages dev`
after `npm run build` to test the HTTP behavior. The legacy Netlify workflow
generates static alternates but does not execute the Cloudflare Worker.
Restart the Wrangler preview after rebuilding. The verifier compares the
live catalog's build identity with the generated artifact and rejects stale
Worker processes.

The build generates `/llms.txt`, `/llms-full.txt`, `/ai.txt`, and `/robots.txt`.
The aggregate includes complete pages within 500,000 characters and states
its omissions. Every omitted page still has a complete individual alternate.
Site identity, contact, and crawler choices come from `config.yml`.
The AI policy uses the ai.txt 1.7 Markdown heading format and preserves the
site's copyright. Search and user-fetch agents are allowed; GPTBot,
ClaudeBot, Google-Extended, Applebot-Extended, CCBot, and Bytespider are blocked.

New ordinary content pages are discovered automatically. For a new custom
layout or page type, add its renderer to `scripts/ai/registry.mjs`. Unsupported
layouts and public HTML pages without a renderer fail the build. Draft,
future, expired, noindex, search-hidden, and configured excluded pages never
enter the registry. Redirect aliases retain their HTML redirects. There is
no MCP discovery file because the site does not run an MCP server.

Run checks after building:

```powershell
npm test
npm run verify:ai
pwsh -File tests/llm-seo-smoke.ps1
pwsh -File tests/support-page-smoke.ps1
# With wrangler pages dev running:
npm run verify:ai -- http://127.0.0.1:8787/
```

The verifier checks every Markdown document, HTML discovery metadata, listing
pagination, schema JSON, crawler rules, and the aggregate limit. If a prior
HTML build exists in `.tools/ai-baseline/`, it also compares the full parsed
HTML while excluding the intentional metadata changes. With a local URL,
it fetches every alternate and tests the Worker protocol. The report is
written to `.tools/ai-verification.json`.

## Rights

All original writing and site content are owned by Mohibul Hassan Chowdhury. All rights reserved unless a specific page says otherwise.
