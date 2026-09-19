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

$about = Join-Path $root 'content/about.md'
$newsletter = Join-Path $root 'layouts/_partials/newsletter_cta.html'
$newsletterShortcode = Join-Path $root 'layouts/_shortcodes/newsletter.html'
$postHook = Join-Path $root 'layouts/_partials/extend_post_content.html'
Assert-FileContains $about 'Senior Software Engineer II' 'The About page does not state the current role.'
Assert-FileContains $about '7\+ years' 'The About page does not state current experience.'
Assert-FileContains $about 'senior engineering roles' 'The About page does not name the work Mohibul welcomes.'
Assert-FileOmits $about 'amateur Technical Writer' 'The About page still understates the writing work.'
Assert-FileOmits $about '^\\\[Twitter\\\]:' 'Escaped reference definitions remain visible.'
Assert-FileContains $newsletter 'chaoscodeclarity\.substack\.com/subscribe' 'The newsletter call to action has the wrong destination.'
Assert-FileContains $newsletterShortcode 'partial "newsletter_cta\.html" \.Page' 'The About-page newsletter shortcode does not reuse the shared partial.'
Assert-FileContains $postHook 'eq \.Type "posts"' 'The article hook does not limit the newsletter invitation to posts.'
Assert-FileContains $postHook 'partial "newsletter_cta\.html"' 'Published posts do not include the newsletter invitation.'

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

$resumeTex = Join-Path $root 'static/resume.tex'
Assert-FileContains $resumeTex 'Senior Software Engineer II with 7\+ years' 'The resume summary is not current.'
Assert-FileContains $resumeTex 'approximately 68M records' 'The current database evidence is missing.'
Assert-FileContains $resumeTex 'approximately 1\.8M unnecessary writes/month' 'The current write-reduction evidence is missing.'
Assert-FileContains $resumeTex 'revision-aware staleness' 'The conversation-intelligence work is missing.'
Assert-FileContains $resumeTex 'subject-matter expert for telephony and production reliability' 'The reliability work is missing.'

$redirects = Join-Path $root 'static/_redirects'
Assert-FileContains $config "^ignoreFiles:$" 'The ignored source-file list is missing.'
Assert-FileContains $config "^  - 'content/day100\\\.md\$'$" 'The root Day 100 page is not ignored.'
Assert-FileContains $config "^  - 'content/posts/day100\\\.md\$'$" 'The user Day 100 draft is not ignored.'
Assert-FileContains $config "^  - 'content/posts/mohibul-writing-guide\\\.md\$'$" 'The writing guide is not ignored.'
Assert-FileContains $redirects '^/day100/ /posts/posts/java/100daysofjava/day100-capstone\.md/ 301$' 'The retired Day 100 route is not redirected.'
Assert-FileContains $redirects '^/posts/mohibul-writing-guide/ /about/ 301$' 'The writing guide route is not redirected.'
Assert-FileContains $redirects '^/projects/ /case-studies/ 301$' 'The Projects route is not redirected.'

$atlasContent = Join-Path $root 'content/java-knowledge-graph.md'
Assert-FileContains $atlasContent 'title = "Java Learning Atlas"' 'The atlas title is not reader-facing.'
Assert-FileContains $atlasContent 'Debug a Java service' 'The Java debugging path is missing.'
Assert-FileContains $atlasContent 'Understand concurrency' 'The concurrency path is missing.'
Assert-FileContains $atlasContent 'Build reliable AI workflows' 'The AI workflow path is missing.'
Assert-FileContains $atlasContent 'Day 100 retrospective' 'The retrospective distinction is missing.'
Assert-FileContains $atlasContent 'Spliterator investigation' 'The Spliterator distinction is missing.'

$day99 = Join-Path $root 'content/posts/day99.md'
$day88 = Join-Path $root 'content/posts/day88.md'
$day66 = Join-Path $root 'content/posts/day-65-becoming-a-memory-plumber-a-tale-of-memory-leak-and-how-to-find-them.md'
$day100Capstone = Join-Path $root 'content/posts/day100-capstone.md'
$day100Spliterator = Join-Path $root 'content/posts/day100-spliterator.md'
Assert-FileContains $day100Spliterator 'JDK-8280915' 'The Spliterator article does not identify the OpenJDK issue.'
Assert-FileContains $day100Spliterator 'fixed in JDK 19' 'The Spliterator article does not state the fix version.'
Assert-FileContains $day100Spliterator 'Tested JDK' 'The Spliterator article does not state its runtime evidence.'
Assert-FileContains $day100Spliterator '^## Limitations$' 'The Spliterator article has no limitations section.'
Assert-FileOmits $day100Spliterator 'the JDK gets wrong' 'The Spliterator article still makes a universal JDK claim.'
Assert-FileOmits $day100Spliterator 'The default Stream API optimizes for the wrong thing' 'The Spliterator conclusion still overstates the default behavior.'
Assert-FileOmits $day99 '95% of applications' 'Day 99 still contains the unsupported percentage claim.'
Assert-FileContains $day99 '^## Test context$' 'Day 99 does not put its test context up front.'

$editorialFiles = @($day99, $day88, $day66, $day100Capstone, $day100Spliterator)
foreach ($editorialFile in $editorialFiles) {
    Assert-FileContains $editorialFile '^seriesLabel = ' "Missing seriesLabel in $editorialFile"
    Assert-FileOmits $editorialFile '^title = "Day [0-9]+' "Title still leads with a day number in $editorialFile"
}

