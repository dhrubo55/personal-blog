# SARGability post review, 2026-10-08

Reviewed: `content/posts/sargability-the-sql-optimization-i-knew-before-i-knew-its-name.md` (HEAD f552926).
Compared against: `docs/drafts/sargability-v2.md`, `content/posts/mohibul-writing-guide.md`, Day 88, Day 91, Day 98, Day 100 capstone, and the four diagrams in `static/images/posts/sargability/`.

## Verdict

The technical content holds. The boundary, rounding, time zone, functional index, and immutability claims were re-checked and no errors found. The problem is the register. The post reads like careful documentation with a story announced on top, and the story is never shown. The summary line in the front matter has more energy than the first paragraph.

Three changes move it toward the voice in the writing guide: a real opening, a visible query plan, and one database for the story.

## What to change, in order of impact

1. **Rewrite the opening.** Line 18 has a broken sentence ("I thought this technique I used quite often"). Line 20 is a table of contents, which the writing guide bans. "Recently" is the opposite of the dated specifics in the capstone post. The opening below uses only facts already in the post, so nothing is invented. Adjust it to what actually happened:

   > The query filtered the `transcripts` table on `YEAR(created_at) = 2026`. The column had an index. `EXPLAIN` showed a full table scan anyway.
   >
   > I knew the rewrite I would try, because I had made the same change before. I thought of it as one trick among several, next to dropping a `LOWER()` or a `CAST()` from a `WHERE` clause. Then ChatGPT's answer used a word I had never seen: SARGability. It was the name for all of them.

   This plants "separate tricks" so line 157 pays it off instead of introducing it.

2. **Show the plan.** Line 38 says `EXPLAIN` showed a full scan. The post never shows an `EXPLAIN`. The closing advice at line 153 is that a rewrite is a hypothesis until the plan confirms it, so the post should model that. Real output exists in `docs/drafts/sargability-repro/mysql.out`, but it comes from a generated test table. Either rerun `EXPLAIN` on the real table with private names removed, or use the test-table output and say in one sentence that it is a test table. Do not add timings you do not have. Plain `EXPLAIN` has none.

3. **Tell the story on one database.** Line 20 promises every example in both MySQL and PostgreSQL, so the opening alternates between them and the reader cannot tell which one the story happened on. Keep the story on the real one, then give PostgreSQL its own section near the end. The v2 draft already has that structure.

4. **Give the sharp edges their own heading.** Lines 104 to 110 are four separate gotchas: half-open ranges, insert-time rounding, UTC boundaries, and `TIMESTAMP` versus `DATETIME`. They sit under "Rewrite the predicate as a range", so a scanner misses them. The rounding paragraph at line 106 is the best technical paragraph in the post and deserves to be findable. Same for lines 122 to 140: expression indexes are a second fix, not part of "a usable index is not a chosen index".

5. **Earn the ending.** Line 157 says you now see the rule that connects the tricks, but the post demonstrates one rewrite. Either show two or three more in a short table, as the v2 draft does at its line 260, or soften the claim. Then end on line 153. "A rewrite is only a hypothesis until the execution plan confirms it" is the best sentence in the post, and it is buried above a paragraph about `EXPLAIN` column names.

6. **Fix the diagrams or the prose, not both.** All four images use `createdAt` while the prose uses `created_at`. Image 2 says "Scan rows in index order", but a `SELECT *` with `YEAR()` scans the table, not the index, and line 77 says so. A database engineer will catch that. Image 3 has a rendering glitch in the word "SARGable" and its literals omit the time part the prose includes. Also decide between the Cloudinary copies and the untracked PNGs in `static/images/posts/sargability/`.

7. **Small fixes.** Three blank lines at 70 to 72. Line 81 ends the section with a shrug; cut it or move it to the optimizer section. The summary says "ChatGPT explained why", but the body says you already knew why. Make it "I knew the rewrite. ChatGPT gave me its name." The cover block is empty, and `draft` is still true.

## How it compares with the older posts

- **Day 91, memory mapping,** opens on a named source, Gunnar Morling's 1BRC pull request, a real file size, and the moment it looked like a trick. It also leans on "magic" as its metaphor through the whole opening. The SARGability post went to the other extreme: no flourish, but also no named moment. The target is Day 91's specificity without its metaphors.
- **Day 98, virtual threads,** states the wrong mental model in sentence three and then the question that broke it. SARGability has the same shape available: the wrong model was "separate tricks". The ending says so. The opening should.
- **Day 100 capstone** opens with dates and an admission in sentence one. That honesty is what the SARGability opening lacks.
- **Day 88, transcription,** describes a production workflow that stores transcripts. If the `transcripts` table in this post is that system, one sentence and a link give the story its setting with no invention. If it is not, leave it out.
- **Where this post beats the older ones:** shorter sentences, a primary source with a DOI, exact version numbers, and gotchas with teeth. The half-open range and the rounding on insert are sharper edges than most of the 100-day posts have. None of the older posts' "In this post I will" openers survive here. Keep all of that.

## What only you can supply

The v2 draft lists these as FILL markers. None were answered here, because the answers are yours:

- Why you were rewriting that query. A slow endpoint, a report, a review.
- What you asked ChatGPT, and the line where the word appeared if you still have it.
- How you saw the scan: `EXPLAIN`, slow query log, a dashboard.
- Whether the real database was MySQL and what type `created_at` has.
- One earlier rewrite you remember, if any. If not, "I had made the same change before" is enough.
