# Publishing technical investigations

- Lead with the question, the observed result and its limits. A benchmark needs raw output, hardware, OS, JDK and library versions, warmup, measurement settings, forks and workload details before it supports a comparison.
- Link primary documentation beside the claim it supports. Link the related investigation and the Java Atlas when they help readers continue.
- Keep examples and recorded measurements intact during accessibility or metadata edits. Review technical corrections separately and explain them beside the example.
- Describe informative images in their Markdown occurrences. Use `![](...)` only for intentionally decorative images. For remote images, add their measured intrinsic width and height to `data/image_dimensions.yml`; builds never fetch them for metadata.
- Set a representative `cover.image` only when the article has one. Keep the author profile linked to `/about/`. Set `lastmod` only for an actual editorial revision; otherwise it follows the published date.
- Run the build, AI verifier and site audit before publication. Inspect article code in both themes, and keep performance measurements separate from Search Console indexing or referral observations.

## Editorial evidence still needed

The Day 69 introduction now limits what warmup can establish. Day 70 lacks its original machine, JVM/JMH versions, run settings and raw results. Its example also leaves three benchmarks disabled and contains a destination-size error in the disabled loop example. Those examples remain literal, and the prose now records these limitations instead of declaring a winner.

Day 99 already names its Windows experiment and synthetic-workload limitations. The capstone already gives a specific, dated retrospective. Those pages received image or link repairs only; no generic introduction or new benchmark claim was added.

Four remote diagram sources could not be inspected reliably and were retained as ordinary source links. The remaining diagrams were inspected for alternatives and intrinsic dimensions. The missing global profile-photo reference was removed; optional image metadata now stays absent when no real image is configured. Private Search Console data and AI-referral evidence were unavailable during this local implementation.
