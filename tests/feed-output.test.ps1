$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$rssPath = Join-Path $root "public/index.xml"
$atomPath = Join-Path $root "public/atom.xml"

foreach ($path in @($rssPath, $atomPath)) {
    if (-not (Test-Path $path)) {
        throw "Expected generated feed at $path. Run Hugo before this test."
    }

    [xml](Get-Content $path -Raw) | Out-Null
}

$rss = Get-Content $rssPath -Raw
$atom = Get-Content $atomPath -Raw

if ($rss -match "<image>") {
    throw "RSS feed must not emit the invalid channel image block."
}

foreach ($badPattern in @("<title></title>", "Mon, 01 Jan 0001", "profile-pic.jpg")) {
    if ($rss -match [regex]::Escape($badPattern)) {
        throw "RSS feed contains invalid validator pattern: $badPattern"
    }
}

if ($rss -notmatch "<item>") {
    throw "RSS feed must contain feed items."
}

foreach ($badPattern in @("<title></title>", "0001-01-01")) {
    if ($atom -match [regex]::Escape($badPattern)) {
        throw "Atom feed contains invalid validator pattern: $badPattern"
    }
}

if ($atom -notmatch "<entry>") {
    throw "Atom feed must contain feed entries."
}
