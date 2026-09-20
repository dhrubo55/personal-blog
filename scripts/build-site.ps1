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