if (-not $SourceOnly) {
    Assert-True (Test-Path -LiteralPath $PublicDir) "Generated site not found: $PublicDir"
    $homeHtml = Join-Path $PublicDir 'index.html'
    Assert-FileContains $homeHtml 'https://mohibulsblog\.netlify\.app/images/social/default\.png' 'Generated social metadata does not use the default card.'
    Assert-FileOmits $homeHtml '/profile-pic\.jpg' 'Generated social metadata still points to the missing profile image.'
    $featuredCardCount = ([regex]::Matches((Get-Content -Raw -LiteralPath $homeHtml), 'class=(?:"featured-card"|featured-card)')).Count
    Assert-True ($featuredCardCount -eq 3) "Expected 3 featured cards, got $featuredCardCount."
    $aboutHtml = Join-Path $PublicDir 'about/index.html'
    $resumeHtml = Join-Path $PublicDir 'resume/index.html'
    $postHtml = Join-Path $PublicDir 'posts/posts/java/100daysofjava/day99/index.html'
    $homeNewsletterCount = ([regex]::Matches((Get-Content -Raw -LiteralPath $homeHtml), 'class=(?:"newsletter-cta"|newsletter-cta)')).Count
    $aboutNewsletterCount = ([regex]::Matches((Get-Content -Raw -LiteralPath $aboutHtml), 'class=(?:"newsletter-cta"|newsletter-cta)')).Count
    $postNewsletterCount = ([regex]::Matches((Get-Content -Raw -LiteralPath $postHtml), 'class=(?:"newsletter-cta"|newsletter-cta)')).Count
    $resumeNewsletterCount = ([regex]::Matches((Get-Content -Raw -LiteralPath $resumeHtml), 'class=(?:"newsletter-cta"|newsletter-cta)')).Count
    Assert-True ($homeNewsletterCount -eq 1) "Expected 1 homepage newsletter invitation, got $homeNewsletterCount."
    Assert-True ($aboutNewsletterCount -eq 1) "Expected 1 About newsletter invitation, got $aboutNewsletterCount."
    Assert-True ($postNewsletterCount -eq 1) "Expected 1 article newsletter invitation, got $postNewsletterCount."
    Assert-True ($resumeNewsletterCount -eq 0) "Expected no resume newsletter invitation, got $resumeNewsletterCount."
    Assert-True (Test-Path -LiteralPath (Join-Path $PublicDir 'case-studies/index.html')) 'Generated case-studies page is missing.'
    Assert-True (Test-Path -LiteralPath (Join-Path $PublicDir 'projects/index.html')) 'Generated projects alias is missing.'
    Assert-True (Test-Path -LiteralPath $resumeHtml) 'Generated resume page is missing.'
    $sitemap = Join-Path $PublicDir 'sitemap.xml'
    Assert-FileOmits $sitemap '<loc>https://mohibulsblog\.netlify\.app/day100/</loc>' 'The retired Day 100 page remains in the sitemap.'
    Assert-FileOmits $sitemap '<loc>https://mohibulsblog\.netlify\.app/posts/mohibul-writing-guide/</loc>' 'The writing guide remains in the sitemap.'

    $atlasHtmlPath = Join-Path $PublicDir 'java/100daysofjava/graph/index.html'
    $atlasJsonPath = Join-Path $PublicDir 'java/100daysofjava/graph/index.json'
    Assert-True (Test-Path -LiteralPath $atlasHtmlPath) 'Generated atlas HTML is missing.'
    Assert-True (Test-Path -LiteralPath $atlasJsonPath) 'Generated atlas JSON is missing.'
    $atlasJson = Get-Content -Raw -LiteralPath $atlasJsonPath | ConvertFrom-Json
    Assert-True ($atlasJson.meta.nodeCount -eq 101) "Expected 101 atlas nodes, got $($atlasJson.meta.nodeCount)."
    Assert-True ($atlasJson.meta.edgeCount -eq 212) "Expected 212 atlas edges, got $($atlasJson.meta.edgeCount)."
    Assert-True ($atlasJson.nodes.Count -eq 101) 'Atlas node metadata does not match the node array.'
    Assert-True ($atlasJson.edges.Count -eq 212) 'Atlas edge metadata does not match the edge array.'

    $redirectOnlyPaths = @('/day100/', '/posts/mohibul-writing-guide/', '/projects/')
    Get-ChildItem -LiteralPath $PublicDir -Recurse -Filter '*.html' | ForEach-Object {
        $sourceFile = $_.FullName
        $html = Get-Content -Raw -LiteralPath $sourceFile
        foreach ($match in [regex]::Matches($html, 'href=["''](?<href>/[^"''#?]*)')) {
            $href = $match.Groups['href'].Value
            if ($href.StartsWith('//') -or $redirectOnlyPaths -contains $href) { continue }
            if ($href -eq '/') {
                $target = Join-Path $PublicDir 'index.html'
            } elseif ($href.EndsWith('/')) {
                $target = Join-Path $PublicDir (($href.TrimStart('/') -replace '/', [IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar + 'index.html')
            } else {
                $target = Join-Path $PublicDir ($href.TrimStart('/') -replace '/', [IO.Path]::DirectorySeparatorChar)
            }
            Assert-True (Test-Path -LiteralPath $target) "Broken internal link in $sourceFile`: $href"
        }
    }
}

Write-Host 'Blog improvement smoke test passed.'
