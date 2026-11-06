# SARGability post: progress ledger

Plan doc: docs/drafts/sargability-review-2026-10-08.md (seven ranked fixes).

## 2026-10-08 20:25 (+06) - rewrite applied

Done:
- Rewrote content/posts/sargability-the-sql-optimization-i-knew-before-i-knew-its-name.md in full. All seven review fixes applied: new opening, EXPLAIN table shown, MySQL-only story with PostgreSQL in its own section, gotchas and expression indexes under their own headings, rewrite table before the close, image 2 moved to the covering-index paragraph, small fixes (blank lines, line 81, summary, empty cover block removed).
- Voice references limited to the writing guide and Day 88 / Day 91. No Day 95+ examples used.

Evidence:
- Every number in the post checked against docs/drafts/sargability-repro/mysql.out and pg.out (row counts, EXPLAIN type/key/rows, 20011/20011/20010 counts, error texts, time zone readbacks).
- Front matter parses as TOML (python tomllib). No [FILL] markers. No banned words. draft = true kept.
- hugo not on PATH, so no site build was run.

Next:
- Author decides whether to rerun the repro scripts (README in sargability-repro) so "I ran" is literally true, or rephrase.
- Regenerate the four diagrams with created_at instead of createdAt; fix the glyph glitch in image 3.
- Delete static/images/posts/sargability/*.png if the Cloudinary URLs stay.
- Set draft = false when ready.

Open questions:
- Is the transcripts table the Day 88 system? Not asserted in the post.
- Why was the query being rewritten, and what was asked of ChatGPT? Left out rather than invented.
