# Blog improvement design

## Purpose

This release positions Mohibul Hassan Chowdhury as a senior engineer who investigates production systems. The site must help employers and consulting clients assess his work, while giving technical readers a clear path into the blog and the Chaos;Code;Clarity newsletter.

The release keeps Hugo, PaperMod, Netlify, and the Java Learning Atlas. It does not replace the publishing stack or redesign the article template from scratch.

## Sources of truth

Use these sources in this order:

1. The supplied two-page resume at `C:/Users/msi/Downloads/DOC-20260822-WA0034.pdf` for current role, experience, and claims.
2. The user's edit in `static/resume.tex`, which changes the summary to 7+ years.
3. Existing published articles for educational experiments and their measured results.
4. `HANDOFF.md`, the audit report, and `audit.json` for observed site defects.

Do not turn an employer's platform metrics into a claim that Mohibul personally created or operated the whole platform. Label cost and storage savings as estimates. Do not add incident details, benchmark results, or production use that the sources do not support.

## Repository safety

The starting checkout is behind `origin/master`. It also contains these user-owned changes:

- Modified `static/resume.tex`
- Untracked `content/posts/day100.md`
- Untracked `HANDOFF.md`

Preserve all three. Record the SHA-256 hash of `content/posts/day100.md` before reconciliation and confirm the same hash afterward. Merge the current remote history before editing shared files.

Do not deploy the site, push a branch, publish a newsletter issue, or send an external message as part of this release.

## Public positioning

The homepage opens with this message:

> I build reliable backend and AI systems.
>
> I'm Mohibul Hassan, a Senior Software Engineer II working with Java, distributed systems, and production AI. I write about debugging failures, measuring performance, and the decisions behind reliable software.

The homepage gives readers four direct actions:

- Read selected work.
- Browse technical writing.
- Download the resume.
- Subscribe to Chaos;Code;Clarity.

The site must not promise a newsletter cadence. The newsletter copy states the subject matter and links to `https://chaoscodeclarity.substack.com/subscribe`.

## Information architecture

The primary menu contains four items in this order:

1. Writing
2. Case studies
3. About
4. Newsletter

The homepage and About page keep the resume and contact routes visible. The footer contains Resume, RSS, Support, Terms, and Privacy.

The homepage includes a compact "Start here" section with these paths:

- Debug a Java service
- Understand concurrency
- Build reliable AI workflows

The section links to existing articles and the Java Learning Atlas. It does not duplicate the full archive.

## Homepage implementation

Override PaperMod's `home_info.html` partial instead of copying the whole home template. The local partial renders:

- The positioning statement
- Action links
- Three selected-writing cards
- Three "Start here" paths
- The existing social icons

Mark featured articles in front matter with `featured: true`, `featuredOrder`, and `seriesLabel`. The homepage reads those fields from Hugo pages. The content remains the source of the title, summary, and URL.

Add site-specific styles in `assets/css/extended/portfolio.css`. Keep PaperMod's typography, color variables, and dark mode behavior. At a 390-pixel viewport, the menu and action links must not create horizontal page scrolling.

## About page

Replace the tool inventory with evidence and responsibility. The page includes:

- Current role and 7+ years of experience
- Java, distributed systems, production AI, and reliability focus
- A short career timeline for Cefalo, Brain Station 23, and Welldev
- Links to the selected-work page, technical writing, GitHub, LinkedIn, email, resume, and newsletter
- A direct statement that Mohibul welcomes senior engineering roles, architecture discussions, and consulting conversations

Remove the "amateur technical writer" wording and the escaped reference definitions.

## Selected work

Publish `/case-studies/` and retain `/projects/` as a permanent redirect or Hugo alias.

The page contains three entries:

### Production call intelligence

Use only the attached resume's documented scope:

- Google Vertex AI and Gemini transcription for call recordings
- Single and batch processing
- Multilingual prompting
- Credential management
- Confidence-based evaluation
- Failure handling across backend and administration workflows
- Transcript-derived summaries with revision-aware staleness
- Append-only lifecycle state, retries, feature flags, and notifications
- Model and provider reliability evaluation
- Bring-your-own-key pricing trade-offs

State Mohibul's role as architecture and implementation work. Do not name a customer or disclose private data.

### Database cleanup and migration

Use these qualified facts:

- Analysis of approximately 68 million records and cross-system dependencies
- Removal of 8 write triggers and 4 unused tables
- Elimination of approximately 1.8 million unnecessary writes per month
- Reclamation of an estimated 50 to 100 GB on affected database instances
- Contribution to an estimated USD 600 to 1,200 in annual infrastructure savings

Describe the migration in terms of dependency analysis, sequencing, validation, rollback safeguards, and measured results. Do not invent the original defect or an outage.

### Concurrency investigation

Label Day 99 as a technical investigation, not production experience. Link to its public repository, machine details, commands, and stated limitations.

## Resume

