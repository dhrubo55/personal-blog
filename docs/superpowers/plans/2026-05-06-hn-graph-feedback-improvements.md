# HN Graph Feedback Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the concrete usability, provenance, rendering, mobile, and content-accuracy issues raised in the Hacker News discussion for the 100DaysOfJava knowledge graph.

**Architecture:** Keep the existing Hugo plus Cytoscape architecture. Improve the static graph data contract first, then make the page explain the contract clearly, work without hover, and provide useful non-graph navigation. Keep a future Three.js experiment separate from the production fix because a prettier renderer will not fix unclear edges or mobile inspection by itself.

**Tech Stack:** Hugo 0.82.1 on Netlify, PaperMod, Hugo templates, static JavaScript, Cytoscape 3.29.2, CSS.

---

## Source Feedback

HN discussion: https://news.ycombinator.com/item?id=47996740

Actionable problems from the thread:

- The graph rationale is unclear: users do not know why a linear 100-day sequence is a graph or what the edges mean.
- The source data is unclear: users cannot find where the topics/questions/posts behind the graph come from.
- Category/topic text renders `&amp;` instead of `&` for at least some users.
- Mobile interaction is broken because the experience depends on hover.
- The overall website/graph feels confusing and not intuitive enough.
- Day 6 makes an overconfident `for` versus `foreach` performance claim based on an invalid benchmark.
- Day 1 could present clearer Java options for matching one string against a fixed set.
- Three.js was suggested, but this should be a bounded spike after the 2D graph is understandable and mobile-usable.

## File Structure

- Modify `content/java-knowledge-graph.md`
  - Holds page title, description, and explanatory content for the graph.
- Modify `layouts/knowledge-graph/single.html`
  - Owns the graph page HTML, toolbar, explainer, inspector, fallback/source sections, and script wiring.
- Modify `layouts/knowledge-graph/single.json`
  - Generates the graph data consumed by JavaScript.
- Modify `layouts/partials/java_graph/add_edge.html`
  - Central place to add edge metadata like `reason`.
- Modify `layouts/partials/java_graph/classify_topic.html`
  - Keeps topic classification labels stable and human-readable.
- Modify `static/js/java-graph.js`
  - Owns graph normalization, Cytoscape interaction, touch behavior, inspector rendering, topic index rendering, and defensive entity decoding.
- Modify `static/css/java-graph.css`
  - Owns responsive layout, explainer/source styling, touch target sizing, and mobile graph behavior.
- Modify `data/java_graph_overrides.json`
  - Optional manual edge curation and edge reasons after the data contract supports them.
- Modify `content/posts/day-6-for-vs-foreach-performance.md`
  - Corrects the benchmark claim and adds a clear update note.
- Modify `content/posts/day-1-comparing-checking-equality-against-multiple-strings.md`
  - Adds clearer modern Java guidance for fixed-value string matching.

## Task 1: Add Graph Rationale And Source Provenance

**Files:**
- Modify: `content/java-knowledge-graph.md`
- Modify: `layouts/knowledge-graph/single.html`
- Modify: `static/css/java-graph.css`

- [ ] **Step 1: Update page metadata and body copy**

Replace the body of `content/java-knowledge-graph.md` with:

```markdown
+++
title = "100DaysOfJava Knowledge Graph"
description = "A map of 100 Java learning posts, connected by reading order, internal references, and shared topics."
type = "knowledge-graph"
url = "/java/100daysofjava/graph/"
outputs = ["HTML", "JSON"]
ShowToc = false
+++

Each node is one post from the 100DaysOfJava series. Edges mean one of three things: consecutive days in the challenge, explicit links from one post to another, or nearby posts that share the same top-level topic.
```

- [ ] **Step 2: Add an explainer block under the hero**

In `layouts/knowledge-graph/single.html`, insert this block immediately after the closing `</header>` for `.java-graph-hero`:

