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
$configPath = Join-Path $root "config.yml"
$atomTemplatePath = Join-Path $root "layouts/list.atom.xml"
$rssTemplatePath = Join-Path $root "layouts/rss.xml"
$headPath = Join-Path $root "layouts/_partials/extend_head.html"

$config = Get-Content $configPath -Raw

Assert-Contains $config "(?m)^mediaTypes:" "config.yml must declare custom media types."
Assert-Contains $config "(?ms)^pagination:.*pagerSize:\s*5" "config.yml must use pagination.pagerSize instead of removed paginate."
if ($config -match "(?m)^paginate:") {
    throw "config.yml must not use the removed Hugo paginate key."
}
Assert-Contains $config "(?ms)application/atom\+xml:.*suffixes:.*-\s*xml" "config.yml must declare the application/atom+xml media type with an xml suffix."
Assert-Contains $config "(?m)^outputFormats:" "config.yml must define custom output formats."
Assert-Contains $config "(?ms)ATOM:.*mediaType:\s*application/atom\+xml" "config.yml must define an ATOM output format with the Atom media type."
Assert-Contains $config "(?ms)ATOM:.*baseName:\s*atom" "config.yml must emit Atom feeds as atom.xml."

foreach ($scope in @("home", "section", "taxonomy", "term")) {
    Assert-Contains $config "(?ms)^outputs:.*${scope}:\s*\[[^\]]*HTML[^\]]*RSS[^\]]*ATOM[^\]]*\]" "config.yml must enable HTML, RSS, and ATOM for $scope pages."
}

if (-not (Test-Path $atomTemplatePath)) {
    throw "layouts/list.atom.xml must exist."
}

if (-not (Test-Path $rssTemplatePath)) {
    throw "layouts/rss.xml must exist."
}

$atomTemplate = Get-Content $atomTemplatePath -Raw
Assert-Contains $atomTemplate "<feed xmlns=`"http://www\.w3\.org/2005/Atom`">" "Atom template must declare the Atom namespace."
Assert-Contains $atomTemplate '{{- range \$pages' "Atom template must iterate over feed pages."
Assert-Contains $atomTemplate '{{- \$pages = where \$pages "Title" "!=" "" -}}' "Atom template must skip pages with blank titles."
Assert-Contains $atomTemplate '{{- \$pages = where \$pages "Date.IsZero" false -}}' "Atom template must skip pages with zero dates."
Assert-Contains $atomTemplate "<entry>" "Atom template must render entries."
Assert-Contains $atomTemplate "application/atom\+xml" "Atom template must self-link using the Atom media type."

$rssTemplate = Get-Content $rssTemplatePath -Raw
Assert-Contains $rssTemplate "<rss version=`"2\.0`" xmlns:atom=`"http://www\.w3\.org/2005/Atom`" xmlns:content=`"http://purl\.org/rss/1\.0/modules/content/`">" "RSS template must render RSS 2.0 with Atom self-link and content namespace support."
Assert-Contains $rssTemplate '\$pages = where \$pages "Title" "!=" ""' "RSS template must skip pages with blank titles."
Assert-Contains $rssTemplate '\$pages = where \$pages "Date.IsZero" false' "RSS template must skip pages with zero dates."
Assert-Contains $rssTemplate "<title>{{ \.Title }}</title>" "RSS template must render item titles from page titles."
Assert-Contains $rssTemplate "\.PublishDate\.Format `"Mon, 02 Jan 2006 15:04:05 -0700`"" "RSS template must render item publication dates only after validating the date."
if ($rssTemplate -match "<image>") {
    throw "RSS template must not emit a channel image block unless it can provide a valid image title and channel link."
}

$head = Get-Content $headPath -Raw
Assert-Contains $head "application/rss\+xml" "Head partial must advertise RSS feeds."
Assert-Contains $head "application/atom\+xml" "Head partial must advertise Atom feeds."
if ($head -match "highlight\.js") {
    throw "Head partial must not load Highlight.js when PaperMod code-copy support uses Chroma output."
}
