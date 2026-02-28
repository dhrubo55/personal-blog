# Mohibul Hassan — Tech Blog Writing Guide

A personal style guide for writing like Simon Willison, Julia Evans, and Sean Goedecke:
technical, direct, opinionated, and unmistakably yours.

---

## The Core Principle

You explain well. The bloggers you admire also have a *point of view*.

**Instructional-with-personality** → **Personal-with-instruction**

Readers don't come back for explanations. They come back for a specific engineer's thinking process. Your explanation is the vehicle. Your perspective is the destination.

---

## Voice and Tone

**Instructional but casual.** Short sentences. Simple words. No textbook rhythm.

**First person as protagonist, not narrator.**
- ❌ "While working, I discovered that volatile works this way."
- ✅ "I used volatile confidently for two years before I realized I'd been half-wrong."

The difference: the second version has stakes. Something was at risk. That keeps people reading.

**"We" for walking through together.**
- "Let us understand...", "Now lets see...", "So back to the question..."

**State your take early.** By the second paragraph, the reader should know what *you think*, not just what you're covering.
- ✅ "I find most explanations of HashMap buckets confusing because they skip the part that actually matters."
- ✅ "Volatile is one of those things I used confidently for two years before I realized I'd been half-wrong."
- ❌ "In this post we will look at how volatile works in Java."

The opinion doesn't need to be controversial. It just needs to be yours.

**Direct and concrete.** Prefer "X does Y" over "It is often the case that X may do Y."

---

## Titles

Descriptive titles are forgettable. Specific titles build a brand.

| Pattern | Example |
|---|---|
| The actual question you had | "Does null have a hashCode in Java?" |
| The counterintuitive thing | "Volatile doesn't do what most Java tutorials say" |
| The specific situation | "How I debugged a race condition I didn't know I had" |
| The honest admission | "I got retry logic wrong for two years. Here's why." |
| TIL style (Simon Willison) | "TIL: Java's HashMap doesn't guarantee insertion order, even in JDK 21" |

**Rule:** Specific beats clever. Every time.

---

## Openings

Start with situation + your reaction + the post's implicit argument.

**The 3-part opening:**
1. What you were doing (situation)
2. What you noticed / confused you / surprised you (your reaction)
3. One line that commits to the post's argument

**Examples:**

> "While working on a caching layer I realized I'd been misusing `volatile` for months. Not dangerously wrong — just wrong enough to matter under load."

> "Retrying failed operations sounds trivial until you actually implement it. Here's where most approaches quietly break."

> "I spent 20 minutes trying to explain HashMap collision handling to a junior dev and realized I couldn't do it cleanly. So I went back to the source."

**Never start with:**
- "In this blog post, we will explore..."
- "X is an important concept in Java..."
- Long "the importance of X" preambles

---

## Structure

**One main idea per post.** Everything serves that idea.

**The narrative spine** (use 3–5 of these, not always all 6):
1. **Situation** — what you were doing when you hit this
2. **The confusion or question** — what wasn't clear
3. **The investigation** — what you looked at (code, docs, experiment)
4. **The mechanism** — how it actually works
5. **The sharp edge** — where it breaks or surprises people
6. **The takeaway** — one sentence, practical

**Headings:** `### What is X` → mechanism → code → edge cases

**Paragraphs:** 2–4 sentences. One idea per paragraph.

**Lists:** Numbered for types, steps, or reasons. Keep each item short and real — no padded "best practices" lists.

**Bold** for terms you're defining or emphasizing inline.

---

## Showing Your Work

This is what separates good technical writing from great technical writing. **Show the moment of discovery, not just the conclusion.**

- ❌ "The JVM reads volatile variables directly from main memory."
- ✅ "I checked the JDK source to confirm this — here's what I found." *(then link or quote)*

- ❌ "Here's how retry logic works."
- ✅ "I wrote this retry method three times before the third version held up under concurrent load. The first two looked fine."

Julia Evans builds entire posts around "I was confused." Simon Willison's TILs are literally him showing what he just discovered. This habit builds trust. Readers feel like they're learning *with* you, not being lectured *at*.

---

## Code

**Code first.** Put it right after one sentence of setup — don't bury it after paragraphs of theory.

**After the block:** one or two sentences saying what the code does or shows.
- "Here `retryMethod` takes a `Runnable` and interval time and wraps the execution in a try-catch loop."
- "In this case `mutableNumber` is not declared `volatile` so there is no guarantee when the JVM will read from main memory."

**Refer to code directly:** "here", "in this case", "from the code above."

**No comments inside the code** unless they're unavoidable. Explain in the prose around it.

**Keep code blocks focused.** One concept per block where possible. If it needs more, split it.

---

## Transitions and Phrasing

Use simple bridges: "So", "Now", "Furthermore", "Also", "Lets see", "So back to the question."

Short rhetorical questions before code work well: "Do null values have a hashCode?", "Now a question arises."

Slight informality is your voice, not a flaw: "By the way", "So its returning...", "Lets see."

---

## Definitions

One clear sentence, then optionally expand:
- "Non volatile variables have no particular guarantee when JVM will read data from the main memory..."
- "A bucket is a position in the underlying array, and multiple key-value pairs with the same hash code are stored in the same bucket..."

Avoid: "X is a concept that has been widely discussed in the Java ecosystem..."

---

## Endings

**Default:** End after the last concrete point or code. Clean, no summary paragraph.

**Two alternatives when they fit:**

**The open question** (Julia Evans style) — end with something you don't fully know yet:
> "One thing I haven't tested: does this behaviour change under virtual threads? Worth digging into."

**The sharp one-liner** (Simon Willison style) — one sentence that distills everything:
> "Volatile guarantees visibility. It doesn't guarantee atomicity. That's the whole post."

Both are better than restating what you just wrote.

---

## References

Link when you cite: "as mentioned in the JDK source", "Source: Baeldung."

Use blockquotes for official docs — Oracle, JSR specs, JEPs.

---

## Things to Avoid

| Avoid | Why |
|---|---|
| "In this comprehensive guide..." | Generic opener, signals AI-style writing |
| "It's important to note that..." | Filler. If it's important, just say it. |
| "In conclusion, we have explored..." | Restates without adding anything |
| "By understanding X, you can Y" | Summary padding |
| "leverage", "utilize", "facilitate", "robust", "ensure" | Inflated vocabulary |
| Long bullet lists of "best practices" | Usually vague; use only for real, short items |
| Explaining what the post will cover | Just start the post |

---

## Quick Self-Check Before Publishing

Ask yourself these before you hit publish:

1. **Does the opening have friction?** Is there a situation + my reaction to it?
2. **Is my take stated early?** Do I have an opinion somewhere in the first 3 paragraphs?
3. **Is the title specific enough?** Could I make it more concrete or slightly more provocative?
4. **Does the code come early enough?** Am I making readers wade through theory before seeing anything real?
5. **Am I showing my work?** Is there a moment where I show *how I found this out*, not just what I found?
6. **Does the ending have a punch?** Or does it just trail off with a summary?

---

## Brand Positioning in One Line

> Write like you're showing a colleague exactly what you figured out today — including the part where you were wrong first.

That's the Simon Willison / Julia Evans / Sean Goedecke formula. And you're already closer to it than most.
