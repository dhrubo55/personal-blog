# Blog improvement implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Hugo blog into a focused senior-engineering portfolio and technical publication entry point without replacing PaperMod or breaking the Java archive.

**Architecture:** Keep Hugo 0.146.7, PaperMod, and Netlify. Add small local template overrides, one site stylesheet, content changes, explicit redirects, and repeatable PowerShell checks. Preserve established article URLs and drive homepage selections from article front matter.

**Tech Stack:** Hugo Extended 0.146.7, PaperMod, Go templates, Markdown, YAML, PowerShell 7, LaTeX, Netlify redirects, Poppler

**Spec:** `docs/superpowers/specs/2026-09-19-blog-improvement-design.md`

## Global constraints

- Read the spec before changing a file.
- Preserve the user's modified `static/resume.tex`, untracked `content/posts/day100.md`, and untracked `HANDOFF.md` during repository reconciliation.
- Keep `content/posts/day100.md` byte-for-byte unchanged.
- Use the supplied resume at `C:/Users/msi/Downloads/DOC-20260822-WA0034.pdf` as the source of truth for public career claims.
- Use Hugo Extended 0.146.7 for every production build.
- Keep PaperMod and the Java Learning Atlas. Do not rebuild the site on another framework.
- Keep existing `/posts/posts/` article URLs unless this plan names an explicit redirect.
- Link the newsletter to `https://chaoscodeclarity.substack.com/subscribe` without promising a cadence.
- Do not invent production incidents, measurements, customer names, or benchmark results.
- Do not deploy, push, publish a newsletter issue, or send an external message.
- Apply `pstack-plugin:technical-writing` and `pstack-plugin:unslop` to public copy, the resume source, commit messages, and documentation.
- Use `pdf:pdf` before editing or replacing `static/resume.pdf`. Run its artifact-operation marker exactly once before the first PDF edit.

## Review focus

- A dirty checkout with a conflicting remote `static/resume.tex` change must retain the user's 7+ years edit and the exact Day 100 draft bytes. Task 1 records and rechecks both.
- A fresh Windows machine without Hugo must download the pinned Extended build, verify its published checksum, and build with the initialized theme submodule. Task 2 tests this path.
- A page without article front matter must not receive the article newsletter prompt. Task 5 tests the `.Type` and section condition.
- Retired pages must stay out of the sitemap while their old URLs receive permanent redirects. Task 8 tests both conditions.
- Internal links that differ only by the duplicated `/posts/` segment must resolve against generated output. Task 8 runs a same-origin link audit after the Hugo build.

---

### Task 1: Reconcile the checkout without losing local work

**Files:**

- Preserve: `static/resume.tex`
- Preserve: `content/posts/day100.md`
- Preserve: `HANDOFF.md`
- Merge: current `origin/master`

**Interfaces:**

- Consumes: the dirty checkout described in the spec
- Produces: a checkout containing current remote history and the three preserved local files

- [ ] **Step 1: Record the starting state and the draft hash**

Run:

```powershell
git status --short
git rev-parse HEAD
git rev-parse origin/master
Get-FileHash -Algorithm SHA256 -LiteralPath content/posts/day100.md
git diff -- static/resume.tex
```

Expected: `static/resume.tex` is modified, `content/posts/day100.md` and `HANDOFF.md` are untracked, and the resume diff contains `7+ years`.

- [ ] **Step 2: Make recoverable copies outside the repository**

Run:

```powershell
$backup = Join-Path $env:TEMP 'personal-blog-improvement-backup'
New-Item -ItemType Directory -Force -Path $backup | Out-Null
Copy-Item -LiteralPath static/resume.tex -Destination (Join-Path $backup 'resume.tex') -Force
Copy-Item -LiteralPath content/posts/day100.md -Destination (Join-Path $backup 'day100.md') -Force
Copy-Item -LiteralPath HANDOFF.md -Destination (Join-Path $backup 'HANDOFF.md') -Force
Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $backup 'day100.md')
```

Expected: the backup draft hash matches Step 1.

- [ ] **Step 3: Stash the dirty work, fetch, and merge**

Run:

```powershell
git stash push --include-untracked --message 'pre-blog-improvement-local-work'
git fetch origin
git merge --no-edit origin/master
git stash pop
```

Expected: the fetch updates `origin/master`. If `static/resume.tex` conflicts, keep the remote file as the base and reapply the user's `7+ years` intent from the backup. Do not choose one whole side of the conflict.

- [ ] **Step 4: Prove that the local work survived**