```html
  <section class="java-graph-explainer" aria-label="How to read this graph">
    <article>
      <h2>What this is</h2>
      <p>Each node is one 100DaysOfJava post. The graph is an index for browsing the series by concept, not a replacement for reading the posts in order.</p>
    </article>
    <article>
      <h2>Why edges exist</h2>
      <p><strong>Sequence</strong> connects consecutive days. <strong>References</strong> come from links between posts. <strong>Topic links</strong> connect nearby posts with the same top-level topic.</p>
    </article>
    <article>
      <h2>Source data</h2>
      <p>The data is generated from the blog posts, their front matter topics/categories, and Markdown links. The fallback list below is the source post set.</p>
    </article>
  </section>
```

- [ ] **Step 3: Style the explainer so it reads as page context, not marketing copy**

Add this CSS after `.java-graph-hero p` in `static/css/java-graph.css`:

```css
.java-graph-explainer {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.java-graph-explainer article {
  border: 1px solid var(--java-graph-panel-border);
  border-radius: 12px;
  background: rgba(8, 22, 36, 0.72);
  padding: 0.85rem;
}

.java-graph-explainer h2 {
  margin: 0 0 0.42rem;
  font-size: 0.95rem;
}

.java-graph-explainer p {
  margin: 0;
  color: var(--java-graph-muted);
  font-size: 0.9rem;
  line-height: 1.45;
}
```

Then add this inside the existing `@media (max-width: 760px)` block:

```css
  .java-graph-explainer {
    grid-template-columns: 1fr;
  }
```

- [ ] **Step 4: Build-check**

Run:

```powershell
hugo --gc --minify --enableGitInfo
```

Expected: Hugo builds without `ERROR` messages. If `hugo` is not installed locally, install Hugo `0.82.1` or run the same command through Netlify.

- [ ] **Step 5: Commit**

```powershell
git add content/java-knowledge-graph.md layouts/knowledge-graph/single.html static/css/java-graph.css
git commit -m "Explain knowledge graph source and edge meaning"
```

## Task 2: Add Edge Reasons To The Data Contract

**Files:**
- Modify: `layouts/partials/java_graph/add_edge.html`
- Modify: `layouts/knowledge-graph/single.json`
- Modify: `static/js/java-graph.js`
- Modify: `data/java_graph_overrides.json`

- [ ] **Step 1: Add `reason` support to the edge partial**

In `layouts/partials/java_graph/add_edge.html`, replace the current `$edge` creation block with this expanded version:

```go-html-template
    {{- $label := $type -}}
    {{- with .label -}}
      {{- $label = . -}}
    {{- end -}}
    {{- $reason := $label -}}
    {{- with .reason -}}
      {{- $reason = . -}}
    {{- end -}}
    {{- $edge := dict "id" $edgeID "source" $source "target" $target "type" $type "weight" $weight "label" $label "reason" $reason -}}
```

- [ ] **Step 2: Pass explicit reasons from generated edge call sites**

In `layouts/knowledge-graph/single.json`, update the sequence edge call to:

```go-html-template
    {{- partial "java_graph/add_edge.html" (dict "scratch" $scratch "source" $source "target" $target "type" "sequence" "weight" 1.3 "label" "Day progression" "reason" "Consecutive posts in the original 100DaysOfJava sequence.") -}}
```

Update the topic edge call to:

```go-html-template
      {{- partial "java_graph/add_edge.html" (dict "scratch" $scratch "source" $previousID "target" (index $node "id") "type" "topic" "weight" 0.8 "label" "Shared topic" "reason" (printf "Both posts are classified under %s." $topic)) -}}
```

Update the reference edge call to:

```go-html-template
        {{- partial "java_graph/add_edge.html" (dict "scratch" $scratch "source" $sourceID "target" $targetID "type" "reference" "weight" 1.0 "label" "References" "reason" "The source post links to the target post in Markdown.") -}}
```

Update the manual `addEdges` call to preserve optional custom reasons:

```go-html-template
      {{- partial "java_graph/add_edge.html" (dict "scratch" $scratch "source" $source "target" $target "type" $type "weight" (default 1.0 .weight) "label" (default $type .label) "reason" (default (default $type .label) .reason) "ignoreRemove" true) -}}
```

- [ ] **Step 3: Normalize edge reasons in JavaScript**

