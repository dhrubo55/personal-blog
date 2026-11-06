# Mohibul Hassan's Blog

Personal website and writing archive for Mohibul Hassan Chowdhury.

The site is built with [Hugo](https://gohugo.io/) and the [PaperMod](https://adityatelange.github.io/hugo-PaperMod/) theme, then deployed to [Cloudflare Pages](https://mohibul.pages.dev/).

## Development

Run a local preview:

```powershell
hugo server
```

Use Node.js 22.19 or newer and Hugo Extended 0.146.7 for reproducible quality
checks. Install the
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

## Site quality

Google Analytics, AdSense and the Twitter advertising pixel are disabled by
default. Enable each deliberately through the independent boolean settings
`params.tracking.googleAnalytics`, `params.tracking.adsense` and
`params.tracking.twitter` in `config.yml`. Their existing identifiers remain
configured. Enabling one does not enable the others. Default quality audits
expect all three to remain disabled.

The Atlas receives deterministic preset coordinates during the staged build.
Filtering and collapsing reuse those coordinates. The Re-layout button is
the only action that starts a new force layout. Support CSS is fingerprinted
and loaded only by `/support/`.

The Atlas serves its existing Space Grotesk and JetBrains Mono fonts locally.
Their unmodified files, source records and SIL Open Font License notices are
in `static/fonts/atlas/`.

The build audits every generated HTML file before replacing `public/`. A
missing image alternative or dimension, broken internal URL or fragment,
unlabeled range control, invalid schema, or unexpected integration stops
publication and leaves the previous artifact in place. The build report is
`.tools/site-quality-build.json`. See [the content checklist](docs/content-quality.md)
for image descriptions, remote dimensions and benchmark evidence.

Run the artifact audit and browser checks after building:

```powershell
npm run audit:site
node scripts/serve-site.mjs public 8792
# In another terminal, with the preview running:
npm run verify:ai -- http://127.0.0.1:8792/
npm run audit:browser -- http://127.0.0.1:8792/
npm run audit:lighthouse -- http://127.0.0.1:8792/ public .tools/site-quality/lighthouse
```

Restart the preview after each build. Set `CHROME_PATH` to the installed
Chrome executable if automatic discovery cannot find it. The browser check
covers desktop/mobile, both themes, Atlas controls and fallback, code contrast,
support tabs and QR controls, and actual tracking/stylesheet requests.
The preview negotiates gzip for text assets, matching normal compressed
delivery. Before/after measurements must use the same preview server.

Lighthouse 13.5.0 runs sequentially in fresh Chrome profiles, with ordinary
network access and cold caches. Each of the six routes in
`scripts/lighthouse.config.json` has three mobile and three desktop runs.
Reports retain browser/settings, OS/CPU, Node version, source commit and a
SHA-256 identity covering every generated artifact. The runner reports medians,
raw JSON/HTML, failed measurements and target shortfalls separately. It exits
unsuccessfully if a measurement fails or a category remains below 100.
Performance comparisons require the same browser, host, build tools, theme
revision and presets. Local and CI scores are separate evidence sets.
Some desktop browser bridges expose decoded text responses to Chrome even
when the server sends gzip. Reports retain that observed transport detail;
these preview scores must not be presented as production wire measurements.

The independent `Site quality` pull-request workflow uses the tracked theme,
Hugo 0.146.7 and Node 22.19.0. It runs correctness checks and retains reports;
it has read-only repository permissions and no deployment credentials.
Production publication remains a separate step. Before publishing, retain
the current known-good Cloudflare deployment ID. Verify the new deployment's
HTML, CSS, graph JSON, Markdown and discovery files against the reviewed
artifact; the Markdown catalog identity alone does not cover every asset.
Use Cloudflare's previous deployment for rollback if verification fails.

Search Console indexing and AI referrals require their own observations.
Lighthouse scores do not establish indexing, rankings or citations.

## Rights

All original writing and site content are owned by Mohibul Hassan Chowdhury. All rights reserved unless a specific page says otherwise.