Run:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath content/posts/day100.md
Compare-Object (Get-Content -LiteralPath (Join-Path $env:TEMP 'personal-blog-improvement-backup/day100.md')) (Get-Content -LiteralPath content/posts/day100.md)
Select-String -LiteralPath static/resume.tex -Pattern '7\+ years'
Test-Path -LiteralPath HANDOFF.md
git status --short
```

Expected: `Compare-Object` prints nothing, the resume search finds `7+ years`, `HANDOFF.md` exists, and no file contains unresolved conflict markers.

- [ ] **Step 5: Initialize the exact theme revision**

Run:

```powershell
git submodule sync --recursive
git submodule update --init --recursive
git submodule status
```

Expected: `themes/hugo-PaperMod` resolves to the gitlink recorded by the merged repository.

### Task 2: Add the repeatable build and smoke-test tools

**Files:**

- Create: `scripts/build-site.ps1`
- Create: `tests/blog-improvement-smoke.ps1`
- Modify: `.gitignore`

**Interfaces:**

- Produces: `scripts/build-site.ps1 [-Clean]`, which writes the generated site to `public/`
- Produces: `tests/blog-improvement-smoke.ps1 -SourceOnly` for source checks and `tests/blog-improvement-smoke.ps1 -PublicDir public` for generated checks

- [ ] **Step 1: Write a failing source test for the build script**

Create `tests/blog-improvement-smoke.ps1` with these helpers and initial assertions:

```powershell
param(
    [switch] $SourceOnly,
    [string] $PublicDir = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..')) 'public')
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')

function Assert-True {
    param([bool] $Condition, [string] $Message)
    if (-not $Condition) { throw $Message }
}

function Assert-FileContains {
    param([string] $Path, [string] $Pattern, [string] $Message)
    Assert-True (Test-Path -LiteralPath $Path) "Missing file: $Path"
    Assert-True ([bool](Select-String -LiteralPath $Path -Pattern $Pattern -Quiet)) $Message
}

function Assert-FileOmits {
    param([string] $Path, [string] $Pattern, [string] $Message)
    Assert-True (Test-Path -LiteralPath $Path) "Missing file: $Path"
    Assert-True (-not [bool](Select-String -LiteralPath $Path -Pattern $Pattern -Quiet)) $Message
}

$buildScript = Join-Path $root 'scripts/build-site.ps1'
Assert-FileContains $buildScript "0\.146\.7" 'The local build does not pin Hugo 0.146.7.'
Assert-FileContains $buildScript 'checksums\.txt' 'The Hugo download does not verify the release checksum.'
Assert-FileContains $buildScript 'hugo_extended_.*windows-amd64\.zip' 'The local build does not use Hugo Extended for Windows.'

if (-not $SourceOnly) {
    Assert-True (Test-Path -LiteralPath $PublicDir) "Generated site not found: $PublicDir"
}

Write-Host 'Blog improvement smoke test passed.'
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run:

```powershell
pwsh -NoProfile -File tests/blog-improvement-smoke.ps1 -SourceOnly
```

Expected: FAIL with `Missing file: ...scripts/build-site.ps1`.

- [ ] **Step 3: Implement the pinned Hugo build**

Create `scripts/build-site.ps1`:

```powershell
param([switch] $Clean)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$version = '0.146.7'
$toolRoot = Join-Path $root ".tools/hugo/$version"
$hugo = Join-Path $toolRoot 'hugo.exe'
$archiveName = "hugo_extended_${version}_windows-amd64.zip"
$releaseBase = "https://github.com/gohugoio/hugo/releases/download/v$version"

if (-not (Test-Path -LiteralPath $hugo)) {
    New-Item -ItemType Directory -Force -Path $toolRoot | Out-Null
    $archive = Join-Path $toolRoot $archiveName
    $checksums = Join-Path $toolRoot 'checksums.txt'
    Invoke-WebRequest "$releaseBase/$archiveName" -OutFile $archive
    Invoke-WebRequest "$releaseBase/hugo_${version}_checksums.txt" -OutFile $checksums
    $line = Select-String -LiteralPath $checksums -Pattern "^[0-9a-f]{64}\s+$([regex]::Escape($archiveName))$"
    if (-not $line) { throw "Checksum entry not found for $archiveName" }
    $expected = ($line.Line -split '\s+')[0].ToUpperInvariant()
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash
    if ($actual -ne $expected) { throw "Hugo checksum mismatch. Expected $expected, got $actual" }
    Expand-Archive -LiteralPath $archive -DestinationPath $toolRoot -Force
}

$versionOutput = & $hugo version
if ($LASTEXITCODE -ne 0 -or $versionOutput -notmatch "v$([regex]::Escape($version))") {
    throw "Expected Hugo $version. Got: $versionOutput"
}

if ($Clean -and (Test-Path -LiteralPath (Join-Path $root 'public'))) {
    Remove-Item -LiteralPath (Join-Path $root 'public') -Recurse -Force
}

& $hugo --source $root --gc --minify --enableGitInfo --cacheDir (Join-Path $root '.tools/hugo-cache')
if ($LASTEXITCODE -ne 0) { throw "Hugo build failed with exit code $LASTEXITCODE" }
```

The repository already ignores `.tools` and `public`. Keep those entries in `.gitignore`.

- [ ] **Step 4: Run the source test**

Run:

```powershell
pwsh -NoProfile -File tests/blog-improvement-smoke.ps1 -SourceOnly
```

Expected: PASS.

- [ ] **Step 5: Run the first local build**

Run:

```powershell
pwsh -NoProfile -File scripts/build-site.ps1 -Clean
```

Expected: the script verifies Hugo 0.146.7 and writes `public/index.html`. If the sandbox blocks the GitHub download, rerun the same command with network approval.

- [ ] **Step 6: Commit the build tools**

```powershell
git add scripts/build-site.ps1 tests/blog-improvement-smoke.ps1 .gitignore
git commit -m "test: add repeatable Hugo build checks"
```

### Task 3: Replace the missing social image with a deterministic card

**Files:**

- Create: `scripts/generate-social-card.ps1`
- Create: `static/images/social/default.png`
- Modify: `config.yml`
- Modify: `tests/blog-improvement-smoke.ps1`

**Interfaces:**

- Produces: a 1200 by 630 PNG at `/images/social/default.png`
- Consumes: `params.images` from `config.yml`

- [ ] **Step 1: Add failing social-image assertions**

Add these source assertions before the generated-output block in `tests/blog-improvement-smoke.ps1`:

```powershell
$config = Join-Path $root 'config.yml'
$socialImage = Join-Path $root 'static/images/social/default.png'
Assert-FileContains $config "images:\s*\['/images/social/default\.png'\]" 'The site default social image is not configured.'
Assert-True (Test-Path -LiteralPath $socialImage) 'The default social image is missing.'
Add-Type -AssemblyName System.Drawing
$bitmap = [System.Drawing.Image]::FromFile($socialImage)
try {
    Assert-True ($bitmap.Width -eq 1200 -and $bitmap.Height -eq 630) 'The default social image must be 1200 by 630 pixels.'
} finally {
    $bitmap.Dispose()
}
```

Inside the generated-output block, add:

```powershell
$homeHtml = Join-Path $PublicDir 'index.html'
Assert-FileContains $homeHtml 'https://mohibulsblog\.netlify\.app/images/social/default\.png' 'Generated social metadata does not use the default card.'
Assert-FileOmits $homeHtml '/profile-pic\.jpg' 'Generated social metadata still points to the missing profile image.'
```

- [ ] **Step 2: Run the source test and verify failure**

Run:

```powershell
pwsh -NoProfile -File tests/blog-improvement-smoke.ps1 -SourceOnly
```

Expected: FAIL because `config.yml` still names `profile-pic.jpg`.

- [ ] **Step 3: Create the social-card generator**

Create `scripts/generate-social-card.ps1` with fixed dimensions, colors, and text:

```powershell
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$output = Join-Path $root 'static/images/social/default.png'
New-Item -ItemType Directory -Force -Path (Split-Path $output) | Out-Null

$bitmap = New-Object System.Drawing.Bitmap 1200, 630
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $graphics.Clear([System.Drawing.Color]::FromArgb(30, 30, 33))
    $accent = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(98, 159, 255))
    $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(245, 245, 245))
    $muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(190, 193, 200))
    $nameFont = New-Object System.Drawing.Font 'Segoe UI', 54, ([System.Drawing.FontStyle]::Bold)
    $tagFont = New-Object System.Drawing.Font 'Segoe UI', 29, ([System.Drawing.FontStyle]::Regular)
    $urlFont = New-Object System.Drawing.Font 'Segoe UI', 22, ([System.Drawing.FontStyle]::Regular)
    $graphics.FillRectangle($accent, 72, 82, 12, 390)
    $graphics.DrawString('Mohibul Hassan Chowdhury', $nameFont, $white, 118, 120)
    $graphics.DrawString('Java, distributed systems, production AI, and reliability', $tagFont, $muted, 120, 245)
    $graphics.DrawString('mohibulsblog.netlify.app', $urlFont, $accent, 120, 490)
    $bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
    $graphics.Dispose()
    $bitmap.Dispose()
}
```

- [ ] **Step 4: Generate the card and update the configuration**

Run:

```powershell
pwsh -NoProfile -File scripts/generate-social-card.ps1
```

Change `params.images` in `config.yml` to:

```yaml
  images: ['/images/social/default.png']
```

- [ ] **Step 5: Run source and generated tests**

Run:

```powershell
pwsh -NoProfile -File tests/blog-improvement-smoke.ps1 -SourceOnly
pwsh -NoProfile -File scripts/build-site.ps1 -Clean
pwsh -NoProfile -File tests/blog-improvement-smoke.ps1
```

Expected: all commands pass and `public/images/social/default.png` exists.

- [ ] **Step 6: Commit the social card**

```powershell
git add config.yml scripts/generate-social-card.ps1 static/images/social/default.png tests/blog-improvement-smoke.ps1
git commit -m "fix: add a working default social card"
```

### Task 4: Build the focused homepage and mobile navigation

**Files:**

- Create: `layouts/partials/home_info.html`
- Create: `assets/css/extended/portfolio.css`
- Modify: `config.yml`
- Modify: `content/posts/day99.md`
- Modify: `content/posts/day88.md`
- Modify: `content/posts/day-65-becoming-a-memory-plumber-a-tale-of-memory-leak-and-how-to-find-them.md`
- Modify: `tests/blog-improvement-smoke.ps1`

**Interfaces:**

- Consumes: front matter fields `featured`, `featuredOrder`, and `seriesLabel`
- Produces: `.portfolio-intro`, `.portfolio-actions`, `.featured-grid`, and `.reading-paths` markup

- [ ] **Step 1: Add failing homepage and navigation tests**

Add these assertions:

```powershell
$homePartial = Join-Path $root 'layouts/partials/home_info.html'
$portfolioCss = Join-Path $root 'assets/css/extended/portfolio.css'
Assert-FileContains $homePartial 'I build reliable backend and AI systems\.' 'The homepage positioning statement is missing.'
Assert-FileContains $homePartial 'Read selected work' 'The selected-work action is missing.'
Assert-FileContains $homePartial 'Start here' 'The homepage reading paths are missing.'
Assert-FileContains $homePartial 'Params\.featured' 'The homepage does not read featured article metadata.'
Assert-FileContains $portfolioCss '@media \(max-width: 600px\)' 'The portfolio styles do not define a mobile layout.'
Assert-FileContains $config 'name: Writing' 'The Writing menu item is missing.'
Assert-FileContains $config 'name: Case studies' 'The Case studies menu item is missing.'
Assert-FileContains $config 'name: Newsletter' 'The Newsletter menu item is missing.'
Assert-FileOmits $config '^\s*- name: RSS$' 'RSS remains in the primary menu.'
```

- [ ] **Step 2: Run the source test and verify failure**

Run `pwsh -NoProfile -File tests/blog-improvement-smoke.ps1 -SourceOnly`.

Expected: FAIL because `layouts/partials/home_info.html` does not exist.

- [ ] **Step 3: Replace the primary menu**

Set `menu.main` in `config.yml` to:

```yaml
menu:
  main:
  - name: Writing
    identifier: writing
    url: blog/
    weight: 1
  - name: Case studies
    identifier: case-studies
    url: case-studies/
    weight: 2
  - name: About
    identifier: about
    url: about/
    weight: 3
  - name: Newsletter
    identifier: newsletter
    url: https://chaoscodeclarity.substack.com/subscribe
    weight: 4
```

Remove the generic `homeInfoParams.Content`. Keep `socialIcons`, but remove the Medium item because it points to the generic Medium homepage.

- [ ] **Step 4: Mark the three homepage articles**

Add this front matter, using orders 10, 20, and 30:

```toml
featured = true
featuredOrder = 10
seriesLabel = "Day 99 of 100DaysOfJava"
```

Use Day 99 for order 10, Day 88 for order 20, and the Day 66 memory article for order 30. Adjust each `seriesLabel` to its own day.

- [ ] **Step 5: Create the homepage partial**

Implement `layouts/partials/home_info.html` with this structure:

```html
<section class="portfolio-intro" aria-labelledby="portfolio-title">
  <p class="portfolio-kicker">Senior Software Engineer II</p>
  <h1 id="portfolio-title">I build reliable backend and AI systems.</h1>
  <p>I'm Mohibul Hassan, a Senior Software Engineer II working with Java, distributed systems, and production AI. I write about debugging failures, measuring performance, and the decisions behind reliable software.</p>
  <nav class="portfolio-actions" aria-label="Introduction links">
    <a class="primary" href="{{ "case-studies/" | relURL }}">Read selected work</a>
    <a href="{{ "blog/" | relURL }}">Browse technical writing</a>
    <a href="{{ "resume.pdf" | relURL }}">Download resume</a>
    <a href="https://chaoscodeclarity.substack.com/subscribe">Subscribe</a>
  </nav>
</section>

<section class="home-section" aria-labelledby="featured-title">
  <div class="section-heading">
    <p class="eyebrow">Selected writing</p>
    <h2 id="featured-title">Investigations worth starting with</h2>
  </div>
  <div class="featured-grid">
    {{- $featured := where site.RegularPages "Params.featured" true -}}
    {{- range sort $featured "Params.featuredOrder" "asc" -}}
    <article class="featured-card">
      {{- with .Params.seriesLabel }}<p class="card-label">{{ . }}</p>{{ end -}}
      <h3><a href="{{ .RelPermalink }}">{{ .Title }}</a></h3>
      <p>{{ .Summary }}</p>
    </article>
    {{- end -}}
  </div>
</section>

<section class="home-section" aria-labelledby="paths-title">
  <div class="section-heading">
    <p class="eyebrow">Start here</p>
    <h2 id="paths-title">Pick the question you are working on</h2>
  </div>
  <div class="reading-paths">
    <a href="{{ "posts/java/100daysofjava/day66/" | relURL }}"><strong>Debug a Java service</strong><span>Memory leaks, heap evidence, and runtime behavior.</span></a>
    <a href="{{ "posts/posts/java/100daysofjava/day99/" | relURL }}"><strong>Understand concurrency</strong><span>Virtual threads, event loops, and measured trade-offs.</span></a>
    <a href="{{ "posts/posts/java/100daysofjava/day88/" | relURL }}"><strong>Build reliable AI workflows</strong><span>Transcription, evaluation, retries, and stale summaries.</span></a>
  </div>
</section>

{{- with site.Params.socialIcons }}
<div class="home-socials">{{ partial "social_icons.html" (dict "icons" .) }}</div>
{{- end }}
```

After the first Hugo build, adjust only the `social_icons.html` dictionary keys if the pinned PaperMod partial requires `align`. Do not copy PaperMod's entire home template.

- [ ] **Step 6: Add responsive styles**

Create `assets/css/extended/portfolio.css`. Use PaperMod variables such as `--theme`, `--entry`, `--primary`, `--secondary`, and `--border`. Define a two-column `.featured-grid`, a three-column `.reading-paths`, clear focus styles, and this mobile rule:

```css
@media (max-width: 600px) {
  .portfolio-intro { padding-block: 1.5rem; }
  .portfolio-intro h1 { font-size: clamp(2rem, 10vw, 3rem); }
  .portfolio-actions { display: grid; grid-template-columns: 1fr; }
  .featured-grid, .reading-paths { grid-template-columns: 1fr; }
  .header .nav { gap: 0.25rem; }
  #menu { gap: 0.5rem; overflow-x: visible; flex-wrap: wrap; justify-content: flex-end; }
  #menu a { font-size: 0.88rem; }
}
```

Keep `body`, `.main`, and all cards within `max-width: 100%` so a 390-pixel viewport has no horizontal page scroll.

- [ ] **Step 7: Run tests and build**

Run:

```powershell
pwsh -NoProfile -File tests/blog-improvement-smoke.ps1 -SourceOnly
pwsh -NoProfile -File scripts/build-site.ps1 -Clean
pwsh -NoProfile -File tests/blog-improvement-smoke.ps1
```

Expected: PASS. Confirm that `public/index.html` contains exactly three `featured-card` articles.

- [ ] **Step 8: Commit the homepage**

```powershell
git add config.yml layouts/partials/home_info.html assets/css/extended/portfolio.css content/posts/day99.md content/posts/day88.md content/posts/day-65-becoming-a-memory-plumber-a-tale-of-memory-leak-and-how-to-find-them.md tests/blog-improvement-smoke.ps1
git commit -m "feat: focus the homepage on selected engineering work"
```

### Task 5: Rewrite About and add the newsletter invitation

**Files:**

- Modify: `content/about.md`
- Create: `layouts/partials/newsletter_cta.html`
- Create: `layouts/shortcodes/newsletter.html`
- Modify: `layouts/_partials/extend_post_content.html`
- Modify: `assets/css/extended/portfolio.css`
- Modify: `tests/blog-improvement-smoke.ps1`

**Interfaces:**

- Produces: `newsletter_cta.html`, which accepts a Hugo page as its context
- Consumes: `.Type == "posts"` in the post-content hook

- [ ] **Step 1: Add failing copy and rendering tests**

Add:

```powershell
$about = Join-Path $root 'content/about.md'
$newsletter = Join-Path $root 'layouts/partials/newsletter_cta.html'
$newsletterShortcode = Join-Path $root 'layouts/shortcodes/newsletter.html'
$postHook = Join-Path $root 'layouts/_partials/extend_post_content.html'
Assert-FileContains $about 'Senior Software Engineer II' 'The About page does not state the current role.'
Assert-FileContains $about '7\+ years' 'The About page does not state current experience.'
Assert-FileContains $about 'Senior engineering roles' 'The About page does not name the work Mohibul welcomes.'
Assert-FileOmits $about 'amateur Technical Writer' 'The About page still understates the writing work.'
Assert-FileOmits $about '^\\\[Twitter\\\]:' 'Escaped reference definitions remain visible.'
Assert-FileContains $newsletter 'chaoscodeclarity\.substack\.com/subscribe' 'The newsletter call to action has the wrong destination.'
Assert-FileContains $newsletterShortcode 'partial "newsletter_cta\.html" \.Page' 'The About-page newsletter shortcode does not reuse the shared partial.'
Assert-FileContains $postHook 'eq \.Type "posts"' 'The article hook does not limit the newsletter invitation to posts.'
Assert-FileContains $postHook 'partial "newsletter_cta\.html"' 'Published posts do not include the newsletter invitation.'
```

- [ ] **Step 2: Run the test and verify failure**

Run `pwsh -NoProfile -File tests/blog-improvement-smoke.ps1 -SourceOnly`.

Expected: FAIL on the stale About copy.

- [ ] **Step 3: Replace the About page**

Write an explanation page with these sections and facts:

```markdown
# About Mohibul Hassan Chowdhury

I'm a Senior Software Engineer II with 7+ years of experience building backend systems for US and European clients. My work centers on Java, distributed systems, production AI, and reliability.

I like the part of engineering where a tidy abstraction meets an untidy production system. That has led me to work on call transcription and conversation intelligence, database migrations, payment systems, and failures that cross Java services, Erlang state machines, SQL, and messaging workflows.

## Work I can discuss publicly

- I helped architect and ship call transcription and conversation-intelligence workflows using Google Vertex AI and Gemini.
- I led a database cleanup after analysis of approximately 68 million records and cross-system dependencies. The migration removed 8 write triggers and 4 unused tables.
- I contribute technical writing through Baeldung and maintain the 100DaysOfJava archive and Java Learning Atlas.

Read the [case studies](/case-studies/) for scope, evidence, and limitations.

## Career

- **Cefalo, 2022 to present.** Senior Software Engineer II working across Java, Erlang, AI, telephony, databases, payments, and reliability.
- **Brain Station 23, 2020 to 2022.** Software Engineer building Spring Boot APIs, tenant-aware authorization, Stripe billing, and healthcare-platform features.
- **Welldev, 2019 to 2020.** Junior Software Engineer working with Spring Boot, PostgreSQL, Vue.js, Nuxt.js, Storybook, and Docker.

## Writing

I write investigations that start with a concrete question, show the evidence, and state what the evidence cannot prove. Browse the [technical writing](/blog/) or use the [Java Learning Atlas](/java/100daysofjava/graph/) to follow the 100DaysOfJava series by topic.

## Work and contact

I welcome conversations about senior engineering roles, backend and AI architecture, reliability work, and focused consulting engagements.

- [Download my resume](/resume.pdf)
- [View my resume page](/resume/)
- [Email me](mailto:mohibulhassan100@gmail.com)
- [LinkedIn](https://www.linkedin.com/in/mohibulhassan/)
- [GitHub](https://github.com/dhrubo55)
```

Keep valid front matter with `title`, `url`, `hidemeta`, `disableShare`, and a current summary.

- [ ] **Step 4: Add the reusable newsletter partial**

Create `layouts/partials/newsletter_cta.html`:

```html
<aside class="newsletter-cta" aria-labelledby="newsletter-title">
  <p class="eyebrow">Chaos;Code;Clarity</p>
  <h2 id="newsletter-title">Follow the next investigation</h2>
  <p>Get practical investigations into Java, production AI, and software reliability.</p>
  <a href="https://chaoscodeclarity.substack.com/subscribe">Subscribe on Substack</a>
</aside>
```

Create `layouts/shortcodes/newsletter.html`:

```html
{{- partial "newsletter_cta.html" .Page -}}
```

Add `{{ partial "newsletter_cta.html" . }}` once after the homepage reading paths. Add `{{< newsletter >}}` once at the end of `content/about.md`.

- [ ] **Step 5: Replace the dormant article form hook**

Set `layouts/_partials/extend_post_content.html` to:

```html
{{- if eq .Type "posts" -}}
  {{- partial "newsletter_cta.html" . -}}
{{- end -}}
```

Delete the unused `.form` wrapper. Do not change `layouts/partials/form.html` unless a repository search proves another caller needs it.

- [ ] **Step 6: Style and test the invitation**

Add `.newsletter-cta` styles to `portfolio.css` with a border, a restrained background, and a visible keyboard-focus state. Then run the source test and a clean Hugo build.

Expected: About has one invitation, a generated post has one invitation, and `/resume/` has none.

- [ ] **Step 7: Commit the About and newsletter work**

```powershell
git add content/about.md layouts/partials/newsletter_cta.html layouts/shortcodes/newsletter.html layouts/_partials/extend_post_content.html assets/css/extended/portfolio.css tests/blog-improvement-smoke.ps1
git commit -m "feat: connect the portfolio to the newsletter"
```

### Task 6: Publish selected work and a useful resume page

**Files:**

- Modify: `content/projects.md`
- Modify: `content/resume.md`
- Modify: `config.yml`
- Modify: `tests/blog-improvement-smoke.ps1`

**Interfaces:**

- Produces: `/case-studies/` with alias `/projects/`
- Produces: `/resume/` and `/resume.pdf`

- [ ] **Step 1: Add failing page tests**

Add source assertions for the route, each qualified metric, the technical-investigation label, and the resume links:

```powershell
$caseStudies = Join-Path $root 'content/projects.md'
$resumePage = Join-Path $root 'content/resume.md'
Assert-FileContains $caseStudies 'url: "/case-studies/"' 'Selected work does not use the case-studies route.'
Assert-FileContains $caseStudies 'Production call intelligence' 'The call-intelligence case study is missing.'
Assert-FileContains $caseStudies 'approximately 68 million records' 'The database evidence is missing or unqualified.'
Assert-FileContains $caseStudies 'approximately 1\.8 million unnecessary writes per month' 'The write-reduction evidence is missing or unqualified.'
Assert-FileContains $caseStudies 'estimated 50 to 100 GB' 'The storage estimate is missing its qualification.'
Assert-FileContains $caseStudies 'Technical investigation' 'Day 99 is not labeled as a technical investigation.'
Assert-FileContains $resumePage '\[Download the PDF\]\(/resume\.pdf\)' 'The HTML resume page does not link to the PDF.'
Assert-FileContains $resumePage '\[Selected work\]\(/case-studies/\)' 'The HTML resume page does not link to selected work.'
```

- [ ] **Step 2: Run the source test and verify failure**

Expected: FAIL because `content/projects.md` is still a placeholder on the merged branch.

- [ ] **Step 3: Replace the Projects placeholder**

Keep the filename `content/projects.md`, but set `title: Selected work`, `url: "/case-studies/"`, and `aliases: ["/projects/"]`. Remove `robotsNoIndex` and `searchHidden`.

Write three sections in this order:

1. Production call intelligence, using every approved fact in the spec and no customer details.
2. Database cleanup and migration, separating the problem, constraints, Mohibul's contribution, migration decisions, evidence, outcome, and limitations.
3. Virtual threads and event loops, labeled "Technical investigation" and linked to Day 99 and its public repository.

End with links to email, LinkedIn, and the resume.

- [ ] **Step 4: Fill the HTML resume page**

Use this structure:

```markdown
I'm a Senior Software Engineer II with 7+ years of experience building backend systems, distributed services, and production AI workflows.

[Download the PDF](/resume.pdf) or read the [Selected work](/case-studies/) behind the summary.

## Current focus

- Java backend and distributed systems
- Production AI, transcription, and conversation intelligence
- Database migrations, performance, and reliability

## Contact

- [Email](mailto:mohibulhassan100@gmail.com)
- [LinkedIn](https://www.linkedin.com/in/mohibulhassan/)
- [GitHub](https://github.com/dhrubo55)
```

- [ ] **Step 5: Update the footer links**

Set `params.footer.text` in `config.yml` to include Resume, RSS, Support, Terms of Service, and Privacy Policy. Keep the merged repository's ownership and licensing language. Do not restore the stale open-source or CC BY-NC claims removed by `origin/master`.

- [ ] **Step 6: Build, test, and commit**

Run the source test, clean build, and generated test. Confirm `/case-studies/`, `/projects/`, and `/resume/` outputs. Then commit:

```powershell
git add content/projects.md content/resume.md config.yml tests/blog-improvement-smoke.ps1
git commit -m "feat: publish selected work and resume routes"
```

### Task 7: Synchronize the resume source and public PDF

**Files:**

- Modify: `static/resume.tex`
- Replace: `static/resume.pdf`
- Modify: `tests/blog-improvement-smoke.ps1`

**Interfaces:**

- Consumes: `C:/Users/msi/Downloads/DOC-20260822-WA0034.pdf`
- Produces: a two-page public PDF and matching LaTeX source

- [ ] **Step 1: Start the PDF edit operation once**

Follow the installed `pdf:pdf` skill. Run its `mark_artifact_operation_started.mjs` command once with `--operation-kind edit --expected-output-count 1 --output-format pdf` immediately before replacing the PDF.

- [ ] **Step 2: Add failing resume assertions**

Add source checks for:

```powershell
$resumeTex = Join-Path $root 'static/resume.tex'
Assert-FileContains $resumeTex 'Senior Software Engineer II with 7\+ years' 'The resume summary is not current.'
Assert-FileContains $resumeTex 'approximately 68M records' 'The current database evidence is missing.'
Assert-FileContains $resumeTex 'approximately 1\.8M unnecessary writes/month' 'The current write-reduction evidence is missing.'
Assert-FileContains $resumeTex 'revision-aware staleness' 'The conversation-intelligence work is missing.'
Assert-FileContains $resumeTex 'subject-matter expert for telephony and production reliability' 'The reliability work is missing.'
```

Use `pypdf.PdfReader` in a read-only check to assert that `static/resume.pdf` has exactly two pages.

- [ ] **Step 3: Update the LaTeX source from the supplied resume**

Keep the existing document structure and replace the content so it matches the supplied PDF. The first page must include these exact role headings and evidence:

- `Senior Software Engineer II`, `Sep 2022 - Present`
- Production AI call transcription with single and batch processing, multilingual prompting, credential management, confidence-based evaluation, failure handling, provider reliability, and bring-your-own-key pricing trade-offs
- Conversation intelligence with revision-aware staleness, append-only lifecycle state, batch processing, retries, feature flags, and notifications
- Approximately 68M records, 8 write triggers, 4 unused tables, approximately 1.8M unnecessary writes per month, estimated 50 to 100 GB, and estimated USD 600 to 1,200 per year
- Subscription and payment capabilities
- Telephony and production reliability across Java, Erlang, SQL, anonymization, transcription, dialing, and messaging
- Technical leadership through architecture and code review

The second page must match the supplied skill groups, selected technical projects and expertise, Baeldung and 100DaysOfJava writing line, and BRAC University education line.

- [ ] **Step 4: Replace the public PDF with the supplied current PDF**

Run:

```powershell
Copy-Item -LiteralPath 'C:/Users/msi/Downloads/DOC-20260822-WA0034.pdf' -Destination static/resume.pdf -Force
```

This makes the approved two-page artifact public without waiting for an unavailable local TeX installation. The existing GitHub workflow can compile the synchronized source after a later authorized push.

- [ ] **Step 5: Render and inspect both pages**

Use the bundled Poppler path returned by `load_workspace_dependencies`. Render at 150 DPI:

```powershell
$poppler = 'C:/Users/msi/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe'
New-Item -ItemType Directory -Force -Path tmp/pdfs | Out-Null
& $poppler -png -r 150 static/resume.pdf tmp/pdfs/resume
```

Open both PNG files. Confirm that the contact row, page-one experience, page-two skill table, headings, and final education row are not clipped or overlapped.

- [ ] **Step 6: Run tests and commit**

Run the source test and clean build. Confirm that `public/resume.pdf` has the same SHA-256 hash as `static/resume.pdf`. Then commit:

```powershell
git add static/resume.tex static/resume.pdf tests/blog-improvement-smoke.ps1
git commit -m "feat: align the public resume with current experience"
```

### Task 8: Retire accidental pages, add redirects, and repair internal links

**Files:**

- Modify: `config.yml`
- Create or modify: `static/_redirects`
- Modify: `content/posts/day100-capstone.md`
- Modify: `content/posts/day95-part1.md`
- Modify: `content/posts/day96-part2.md`
- Modify: `content/posts/day97-part3.md`
- Modify: `content/posts/day99.md`
- Modify: `tests/blog-improvement-smoke.ps1`

**Interfaces:**

- Produces: permanent redirect rules for `/day100/`, `/posts/mohibul-writing-guide/`, and `/projects/`
- Produces: generated HTML with no known same-origin 404 links

- [ ] **Step 1: Add failing retirement and link tests**

Add source assertions that `config.yml` ignores only these exact files:

```yaml
ignoreFiles:
  - 'content/day100\.md$'
  - 'content/posts/day100\.md$'
  - 'content/posts/mohibul-writing-guide\.md$'
```

Add assertions for these redirect lines:

```text
/day100/ /posts/posts/java/100daysofjava/day100-capstone.md/ 301
/posts/mohibul-writing-guide/ /about/ 301
/projects/ /case-studies/ 301
```

Inside the generated-output test, assert that `public/sitemap.xml` omits `/day100/` and `/posts/mohibul-writing-guide/`.

- [ ] **Step 2: Prove the test fails before implementation**

Run the source test. Expected: FAIL because `ignoreFiles` and `_redirects` do not contain the required rules.

- [ ] **Step 3: Exclude the two source files without editing the user draft**

Add the exact `ignoreFiles` block from Step 1 to `config.yml`. Record the SHA-256 hash of `content/posts/day100.md` before and after the edit. The hashes must match.

- [ ] **Step 4: Add permanent redirects**

Create or extend `static/_redirects` with the three rules from Step 1. If the merged branch already has redirects, append these rules without changing unrelated behavior.

- [ ] **Step 5: Repair the known broken references with `relref`**

Use these content-file destinations:

- Day 66: `posts/day-65-becoming-a-memory-plumber-a-tale-of-memory-leak-and-how-to-find-them.md`
- Day 95: `posts/day95-part1.md`
- Day 96: `posts/day96-part2.md`
- Day 97: `posts/day97-part3.md`
- Day 98: `posts/day-98.md`
- Published Spliterator investigation: `posts/day100-spliterator.md`

Replace the broken links in the capstone, Days 95 to 97, and Day 99 with Hugo `relref` shortcodes. Do not edit ignored `content/posts/day100.md`.

- [ ] **Step 6: Add a generated same-origin link audit**

Extend `tests/blog-improvement-smoke.ps1` with a generated-output function that:

1. Loads each `public/**/*.html` file.
2. Extracts root-relative `href` values.
3. Removes query strings and fragments.
4. Skips the three Netlify-only redirect sources.
5. Maps `/path/` to `public/path/index.html` and `/file.ext` to `public/file.ext`.
6. Throws with the source file and target when the mapped file does not exist.

Use `[regex]::Matches($html, 'href=["''](?<href>/[^"''#?]*)')` for extraction. Keep the function in the test file so reviewers can rerun it.

- [ ] **Step 7: Build and verify the six defects**

Run:

```powershell
pwsh -NoProfile -File scripts/build-site.ps1 -Clean
pwsh -NoProfile -File tests/blog-improvement-smoke.ps1
```

Expected: PASS, with no generated reference to the six broken destination strings from `audit.json`.

- [ ] **Step 8: Commit publishing cleanup**

```powershell
git add config.yml static/_redirects content/posts/day100-capstone.md content/posts/day95-part1.md content/posts/day96-part2.md content/posts/day97-part3.md content/posts/day99.md tests/blog-improvement-smoke.ps1
git commit -m "fix: retire draft pages and repair internal routes"
```

### Task 9: Put reader paths before the Java graph

**Files:**

- Modify: `content/java-knowledge-graph.md`
- Modify: `layouts/knowledge-graph/single.html`
- Modify: `static/css/java-graph.css`
- Modify: `tests/blog-improvement-smoke.ps1`

**Interfaces:**

- Preserves: `static/js/java-graph.js` search and filtering contracts
- Preserves: graph JSON output and fallback list
- Produces: a reader-first introduction before graph controls

- [ ] **Step 1: Add failing atlas assertions**

Add source tests for the title `Java Learning Atlas`, the three path labels, `Day 100 retrospective`, and `Spliterator investigation`. Add generated tests for both `public/java/100daysofjava/graph/index.html` and `public/java/100daysofjava/graph/index.json`.

Parse the generated JSON and pin the audit baseline:

```powershell
$atlasJson = Get-Content -Raw -LiteralPath (Join-Path $PublicDir 'java/100daysofjava/graph/index.json') | ConvertFrom-Json
Assert-True ($atlasJson.meta.nodeCount -eq 101) "Expected 101 atlas nodes, got $($atlasJson.meta.nodeCount)."
Assert-True ($atlasJson.meta.edgeCount -eq 212) "Expected 212 atlas edges, got $($atlasJson.meta.edgeCount)."
Assert-True ($atlasJson.nodes.Count -eq 101) 'Atlas node metadata does not match the node array.'
Assert-True ($atlasJson.edges.Count -eq 212) 'Atlas edge metadata does not match the edge array.'
```

- [ ] **Step 2: Run the source test and verify failure**

Expected: FAIL because the content title is still `100DaysOfJava showing in Graph`.

- [ ] **Step 3: Rewrite the content introduction**

Set the title to `Java Learning Atlas`. Keep the current URL, type, outputs, and description. Add three short path links before the graph and this clarification:

```markdown
The collection has two Day 100 entries. The retrospective looks back at the full project. The Spliterator investigation is the final performance experiment.
```

- [ ] **Step 4: Move implementation details below the controls**

In `layouts/knowledge-graph/single.html`, render the new reading paths and controls before the explanation of nodes and edges. Put the technical explanation in a native `<details>` element labeled `How the atlas is assembled`.

Do not rename IDs or classes consumed by `static/js/java-graph.js`. Do not change JSON generation, the fallback list loop, topic values, or search input names.

- [ ] **Step 5: Add the small-screen atlas spacing**

In `static/css/java-graph.css`, keep controls within the viewport at 390 pixels and place the topic list before the canvas where the existing DOM permits it. Do not hide the fallback list.

- [ ] **Step 6: Build, exercise, and commit**

Run the build and smoke test. In a browser, search for `memory` and confirm the graph still narrows. Select one topic and confirm both nodes and edges update. Then commit:

```powershell
git add content/java-knowledge-graph.md layouts/knowledge-graph/single.html static/css/java-graph.css tests/blog-improvement-smoke.ps1
git commit -m "feat: add reader paths to the Java Learning Atlas"
```

### Task 10: Refresh the featured articles and correct the Spliterator context

**Files:**

- Modify: `content/posts/day99.md`
- Modify: `content/posts/day88.md`
- Modify: `content/posts/day-65-becoming-a-memory-plumber-a-tale-of-memory-leak-and-how-to-find-them.md`
- Modify: `content/posts/day100-capstone.md`
- Modify: `content/posts/day100-spliterator.md`
- Modify: `tests/blog-improvement-smoke.ps1`

**Interfaces:**

- Preserves: every current published URL
- Produces: topic-first titles, explicit series labels, test context, and limitations

- [ ] **Step 1: Add failing editorial guard tests**

Add assertions that:

- `day100-spliterator.md` mentions `JDK-8280915`, `fixed in JDK 19`, the tested JDK, and a limitations heading.
- `day100-spliterator.md` omits `the JDK gets wrong` and `The default Stream API optimizes for the wrong thing`.
- `day99.md` omits `95% of applications` and contains a test-context heading.
- All five files have `seriesLabel` where a day number applies.
- All five titles lead with the topic rather than `Day NN:`.

- [ ] **Step 2: Run the source test and verify failure**

Expected: FAIL on the JDK 19 context and the broad Day 99 percentage claim.

- [ ] **Step 3: Correct the Spliterator opening**

Replace the universal JDK claim near the opening with this version note:

```markdown
> **Version context.** OpenJDK fixed the unknown-size splitting defect tracked as [JDK-8280915](https://bugs.openjdk.org/browse/JDK-8280915) in JDK 19. This article examines the runtime and workload recorded below. The measurements do not show that every current JDK or every parallel stream has the historical defect.
```

Name the exact JDK from the article's repository or run artifacts. If the repository does not preserve it, state that the original result lacks enough version evidence and remove claims that depend on a current JDK.

- [ ] **Step 4: Tighten Day 99 around its recorded experiment**

Move the repository, machine details, JDK requirement, commands, and sample-run limitations ahead of general recommendations. Replace the fixed percentage recommendation with:

```markdown
For request handlers that spend most of their time waiting on blocking I/O, virtual threads are a reasonable first model to test. Event loops remain useful when connection density, memory, or control over I/O scheduling dominates the design. Measure the real workload before choosing.
```

- [ ] **Step 5: Edit Day 88, Day 66, and the capstone**

Apply the requested technical-writing and unslop rules. Keep first-person observations that the evidence supports. Remove dramatic claims, fake dialogue, and production details that lack a source. Add a short limitations section to each featured investigation.

Use these topic-first titles:

- `Virtual threads and event loops solve different problems`
- `Building production audio transcription with Gemini 1.5 and Spring Boot`
- `Finding a Java memory leak with heap dumps and JMX`
- `What 100DaysOfJava changed in how I investigate systems`
- `Why parallel file processing left CPU cores idle`

Keep day numbers in `seriesLabel`, not in the titles.

- [ ] **Step 6: Run editorial and build checks**

Run the smoke test in source mode, then build and rerun it against `public/`. Inspect the generated opening of each article and its homepage card.

- [ ] **Step 7: Commit the article refresh**

```powershell
git add content/posts/day99.md content/posts/day88.md content/posts/day-65-becoming-a-memory-plumber-a-tale-of-memory-leak-and-how-to-find-them.md content/posts/day100-capstone.md content/posts/day100-spliterator.md tests/blog-improvement-smoke.ps1
git commit -m "docs: refresh the featured technical investigations"
```

### Task 11: Run full artifact and browser verification

**Files:**

- Modify only if verification finds a defect
- Verify: `public/`
- Verify: `static/resume.pdf`
- Verify: repository diff and user-owned files

**Interfaces:**

- Consumes: all previous tasks
- Produces: fresh build, test, PDF, link, and browser evidence

- [ ] **Step 1: Run every repository smoke test**

Run:

```powershell
Get-ChildItem tests -Filter '*.ps1' | ForEach-Object {
    pwsh -NoProfile -File $_.FullName
    if ($LASTEXITCODE -ne 0) { throw "Test failed: $($_.Name)" }
}
```

If an older test expects the retired Projects placeholder or old menu, update that test only when the new behavior in the spec replaces it.

- [ ] **Step 2: Run a fresh production build and final smoke check**

Run:

```powershell
pwsh -NoProfile -File scripts/build-site.ps1 -Clean
pwsh -NoProfile -File tests/blog-improvement-smoke.ps1 -PublicDir public
```

Expected: both commands exit 0 with no Hugo warnings about duplicate routes, missing layouts, or unresolved page references.

- [ ] **Step 3: Inspect the generated site at desktop width**

Serve `public/` on localhost and inspect:

- `/`
- `/about/`
- `/case-studies/`
- `/resume/`
- One featured article
- `/java/100daysofjava/graph/`

Check heading order, focus states, dark mode, newsletter duplication, social-image metadata, and footer links.

- [ ] **Step 4: Inspect the same paths at 390 pixels**

Set the browser viewport to 390 pixels wide. Confirm that the page has no sideways scrolling, all four menu items remain usable, homepage actions remain visible, cards stack, long links wrap, and article contents do not consume the entire first screen.

- [ ] **Step 5: Exercise the atlas**

Search for `memory`, select a topic, clear the filter, and open one article from the fallback list. Confirm that the controls update the graph and do not hide the static list.

- [ ] **Step 6: Reinspect the PDF**

Render `static/resume.pdf` again from the final tree and inspect both pages. Check that the PDF has two pages and that the generated `public/resume.pdf` hash matches it.

- [ ] **Step 7: Prove that local work remains intact**

Run:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath content/posts/day100.md
Compare-Object (Get-Content -LiteralPath (Join-Path $env:TEMP 'personal-blog-improvement-backup/day100.md')) (Get-Content -LiteralPath content/posts/day100.md)
git diff --check
git status --short
git log --oneline --decorate -12
```

Expected: the draft comparison prints nothing, `git diff --check` exits 0, and only intentional user-owned untracked files remain outside commits.

- [ ] **Step 8: Review the final diff against the spec**

Read `docs/superpowers/specs/2026-09-19-blog-improvement-design.md` from top to bottom. For each acceptance criterion, point to the generated page or command output that proves it. Do not claim live-site verification or deployment.

- [ ] **Step 9: Commit verification-only fixes**

If browser or artifact checks required changes, stage only those files and commit:

```powershell
git add --patch
git commit -m "fix: resolve final portfolio verification issues"
```

If verification required no changes, do not create an empty commit.
