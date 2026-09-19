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

$homePartial = Join-Path $root 'layouts/_partials/home_info.html'
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

if (-not $SourceOnly) {
    Assert-True (Test-Path -LiteralPath $PublicDir) "Generated site not found: $PublicDir"
    $homeHtml = Join-Path $PublicDir 'index.html'
    Assert-FileContains $homeHtml 'https://mohibulsblog\.netlify\.app/images/social/default\.png' 'Generated social metadata does not use the default card.'
    Assert-FileOmits $homeHtml '/profile-pic\.jpg' 'Generated social metadata still points to the missing profile image.'
    $featuredCardCount = ([regex]::Matches((Get-Content -Raw -LiteralPath $homeHtml), 'class=(?:"featured-card"|featured-card)')).Count
    Assert-True ($featuredCardCount -eq 3) "Expected 3 featured cards, got $featuredCardCount."
}

Write-Host 'Blog improvement smoke test passed.'