In `static/js/java-graph.js`, update `normalizedEdges` inside `normalizeModel`:

```javascript
    const normalizedEdges = edges.map((edge) => ({
      id: String(edge.id || `${edge.source}-${edge.target}-${edge.type}`),
      source: String(edge.source || ""),
      target: String(edge.target || ""),
      type: String(edge.type || "reference"),
      weight: Number(edge.weight || 1),
      label: String(edge.label || edge.type || "reference"),
      reason: String(edge.reason || edge.label || edge.type || "reference")
    })).filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target) && edge.source !== edge.target);
```

- [ ] **Step 4: Show edge reasons in related posts**

In `updateInspector`, replace the related list HTML map with:

```javascript
    relatedListEl.innerHTML = ranked
      .map((item) => `<li><a href="${escapeHtml(item.node.url)}">${escapeHtml(item.node.title)}</a> <small>${escapeHtml(item.type)}: ${escapeHtml(item.reason || item.type)}</small></li>`)
      .join("");
```

- [ ] **Step 5: Add one manually curated concept edge as a proof of contract**

Append this object to `addEdges` in `data/java_graph_overrides.json`:

```json
{
  "source": "post-day-69-unlocking-java-performance-secrets-harnessing-the-power-of-jmh-microbenchmarking",
  "target": "post-day-6-for-vs-foreach-performance",
  "type": "reference",
  "weight": 1.4,
  "label": "Benchmark correction",
  "reason": "Day 69 explains JMH, which is the right tool for validating the Day 6 performance question."
}
```

If the generated node id differs, inspect the built JSON and adjust only the `source` or `target` id.

- [ ] **Step 6: Build-check**

Run:

```powershell
hugo --gc --minify --enableGitInfo
```

Expected: The generated graph JSON has edge objects with `reason` fields and no Hugo template errors.

- [ ] **Step 7: Commit**

```powershell
git add layouts/partials/java_graph/add_edge.html layouts/knowledge-graph/single.json static/js/java-graph.js data/java_graph_overrides.json
git commit -m "Expose knowledge graph edge reasons"
```

## Task 3: Fix HTML Entity Rendering For Topics And Categories

**Files:**
- Modify: `layouts/knowledge-graph/single.json`
- Modify: `layouts/partials/java_graph/classify_topic.html`
- Modify: `static/js/java-graph.js`

- [ ] **Step 1: Decode values before putting them into graph JSON**

In `layouts/knowledge-graph/single.json`, update every category/topic value assignment from:

```go-html-template
{{- $value := trim (printf "%v" .) " " -}}
```

to:

```go-html-template
{{- $value := trim ((printf "%v" .) | htmlUnescape) " " -}}
```

Also change the topic assignment after `classify_topic` from:

```go-html-template
{{- $topic := trim (printf "%s" $topicRaw) " " -}}
```

to:

```go-html-template
{{- $topic := trim ((printf "%s" $topicRaw) | htmlUnescape) " " -}}
```

And change node title assignment to:

```go-html-template
"title" ($post.Title | htmlUnescape)
```

- [ ] **Step 2: Add defensive entity decoding in JavaScript**

Add this helper below `escapeHtml` in `static/js/java-graph.js`:

```javascript
  const decodeHtmlEntities = (value) => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = String(value || "");
    return textarea.value;
  };
```

Then update `normalizeModel` node fields:

```javascript
      title: decodeHtmlEntities(node.title || "Untitled"),
      topic: decodeHtmlEntities(node.topic || "Core Java"),
      categories: Array.isArray(node.categories) ? node.categories.map((item) => decodeHtmlEntities(item)) : [],
      summary: decodeHtmlEntities(node.summary || "No summary available."),
```

And edge fields:

```javascript
      label: decodeHtmlEntities(edge.label || edge.type || "reference"),
      reason: decodeHtmlEntities(edge.reason || edge.label || edge.type || "reference")
```

- [ ] **Step 3: Preserve canonical labels in the topic classifier**

In `layouts/partials/java_graph/classify_topic.html`, keep labels as literal human strings with `&`, not `&amp;`:

