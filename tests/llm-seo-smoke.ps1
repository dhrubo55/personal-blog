$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$config = Join-Path $root 'config.yml'
$llms = Join-Path $root 'layouts/llms.txt'
$schema = Join-Path $root 'layouts/_partials/templates/schema_json.html'
$robots = Join-Path $root 'layouts/robots.txt'
$head = Join-Path $root 'layouts/_partials/extend_head.html'
$footerConfig = Join-Path $root 'config.yml'

function Assert-FileContains {
    param(
        [string] $Path,
        [string] $Pattern,
        [string] $Message
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Missing file: $Path"
    }

    if (-not (Select-String -LiteralPath $Path -Pattern $Pattern -Quiet)) {
        throw $Message
    }
}

Assert-FileContains $config 'LLMS:' 'LLMS output format is missing.'
Assert-FileContains $config 'home: \[HTML, RSS, ATOM, LLMS\]' 'Home output does not include LLMS.'
Assert-FileContains $config 'publisherType: Person' 'Person schema config is missing.'
Assert-FileContains $config 'author: Mohibul Hassan Chowdhury' 'Author config is missing.'
Assert-FileContains $llms '^# \{\{ site\.Title \}\}' 'LLMS template title is missing.'
Assert-FileContains $llms '## Articles' 'LLMS template does not list articles.'
Assert-FileContains $schema '"Person"' 'Schema template does not emit Person data.'
Assert-FileContains $schema '"BlogPosting"' 'Schema template does not emit BlogPosting data.'
Assert-FileContains $schema 'jsonify \| safeJS' 'Schema JSON-LD is not marked safe for script output.'
Assert-FileContains $robots 'Allow: /llms\.txt' 'robots.txt does not expose llms.txt.'
Assert-FileContains $head 'type="text/plain".*llms\.txt' 'Head does not advertise llms.txt.'
Assert-FileContains $footerConfig '/terms-of-service-agreement/' 'Footer terms URL points at a non-canonical path.'
Assert-FileContains $footerConfig 'All rights reserved' 'Footer copyright does not protect original writing.'
if (Select-String -LiteralPath $footerConfig -Pattern 'open-sourced|CC BY-NC' -Quiet) {
    throw 'Footer still says the site or articles are openly licensed.'
}
$staleIdentityPattern = '[Ss]omraj|[Jj]armos'
$staleIdentityFiles = @(
    Get-ChildItem -LiteralPath (Join-Path $root 'content') -Recurse -File
    Get-Item -LiteralPath (Join-Path $root 'README.md')
    Get-Item -LiteralPath (Join-Path $root 'config.yml')
) | Where-Object { Select-String -LiteralPath $_.FullName -Pattern $staleIdentityPattern -Quiet }
if ($staleIdentityFiles) {
    throw 'Stale previous-owner identity references remain in content.'
}
Assert-FileContains $llms 'All rights reserved' 'LLMS template does not include a rights notice.'
Assert-FileContains (Join-Path $root 'content/collaborations.md') 'robotsNoIndex: true' 'Stale collaborations page is still indexable.'
Assert-FileContains (Join-Path $root 'content/projects.md') 'robotsNoIndex: true' 'Stale projects page is still indexable.'
Assert-FileContains (Join-Path $root 'content/privacy-policy.md') 'robotsNoIndex: true' 'Stale privacy page is still indexable.'
Assert-FileContains (Join-Path $root 'content/terms-and-conditions.md') 'robotsNoIndex: true' 'Stale terms page is still indexable.'

Write-Host 'LLM SEO smoke test passed.'
