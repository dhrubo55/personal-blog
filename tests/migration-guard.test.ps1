$ErrorActionPreference = "Stop"

function Assert-Contains {
    param(
        [string]$Content,
        [string]$Pattern,
        [string]$Message
    )

    if ($Content -notmatch $Pattern) {
        throw $Message
    }
}

$root = Split-Path -Parent $PSScriptRoot

$config = Get-Content (Join-Path $root "config.yml") -Raw
$netlify = Get-Content (Join-Path $root "netlify.toml") -Raw
$workflow = Get-Content (Join-Path $root ".github/workflows/build.yml") -Raw

Assert-Contains $netlify 'HUGO_VERSION\s*=\s*"0\.146\.7"' "Netlify must build with Hugo 0.146.7."
Assert-Contains $workflow 'hugo-version:\s*"0\.146\.7"' "GitHub Actions must build with Hugo 0.146.7."
Assert-Contains $config "ShowCodeCopyButtons:\s*true" "PaperMod code-copy buttons must stay enabled."
Assert-Contains $config "(?ms)footer:.*text:" "PaperMod footer text must be configured through params.footer.text, not a stale footer override."

foreach ($removedOverride in @(
    "layouts/_default/baseof.html",
    "layouts/_default/list.atom.xml",
    "layouts/_default/rss.xml",
    "layouts/_default/single.html",
    "layouts/partials/extend_head.html",
    "layouts/partials/footer.html"
)) {
    $path = Join-Path $root $removedOverride
    if (Test-Path $path) {
        throw "Stale full-template override must not exist: $removedOverride"
    }
}

foreach ($requiredPath in @(
    "layouts/_partials/extend_footer.html",
    "layouts/_partials/extend_head.html",
    "layouts/_partials/extend_post_content.html",
    "layouts/_shortcodes/blockquote.html",
    "layouts/rss.xml",
    "layouts/list.atom.xml"
)) {
    $path = Join-Path $root $requiredPath
    if (-not (Test-Path $path)) {
        throw "Required migration file is missing: $requiredPath"
    }
}

$postHook = Get-Content (Join-Path $root "layouts/_partials/extend_post_content.html") -Raw
Assert-Contains $postHook 'partial "form.html"' "Post content extension hook must preserve the posts feedback form."

$footerExtension = Get-Content (Join-Path $root "layouts/_partials/extend_footer.html") -Raw
Assert-Contains $footerExtension 'twitter-analytics\.html' "Footer extension must preserve Twitter analytics."

$shortcode = Get-Content (Join-Path $root "layouts/_shortcodes/blockquote.html") -Raw
Assert-Contains $shortcode "<blockquote>" "Blockquote shortcode compatibility shim must render blockquote markup."

$homePage = Get-Content (Join-Path $root "public/index.html") -Raw
Assert-Contains $homePage "googletagmanager\.com/gtag/js" "Generated home page must include Google Analytics."
Assert-Contains $homePage "pagead2\.googlesyndication\.com/pagead/js/adsbygoogle\.js" "Generated home page must include AdSense."
Assert-Contains $homePage "static\.ads-twitter\.com/uwt\.js" "Generated home page must include Twitter analytics."
Assert-Contains $homePage "application/rss\+xml" "Generated home page must advertise RSS."
Assert-Contains $homePage "application/atom\+xml" "Generated home page must advertise Atom."
if ($homePage -match '<article class="first-entry home-info".*?<li>\s*</li>') {
    throw "Homepage intro must not render empty bullet items."
}

$post = Get-ChildItem (Join-Path $root "public/posts") -Recurse -Filter "index.html" |
    Where-Object { (Get-Content $_.FullName -Raw) -match "<pre" } |
    Select-Object -First 1

if (-not $post) {
    throw "Expected at least one generated post with code blocks."
}

$postHtml = Get-Content $post.FullName -Raw
Assert-Contains $postHtml 'copy-code' "Generated code posts must include PaperMod copy-code buttons."
Assert-Contains $postHtml 'paginav' "Generated posts must include PaperMod post navigation."