```go-html-template
{{- $topic = "Language & APIs" -}}
{{- $topic = "I/O & Networking" -}}
{{- $topic = "JVM & Performance" -}}
{{- $topic = "Security & Crypto" -}}
{{- $topic = "AI, Spring & Cloud" -}}
```

- [ ] **Step 4: Verify generated output**

Run:

```powershell
hugo --gc --minify --enableGitInfo
rg -n "&amp;" public\\java\\100daysofjava\\graph
```

Expected: The build succeeds. `rg` should not find `&amp;` inside graph JSON topic/category strings. In the browser UI, topic labels show `Language & APIs`, `JVM & Performance`, and `AI, Spring & Cloud`.

- [ ] **Step 5: Commit**

```powershell
git add layouts/knowledge-graph/single.json layouts/partials/java_graph/classify_topic.html static/js/java-graph.js
git commit -m "Fix graph topic entity rendering"
```

## Task 4: Make Graph Inspection Work On Mobile And Touch Devices

**Files:**
- Modify: `layouts/knowledge-graph/single.html`
- Modify: `static/js/java-graph.js`
- Modify: `static/css/java-graph.css`

- [ ] **Step 1: Replace hover-only empty state copy**

In `layouts/knowledge-graph/single.html`, replace:

```html
<h2 id="java-graph-inspector-title">Hover a node</h2>
<p id="java-graph-inspector-meta">Topic, day, and related context will appear here.</p>
<p id="java-graph-inspector-summary">Use the controls to focus by topic/day and inspect relationships.</p>
```

with:

```html
<h2 id="java-graph-inspector-title">Select a node</h2>
<p id="java-graph-inspector-meta">Topic, day, and related context will appear here.</p>
<p id="java-graph-inspector-summary">Tap or click a node to inspect it, then use Open post to read the article.</p>
```

- [ ] **Step 2: Stop using tap as immediate navigation**

In `static/js/java-graph.js`, add this helper before `createCy`:

```javascript
  const selectPostNode = (node) => {
    if (!node || !cy) {
      return;
    }
    cy.elements().unselect();
    node.select();
    updateInspector(node.data("id"));
    if (hoverEl) {
      hoverEl.classList.remove("is-visible");
    }
  };
```

Replace the current post tap handler:

```javascript
    cy.on("tap", "node[kind = 'post']", (event) => {
      const data = event.target.data();
      if (data.url) {
        window.location.href = data.url;
      }
    });
```

with:

```javascript
    cy.on("tap", "node[kind = 'post']", (event) => {
      selectPostNode(event.target);
    });
```

Keep the `Open post` link as the only navigation action for selected posts.

- [ ] **Step 3: Keep desktop hover useful without making it required**

Inside the existing `mouseover` handler for post nodes, keep `updateInspector(data.id);`. The acceptance condition is that desktop users can still skim with hover, while mobile users can inspect with tap.

- [ ] **Step 4: Add touch-specific CSS**

Append this media block to `static/css/java-graph.css`:

```css
@media (pointer: coarse) {
  .java-graph-hover {
    display: none;
  }

  .java-graph-actions button,
  .java-graph-control input[type="search"],
  .java-graph-control select {
    min-height: 44px;
  }

  .java-graph-inspector {
    scroll-margin-top: 0.8rem;
  }
}
```

- [ ] **Step 5: Verify mobile behavior**

Run the site locally:

```powershell
hugo server --disableFastRender
```

Open `/java/100daysofjava/graph/` at a mobile viewport around `390x844`.

Expected:

- Tapping a post node updates the inspector.
- Tapping a post node does not navigate away.
- The `Open post` link navigates to the article.
- The hover tooltip is hidden on touch devices.
- The toolbar controls are usable without overlapping.

- [ ] **Step 6: Commit**

```powershell
git add layouts/knowledge-graph/single.html static/js/java-graph.js static/css/java-graph.css
git commit -m "Make graph node inspection touch friendly"
```

## Task 5: Add A Topic Index So The Page Is Useful Without Reading The Graph