Update `static/resume.tex` to match the supplied two-page resume. Preserve the 7+ years statement. The public PDF must be the supplied current PDF or a locally compiled byte-equivalent representation of that content.

The generated PDF must have two letter-sized pages. Render both pages to PNG and inspect them for clipping, overlap, unreadable text, broken glyphs, and inconsistent spacing.

Turn `/resume/` into an HTML landing page with a short summary, a PDF download link, contact links, and a link to selected work.

## Newsletter routes

Create `layouts/partials/newsletter_cta.html` and include it in:

- The homepage
- The About page
- The end of published posts through `layouts/_partials/extend_post_content.html`

The article-ending invitation appears once. It must not render on the resume, case studies, legal pages, or the Java Learning Atlas.

## Social metadata

Create a deterministic 1200 by 630 PNG at `static/images/social/default.png`. The card contains Mohibul's name and the phrase "Java, distributed systems, production AI, and reliability." Use the site's existing neutral palette and verify the image dimensions.

Set the site default image to `/images/social/default.png`. Featured articles may use the same default in this release. Do not block the release on unique illustrated cards.

## Published-page cleanup

Keep the user's untracked `content/posts/day100.md` byte-for-byte unchanged. Exclude it from Hugo builds through `ignoreFiles`. Also exclude the tracked duplicate at `content/day100.md` so `/day100/` can redirect to the published retrospective.

Exclude the personal writing guide at `content/posts/mohibul-writing-guide.md` from Hugo builds. Add explicit Netlify redirects:

- `/day100/` to the published Day 100 retrospective
- `/posts/mohibul-writing-guide/` to `/about/`
- `/projects/` to `/case-studies/`

Use permanent redirects. Keep the existing thirty `/posts/posts/` article URLs in this release. Their shape alone is not enough reason to migrate them.

Fix the six broken internal destinations recorded in `audit.json`. Prefer Hugo `relref` shortcodes when the destination is another content file.

## Java Learning Atlas

Rename the public heading to "Java Learning Atlas". Put the three reading paths before the graph controls. Move the explanation of nodes, edges, and source data below the controls or into a details block.

Preserve all existing graph behavior:

- 101 nodes and 212 edges at the audit baseline
- Search
- Topic filtering
- Static fallback list
- JSON output

Explain that Day 100 has a retrospective and a separate Spliterator investigation.

## Featured article edits

Refresh these published articles without changing their established URLs:

- Day 99 virtual threads and event loops
- Day 88 production audio transcription
- Day 66 memory leak investigation
- Day 100 retrospective
- Day 100 Spliterator investigation

Use topic-first titles and keep the day number in `seriesLabel`. Add tested dates, versions, repository links, commands, and limitations only when the source already supports them.

The Spliterator article must state near the opening that OpenJDK fixed JDK-8280915 in JDK 19. It must distinguish that historical unknown-size splitting defect from any imbalance observed in the article's runtime and workload. Remove claims that the current JDK universally "gets it wrong."

The Day 99 article must not claim that one concurrency model wins for a fixed percentage of applications. Keep the measured sample run tied to its machine, workload, and repository.

## Deployment configuration

Keep Netlify as the production path. `netlify.toml` remains pinned to Hugo Extended 0.146.7. The `dev-to-publish.yml` workflow targets a different branch and is not the site deployment path. Do not change deployment configuration unless the current remote history requires a merge resolution.

## Verification

Add a repeatable PowerShell smoke test and a local build script. The checks cover:

- Hugo version 0.146.7
- Successful production build
- Default social image existence, dimensions, and generated metadata
- Required homepage copy and links
- Four-item primary menu
- Newsletter destinations
- HTML resume page and two-page PDF
- Selected-work page and `/projects/` redirect
- Retired-page redirects and sitemap exclusion
- Six repaired internal references
- No unintended `/day100/` or writing-guide sitemap entries
- Java Learning Atlas HTML and JSON outputs
- No broken same-origin links in generated HTML

Review the generated site at desktop width and 390 pixels. Check the homepage, About, case studies, resume, one featured article, and the Java Learning Atlas. Verify the atlas search and topic controls in a browser.

After a later authorized deployment, rerun the relevant crawler checks against the live URL. Live verification is not part of this local release.

## Acceptance criteria

The release is ready for review when all of these statements are true:

- The current remote history and the user's local work both remain present.
- The homepage explains Mohibul's specialty in its first screen at desktop and mobile widths.
- Employers can reach selected work, the resume, and contact details without searching the archive.
- Readers can reach Chaos;Code;Clarity from the homepage, About page, and article endings.
- The public resume content matches the supplied current resume.
- The default social image resolves in generated metadata.
- The six known internal 404 destinations are gone from generated pages.
- Draft-like pages do not enter the sitemap.
- Existing article URLs and Java Learning Atlas behavior remain intact.
- The build, smoke tests, PDF inspection, and browser checks have fresh recorded evidence.
