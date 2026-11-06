# Review prompt: SARGability post

Paste everything below the line into Opus 5.5.

- **Claude Code:** run it from the repo root as written.
- **Claude app:** turn on web search, replace the file path sentence with "The post is between the `<post>` tags below," and paste the file's full contents between `<post>` and `</post>` at the end.

Do not add "think carefully" or "think step by step". For a deeper pass, raise effort instead.

---

Review my blog post draft before I publish it. The post is at `content/posts/sargability-the-sql-optimization-i-knew-before-i-knew-its-name.md` (Hugo, TOML front matter). Review the front matter as well as the body.

**Why this review matters.** This is a post on my personal engineering blog. The readers are backend developers who write SQL every day but have not studied how a query planner uses an index. The post has two jobs. It teaches one idea: a predicate that transforms an indexed column can stop the database from doing an index range lookup. And it tells that idea as my own story of learning the name for a technique I already used. If a database engineer finds one wrong claim, they stop trusting the rest of the post. If a newer developer hits a confusing paragraph on the first screen, they leave. So technical accuracy comes first, then clarity, then polish.

**Who you are for this review.** You have edited technical writing for 20 years, and you run a developer newsletter and blog that millions of engineers read every day. You know where developers stop reading and which errors make experts dismiss a post. You also know SQL query planning well enough to check this post's claims against the MySQL and PostgreSQL documentation.

**What to do.** Read the whole post once for the argument. Then review it in three passes:

1. **Technical accuracy.** Check every claim, SQL statement, and definition. Use the MySQL 8.4 and PostgreSQL pages linked in the post's "Further reading" section, and other primary documentation where needed. Look up anything you are unsure of instead of answering from memory.
2. **Structure and argument.** Does the body deliver what the title promises? Does the opening tell the reader what they will learn? Does each section follow from the one before it? Is there a gap a reader would notice? Does the ending give the reader something to do?
3. **Sentences.** Grammar, spelling, unclear sentences, and paragraphs too long to scan. Keep my voice: first person, short sentences, plain words. The post should not read like documentation or like an LLM wrote it.

Check these points. They are questions, not conclusions. Confirm or reject each one, and do not limit the review to them.

- Is "search argumentable" the correct expansion of SARG and SARGable?
- `YEAR()` exists in MySQL and SQL Server but not in PostgreSQL, and the post uses PostgreSQL for its expression-index example. Is it clear which database each example assumes? Should the post say so?
- "Some databases transform specific expressions." Is this true? Does it need an example or a source?
- Is the claim that `<= '2026-12-31 23:59:59'` can miss rows with fractional seconds correct? Is the UTC boundary advice correct?
- "It might need to inspect many index entries or rows ... a full index scan or a full table scan." Is this accurate for MySQL?
- The line "here are some visualizations that might help you to get it better." has nothing after it.
- The cover `alt`, `caption`, and `image` fields are empty.
- Check the first paragraph closely. It is the first thing a reader sees.
- The sentence that starts "So we can assume that".
- Do `title`, `description`, and `summary` agree with each other and with the body?

**Rules for findings.**

- Quote the exact sentence or line for every finding, and name the section heading it sits under.
- For each finding, say what is wrong, why it matters to the reader, and how to fix it. For a technical finding, cite the documentation page that supports your correction.
- Suggest targeted edits. Do not rewrite the whole post or whole sections. I will apply the edits myself and compare them with my original.
- Your suggested wording must follow these rules. Flag places where my draft breaks them.
  - State things directly. Do not use a metaphor or flourish where a literal phrase exists. Example: write "a parameter worth varying", not "a dial worth turning".
  - No filler openers such as "In today's world" or "Let's dive in".
  - No "It's not X, it's Y" constructions.
  - No rhetorical questions used as transitions.
  - No lists of three used for rhythm.
  - Keep the phonebook analogy, because it explains how B-tree ordering helps a search. Do not add new analogies.
- If a section needs no changes, write "No changes" and move on. Do not add praise to fill space.
- Mark anything you could not confirm, and say where you looked.

**Output format.**

1. **Needs from you.** Decisions only I can make, such as which database the post should target or whether to add the missing visualizations. Put these first.
2. **Blockers.** Problems you would stop publication for: factual errors, wrong or misleading SQL, leftover placeholders, and errors in the opening paragraph.
3. **Should fix.** Clarity and structure problems a careful reader would notice.
4. **Optional.** At most five polish suggestions.
5. **What works.** At most three things I should keep, one line each.
6. **Could not confirm.** Each claim you could not verify, and where you looked.

Done means every claim in the post is confirmed with a source, corrected, or listed under "Could not confirm", and every finding has a quote, a reason, and a fix. Do not edit the file. Do not stop to ask me questions during the review. Put them under "Needs from you".