**Files:**
- Modify: `layouts/knowledge-graph/single.html`
- Modify: `static/js/java-graph.js`
- Modify: `static/css/java-graph.css`

- [ ] **Step 1: Add a topic index section after the graph shell**

In `layouts/knowledge-graph/single.html`, insert this after the closing `</section>` for `.java-graph-shell` and before the fallback list:

```html
  <section class="java-graph-topic-index" aria-labelledby="java-graph-topic-index-title">
    <div class="java-graph-section-heading">
      <h2 id="java-graph-topic-index-title">Explore by topic</h2>
      <p>Same source data as the graph, grouped for quick scanning and mobile browsing.</p>
    </div>
    <div id="java-graph-topic-index-list" class="java-graph-topic-index-list">
      <p>Loading topic index...</p>
    </div>
  </section>
```

- [ ] **Step 2: Add the topic index element reference**

In `static/js/java-graph.js`, add this near the other element lookups:

```javascript
  const topicIndexListEl = document.getElementById("java-graph-topic-index-list");
```

- [ ] **Step 3: Render grouped posts from the normalized model**

Add this function before `hydrateTopicFilter`:

```javascript
  const renderTopicIndex = () => {
    if (!topicIndexListEl || !model) {
      return;
    }

    const groups = new Map();
    model.nodes.forEach((node) => {
      if (!groups.has(node.topic)) {
        groups.set(node.topic, []);
      }
      groups.get(node.topic).push(node);
    });

    topicIndexListEl.innerHTML = [...groups.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([topic, nodes]) => {
        const links = nodes
          .sort((a, b) => (a.day || 0) - (b.day || 0))
          .map((node) => `<li><a href="${escapeHtml(node.url)}">Day ${escapeHtml(node.day || "-")}: ${escapeHtml(node.title.replace(/^Day\\s+\\d+\\s*:?\\s*/i, ""))}</a></li>`)
          .join("");
        return `<article><h3>${escapeHtml(topic)} <span>${nodes.length}</span></h3><ul>${links}</ul></article>`;
      })
      .join("");
  };
```

Then call it after `setupDayControls();` in the fetch success chain:

```javascript
      renderTopicIndex();
```

- [ ] **Step 4: Style the topic index**

Add this CSS before `.java-graph-fallback`:

```css
.java-graph-topic-index {
  margin-top: 1rem;
  border: 1px solid var(--java-graph-panel-border);
  border-radius: 16px;
  background: rgba(7, 19, 32, 0.74);
  padding: 1rem;
}

.java-graph-section-heading {
  display: grid;
  gap: 0.3rem;
  margin-bottom: 0.9rem;
}

.java-graph-section-heading h2,
.java-graph-section-heading p {
  margin: 0;
}

.java-graph-section-heading p {
  color: var(--java-graph-muted);
}

.java-graph-topic-index-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.java-graph-topic-index-list article {
  border-top: 1px solid rgba(173, 226, 255, 0.16);
  padding-top: 0.75rem;
}

.java-graph-topic-index-list h3 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin: 0 0 0.55rem;
  font-size: 0.95rem;
}

.java-graph-topic-index-list h3 span {
  color: var(--java-graph-muted);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.78rem;
}

.java-graph-topic-index-list ul {
  display: grid;
  gap: 0.35rem;
  margin: 0;
  padding-left: 1rem;
}

.java-graph-topic-index-list a {
  color: #9dd9ff;
  text-decoration: none;
}

.java-graph-topic-index-list a:hover {
  text-decoration: underline;
}
```

Add this inside `@media (max-width: 760px)`:

```css
  .java-graph-topic-index-list {
    grid-template-columns: 1fr;
  }
```

- [ ] **Step 5: Verify usefulness without graph interaction**

Run:

```powershell
hugo server --disableFastRender
```

Expected:

- The topic index renders after graph data loads.
- Every link opens a post.
- Users can understand the source post set without hovering the graph.
- On mobile, the topic index is a single column and readable.

- [ ] **Step 6: Commit**

```powershell
git add layouts/knowledge-graph/single.html static/js/java-graph.js static/css/java-graph.css
git commit -m "Add topic index for graph source posts"
```

