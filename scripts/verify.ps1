$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$localHugo = Join-Path $root ".tools/hugo-0.146.7/hugo.exe"

if (Test-Path $localHugo) {
    $hugo = $localHugo
} else {
    $hugo = "hugo"
}

$verifyToolDir = Join-Path $root ".tools"
New-Item -ItemType Directory -Force -Path $verifyToolDir | Out-Null
$env:HUGO_CACHEDIR = Join-Path $verifyToolDir "hugo-cache"
New-Item -ItemType Directory -Force -Path $env:HUGO_CACHEDIR | Out-Null

$verifyGitConfig = Join-Path $verifyToolDir "verify.gitconfig"
$safeDirectory = $root -replace "\\", "/"
Set-Content -LiteralPath $verifyGitConfig -Value "[safe]`n`t directory = $safeDirectory`n" -NoNewline
$env:GIT_CONFIG_GLOBAL = $verifyGitConfig

& $hugo version
if ($LASTEXITCODE -ne 0) {
    throw "Hugo version command failed with exit code $LASTEXITCODE."
}

& $hugo --gc --minify --enableGitInfo
if ($LASTEXITCODE -ne 0) {
    throw "Hugo build failed with exit code $LASTEXITCODE."
}

& pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "tests/feed-config.test.ps1")
if ($LASTEXITCODE -ne 0) {
    throw "Feed config test failed with exit code $LASTEXITCODE."
}

& pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "tests/feed-output.test.ps1")
if ($LASTEXITCODE -ne 0) {
    throw "Feed output test failed with exit code $LASTEXITCODE."
}

& pwsh -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "tests/migration-guard.test.ps1")
if ($LASTEXITCODE -ne 0) {
    throw "Migration guard test failed with exit code $LASTEXITCODE."
}