## Task 6: Correct Day 6 Benchmark Claim

**Files:**
- Modify: `content/posts/day-6-for-vs-foreach-performance.md`

- [ ] **Step 1: Replace front matter title, description, and summary**

Change the Day 6 front matter fields to:

```toml
description = "A corrected learning note about for-loop and foreach-loop performance, including why the original timing test was not a valid Java benchmark."
summary = "The original quick timing test was a learning snapshot, not evidence that for loops are faster than foreach loops. This update explains the benchmark flaws and points to JMH."
title = "Day 6: For Loop vs Foreach Loop Performance, and Why My First Benchmark Was Misleading"
```

- [ ] **Step 2: Add a correction note before the original paragraph**

Replace line 19 body text with:

```markdown
> Update, May 2026: the original benchmark below should not be treated as evidence that a classic `for` loop is meaningfully faster than `foreach`. It used `System.currentTimeMillis()`, no warmup, no repeated forks, and loops whose work could be optimized away. A proper Java microbenchmark should use JMH and should consume real work so the JIT cannot remove the measurement target.

This post is kept as a learning snapshot, but the conclusion has changed: prefer the loop that makes the code clearer unless a production measurement with representative data shows otherwise.
```

- [ ] **Step 3: Add a short better-benchmark section after the original code block**

Insert this after the closing backticks of the original Java code:

```markdown
### What a better benchmark needs

A useful version of this test needs:

- JMH warmup and measurement iterations.
- Several forks so one JVM run does not dominate the result.
- Real work inside each loop.
- A consumed result so the JIT cannot remove the loop.
- Representative data structures, because arrays, `ArrayList`, `LinkedList`, and custom collections do not behave the same way.

For this series, Day 69 covers JMH in more detail: [Day 69 - Unlocking Java Performance Secrets](/posts/java/100DaysOfJava/day69/).
```

- [ ] **Step 4: Build-check the changed post**

Run:

```powershell
hugo --gc --minify --enableGitInfo
```

Expected: The Day 6 page builds and the graph still links to it.

- [ ] **Step 5: Commit**

```powershell
git add content/posts/day-6-for-vs-foreach-performance.md
git commit -m "Correct Day 6 loop benchmark claim"
```

## Task 7: Improve Day 1 String Matching Guidance

**Files:**
- Modify: `content/posts/day-1-comparing-checking-equality-against-multiple-strings.md`

- [ ] **Step 1: Replace front matter title, description, and summary**

Change the Day 1 front matter fields to:

```toml
description = "Checking whether a string matches one of several allowed values in Java."
summary = "A small Java example for checking whether a string matches one of several allowed values, with notes on List.of, Set.of, Apache Commons Lang, and streams."
title = "Day 1: Checking Whether a String Matches One of Several Values"
```

- [ ] **Step 2: Replace the first body sentence**

Replace:

```markdown
Comparing/ checking equality against multiple Strings.
```

with:

```markdown
This example checks whether one string is equal to any value from a fixed set of allowed strings.
```

- [ ] **Step 3: Add a modern guidance section after the code block**

Insert this after the closing backticks of the Java code:

````markdown
### Which option should you use?

For a small fixed list, `List.of(...).contains(value)` is simple and readable.

For repeated lookups or a larger set, keep the allowed values in a `Set`:

```java
import java.util.Locale;
import java.util.Set;

public class Day01 {
    private static final Set<String> ALLOWED_FILE_TYPES =
            Set.of("jpg", "png", "avi", "mpeg", "docx");

    public static void main(String[] args) {
        String fileType = "mpeg";
        if (ALLOWED_FILE_TYPES.contains(fileType.toLowerCase(Locale.ROOT))) {
            System.out.println("Found file with type " + fileType);
        }
    }
}
```

If a project already uses Apache Commons Lang, `Strings.CS.equalsAny(...)` or the relevant case-insensitive variant can express this directly without creating a collection at the call site. Streams are better when this check is part of a longer pipeline, not just for a standalone membership test.
````

- [ ] **Step 4: Build-check the changed post**

Run:

```powershell
hugo --gc --minify --enableGitInfo
```

Expected: The Day 1 page builds and the graph still links to it.

- [ ] **Step 5: Commit**

```powershell
git add content/posts/day-1-comparing-checking-equality-against-multiple-strings.md
git commit -m "Clarify Day 1 string matching options"
```

## Task 8: Bounded Three.js Spike After Clarity Fixes

**Files:**
- Create only on a separate branch if pursued: `static/js/java-graph-3d.js`
- Modify only on a separate branch if pursued: `layouts/knowledge-graph/single.html`

- [ ] **Step 1: Create a separate experiment branch**

```powershell
git switch -c codex/java-graph-3d-spike
```

- [ ] **Step 2: Define the acceptance gate before writing code**

Use this gate:

- The 3D view must use the same JSON data contract.
- It must preserve tap/click inspection and `Open post`.
- It must not replace the topic index.
- It must render 100 post nodes at desktop and mobile sizes without blank canvases.
- It must stay below the existing 2D page in priority unless it improves comprehension.

- [ ] **Step 3: Implement only a prototype**

Create `static/js/java-graph-3d.js` and load it behind a disabled-by-default view toggle. Do not ship it as the default renderer until Tasks 1 through 7 are live and verified.

- [ ] **Step 4: Decide keep or drop**

Keep the spike only if it improves comprehension in screenshots and manual testing. If it only looks nicer, drop it and keep the Cytoscape graph.

## Task 9: Final Verification And Release

**Files:**
- Verify all changed files.

- [ ] **Step 1: Confirm local tool availability**

Run:

```powershell
hugo version
```

Expected: Hugo is available. If local Windows does not have Hugo, use Netlify build logs for final build verification and note that local Hugo was unavailable.

- [ ] **Step 2: Run production build**

Run:

```powershell
hugo --gc --minify --enableGitInfo
```

Expected: no `ERROR` output.

- [ ] **Step 3: Search for the entity regression**

Run:

```powershell
rg -n "&amp;" public\\java\\100daysofjava\\graph
```

Expected: no graph data topic/category strings contain `&amp;`.

- [ ] **Step 4: Browser-test desktop**

Run:

```powershell
hugo server --disableFastRender
```

Desktop checklist:

- Hero explains what the graph is.
- Explainer says why each edge type exists.
- Topic select shows `&`, not `&amp;`.
- Hover updates inspector.
- Click selects a node and does not navigate.
- `Open post` navigates.
- Related posts show edge type and reason.
- Topic index links work.

- [ ] **Step 5: Browser-test mobile**

Use a mobile viewport around `390x844`.

Mobile checklist:

- Toolbar wraps without overlap.
- Tap selects a node.
- Hover tooltip is hidden.
- Inspector is readable.
- Topic index is a single column.
- Links are tappable.

- [ ] **Step 6: Review content pages**

Open:

- `/posts/java/100DaysOfJava/day1/`
- `/posts/java/100DaysOfJava/day6/`
- `/java/100daysofjava/graph/`

Expected: Day 1 has clearer option guidance, Day 6 has a visible correction, and the graph still links to both posts.

- [ ] **Step 7: Commit any final verification fixes**

```powershell
git status --short
git add content layouts static data
git commit -m "Polish HN graph feedback fixes"
```

Only run the final commit if there are remaining tracked implementation changes not already committed by the earlier tasks.

## Self-Review

- Spec coverage: every concrete HN issue is mapped to a task. Graph rationale and source provenance are covered by Tasks 1, 2, and 5. Entity rendering is covered by Task 3. Mobile hover failure is covered by Task 4. Confusing UX is covered by Tasks 1, 2, 4, and 5. Content accuracy issues are covered by Tasks 6 and 7. Three.js is covered as a bounded post-fix spike in Task 8.
- Placeholder scan: no `TBD`, `TODO`, or vague implementation steps remain. Where generated node ids may differ, the plan gives a concrete inspection and adjustment step.
- Type consistency: edge metadata uses the same `reason` property in Hugo JSON generation, JavaScript normalization, and inspector rendering.
