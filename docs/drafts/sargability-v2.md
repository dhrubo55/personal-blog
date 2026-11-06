+++
category = ["SQL", "Databases", "Performance"]
date = 2026-09-21T00:00:00+06:00
description = "Why a function on an indexed column can block an index range lookup in MySQL and PostgreSQL, and how rewriting the predicate as a range lets the optimizer consider the index."
draft = true
ShowToc = true
TocOpen = false
slug = "sql/sargability"
summary = "The index was there, but the query still scanned. ChatGPT gave me a name for a rewrite I already used: SARGability."
topics = ["Databases & SQL"]
title = "SARGability: the SQL optimization I knew before I knew its name"
# [FILL: pick a cover image and write its alt text, or delete the [cover] block.]
[cover]
alt = ""
caption = ""
image = ""
relative = false
+++
Recently, while rewriting a SQL query, I saw a word in ChatGPT's output that I had never seen before: SARGability. My first reaction was, what is this? Then ChatGPT explained it, and I realized I already use this technique when I write range queries. I just did not know it had a name.

**[FILL: Why were you rewriting this query? A slow endpoint, a report, a code review? One or two sentences.]**

**[FILL: What did you ask ChatGPT? If you still have the reply, quote the line where "SARGable" appeared.]**

The query looked like this:

```sql
SELECT *
FROM transcripts
WHERE YEAR(created_at) = 2026;
```

The table had an index on `created_at`, but the query still scanned the table.

**[FILL: How did you see the scan? `EXPLAIN`, the slow query log, a monitoring graph? If you ran `EXPLAIN` on the real table, paste its `type`, `possible_keys`, `key` and `rows` columns here, with anything private removed.]**

**[FILL: Is this the `transcripts` table from the transcription workflow in [Day 88]({{< relref "posts/day88.md" >}})? If yes, say so in one sentence and keep the link. If not, delete this marker.]**

I knew the rewrite I would try, because I had made similar changes before:

```sql
SELECT *
FROM transcripts
WHERE created_at >= '2026-01-01 00:00:00'
  AND created_at <  '2027-01-01 00:00:00';
```

**[FILL: One earlier rewrite like this that you remember, for example a `DATE(created_at) = ...` filter you turned into a range. Delete this marker if you don't remember a specific one.]**

Both queries return the same rows. Only the second one lets the database search the index. What I did not know was that the idea behind the rewrite had a name.

The short version: when you wrap an indexed column in a function, MySQL and PostgreSQL can no longer search that column's index for the matching rows.

The examples run on MySQL 8.4. In them, `created_at` is a `DATETIME(3)` column that holds UTC values and has a plain index named `idx_created`. PostgreSQL behaves the same way, with a few differences in syntax and types that get their own section near the end.

**[FILL: Confirm the real database was MySQL, its version, and the real type of `created_at`. If the real column is plain `DATETIME`, keep `DATETIME(3)` here anyway, because the boundary example below needs fractional seconds.]**

## What SARGable means

**SARG** is short for *search argument*. The term comes from IBM's System R query optimizer ([Selinger et al., 1979](https://doi.org/10.1145/582095.582099)). A predicate is **SARGable** when the database can use it as a search argument for an index. In practice, the indexed column stands alone on one side of the comparison, and the other side is a constant or a bind parameter.

`YEAR(created_at) = 2026` fails that test, because the column is inside a function. `created_at >= '2026-01-01 00:00:00'` passes it.

## Picture the index as a phonebook

Most MySQL and PostgreSQL indexes are B-trees, and so is the index on `created_at`. A B-tree keeps its values in sorted order. A phonebook shows how that order helps a search.

Picture a thick phonebook open on a desk. Every surname appears in alphabetical order.

If you want everyone named Smith, you do not read from the first page. You open the book near S, move to the names that start with Sm, find the first Smith, and read until the surname changes.

```text
A ... Smiley | Smith, Smith | Smithson ... Z
               ^ start here   ^ stop here
```

Now change the question. Find every surname with exactly five letters.

The alphabetical order no longer tells you where to begin. Adams and Smith both qualify, and they are far apart in the book. You have to inspect each name and count its letters.

```text
Adams -> count 5 -> keep
Brown -> count 5 -> keep
Ng    -> count 2 -> skip
Smith -> count 5 -> keep
...
```

The phonebook still has an order. The new question cannot use that order to narrow the search.

`YEAR(created_at) = 2026` creates the same mismatch. The B-tree stores full timestamp values in order. It does not store the year of each timestamp unless I create an index on that expression.

**[FILL: The four images use `createdAt`; the text uses `created_at`. Image 2 says "Scan rows in index order (on createdAt)", but `SELECT *` scanned the table, not the index. The "This form is SARGable:" label on image 3 looks garbled. Fix the images before publishing. The PNG copies in `static/images/posts/sargability/` are 1.1–1.4 MB each and duplicate these Cloudinary images, so keep one set, not both.]**

![B-tree index on the timestamp column, with leaf keys from 2025-11-03 to 2027-01-01 in order. The predicate YEAR(createdAt) = 2026 cannot be turned into a seek on those raw keys.](https://res.cloudinary.com/dlsxyts6o/image/upload/f_auto,q_auto/v1790919027/ChatGPT_Image_Oct_2_2026_10_30_34_AM-1_dypykp.png)

MySQL and PostgreSQL do not translate `YEAR(created_at) = 2026` back into a range of timestamps. With only a plain index on `created_at`, the database computes the year for each row and compares it with 2026. If no other condition narrows the work, that means a full table scan, or a full index scan when the index holds every column the query needs.

![Table of eight rows from 2025 to 2027. The database computes YEAR() for every row and keeps only the three rows where the result is 2026.](https://res.cloudinary.com/dlsxyts6o/image/upload/f_auto,q_auto/v1790919023/ChatGPT_Image_Oct_2_2026_10_30_36_AM-2_riapb2.png)

## Why the range works

So back to the rewrite. The range query compares the column itself with two constants, and the order of the B-tree becomes useful again.

![The same B-tree with the range query. The lower bound points at the 2026-01-01 leaf key and the upper bound at 2027-01-01, and the 2026 keys between them are highlighted.](https://res.cloudinary.com/dlsxyts6o/image/upload/f_auto,q_auto/v1790919027/ChatGPT_Image_Oct_2_2026_10_30_39_AM-3_vhbmwc.png)

The database goes down the tree to the first entry on or after `2026-01-01 00:00:00`, reads the entries in order, and stops when it reaches `2027-01-01 00:00:00`. MySQL calls this the `range` access method. From the [MySQL manual](https://dev.mysql.com/doc/refman/8.4/en/range-optimization.html):

> The `range` access method uses a single index to retrieve a subset of table rows that are contained within one or several index value intervals.

![Range seek in four steps: follow the tree from the root to the first key on or after 2026-01-01, read the keys in order, return their rows, and stop before 2027-01-01.](https://res.cloudinary.com/dlsxyts6o/image/upload/f_auto,q_auto/v1790919022/ChatGPT_Image_Oct_2_2026_10_30_40_AM-4_lyoi7p.png)

## What EXPLAIN showed

Here are both queries on a test table with a plain index on `created_at`. It has 200,001 rows: one every 1,576 seconds from 2020-01-01 to 2029-12-27, plus one extra row for the boundary example further down. 20,011 of the rows fall in 2026. The table below shows the `EXPLAIN` columns that matter.

**[FILL: These numbers come from a generated test table, not your production data. Before publishing, rerun `docs/drafts/sargability-repro/mysql.sql` yourself so the numbers are yours. If you want readers to rerun it too, publish the script as a gist and link it here.]**

| Query | `type` | `possible_keys` | `key` | `rows` |
|---|---|---|---|---|
| `YEAR()` filter | `ALL` | `NULL` | `NULL` | 199,060 |
| Range filter | `range` | `idx_created` | `idx_created` | 38,708 |
| `YEAR()` filter, `SELECT created_at` only | `index` | `NULL` | `idx_created` | 199,060 |

For the `YEAR()` query, `possible_keys` is `NULL`. The [MySQL manual](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html) says what that means:

> If this column is NULL (or undefined in JSON-formatted output), there are no relevant indexes.

MySQL did not consider `idx_created` at all, and `type` is `ALL`, a full table scan. For the range query, `idx_created` appears in both columns and `type` is `range`.

The third row is easy to misread. `key` shows `idx_created`, but `type` is `index`. MySQL read every entry in the index instead of every row in the table, because the index holds the only column this query selects. It still computed `YEAR()` for every entry.

The `rows` column is an estimate. For InnoDB tables, the manual says "this number is an estimate, and may not always be exact." The range query matched 20,011 rows, and MySQL estimated 38,708. These were plain `EXPLAIN` runs, so they have no timings. `EXPLAIN ANALYZE` runs the query and reports actual rows and time.

**[FILL: If you have real before/after timings for the production query, from `EXPLAIN ANALYZE` or the slow query log, add them here. If you don't, leave timings out.]**

## A usable index is not a chosen index

A SARGable predicate makes an index-based path possible. It does not force the optimizer to choose that path.

If most rows in the table are from 2026, scanning the table may cost less than following the index and fetching nearly every row. Table size, data distribution, the selected columns, and the table statistics all affect the decision.

The test table shows this. A range from `2021-01-01` to `2030-01-01` covers about 90% of its rows. For that query, MySQL lists `idx_created` in `possible_keys`, but `key` is `NULL` and `type` is `ALL`. It considered the index and chose a full table scan.

So the rewrite gives the optimizer an index range to consider. The optimizer still decides whether to use it.

A non-SARGable predicate does not guarantee a full scan either. Some optimizers rewrite a few specific expressions. SQL Server, for example, can still [seek an index on a `datetime` column](https://lobsterpot.com.au/blog/2021/03/09/beware-the-width-of-the-covering-range/) for `CAST(col AS date) = @d`. These rewrites are exceptions, and they differ between databases.

## Getting the boundaries right

The range is half-open: it includes the lower boundary and excludes the upper one. `< '2027-01-01 00:00:00'` includes every timestamp in 2026, whatever the column's fractional-second precision.

A closed range such as `<= '2026-12-31 23:59:59'` can miss rows. The test table has one extra row at `2026-12-31 23:59:59.500` to show this:

| Filter | Rows |
|---|---|
| `YEAR(created_at) = 2026` | 20,011 |
| `>= '2026-01-01 00:00:00' AND < '2027-01-01 00:00:00'` | 20,011 |
| `>= '2026-01-01 00:00:00' AND <= '2026-12-31 23:59:59'` | 20,010 |

The closed range missed that one row.

Fractional seconds can also move a row into the wrong year before any query runs. A plain MySQL `DATETIME` column stores whole seconds, and by default MySQL rounds the fraction when the row is inserted. Inserting `'2026-12-31 23:59:59.500'` into a `DATETIME` column stores `2027-01-01 00:00:00`. Every query after that counts it as a 2027 row, and no `WHERE` clause can change that. The `TIME_TRUNCATE_FRACTIONAL` SQL mode makes MySQL truncate instead of round. If the fraction matters, give the column the precision you need, such as `DATETIME(3)`.

The boundaries also depend on time zones. Here, `created_at` holds UTC values. If "2026" means a local business year, calculate the two UTC boundaries first, then compare the unchanged column with them. For a business year in Dhaka (UTC+6), the range runs from `'2025-12-31 18:00:00'` to `'2026-12-31 18:00:00'`.

A MySQL `TIMESTAMP` column works differently from `DATETIME`. MySQL reads a literal without an offset in the session time zone. On the test server, with the session time zone set to `+06:00`, inserting `'2026-01-01 00:00:00'` into a `TIMESTAMP` column and reading it back at `+00:00` returned `2025-12-31 18:00:00`. For `TIMESTAMP` columns, write the boundaries in the session time zone, or set the session time zone to UTC first.

## Or index the expression

MySQL can also index the expression itself. MySQL 8.0.13 and later support functional key parts. The expression needs its own parentheses:

```sql
CREATE INDEX idx_transcripts_created_year
  ON transcripts ((YEAR(created_at)));
```

Without the extra pair, `ON transcripts (YEAR(created_at))`, MySQL 8.4 returns `ERROR 1064 (42000)`, a syntax error. With the index in place, `EXPLAIN` for the original `YEAR()` query shows `type` = `ref` and `key` = `idx_transcripts_created_year`.

MySQL can also use an index on a generated column when the query expression matches the column's definition exactly.

The index must match the expression the query searches. For a year filter, I still try the range rewrite first, because it needs no extra index. The plain index on `created_at` also serves other ranges, such as one month or the last seven days. The `YEAR()` index serves only queries that filter on `YEAR(created_at)`, and every extra index adds work to each insert.

## If you use PostgreSQL

The PostgreSQL 17 test table has the same shape: `created_at` is `timestamp`, there are 200,048 rows, the same extra row is at `23:59:59.500`, and the three counts are again 20,011, 20,011 and 20,010.

PostgreSQL has no `YEAR()` function:

```text
ERROR:  function year(timestamp without time zone) does not exist
```

The same filter uses `EXTRACT`, and the plan is a sequential scan:

```sql
EXPLAIN SELECT * FROM transcripts
WHERE EXTRACT(YEAR FROM created_at) = 2026;
```

```text
 Gather  (cost=1000.00..5139.13 rows=1000 width=63)
   Workers Planned: 1
   ->  Parallel Seq Scan on transcripts  (cost=0.00..4039.13 rows=588 width=63)
         Filter: (EXTRACT(year FROM created_at) = '2026'::numeric)
```

The range query works unchanged, and both boundaries appear in the `Index Cond` line:

```text
 Index Scan using idx_created on transcripts  (cost=0.42..857.80 rows=20069 width=63)
   Index Cond: ((created_at >= '2026-01-01 00:00:00'::timestamp without time zone) AND (created_at < '2027-01-01 00:00:00'::timestamp without time zone))
```

Look at `rows=1000` in the `EXTRACT` plan. 20,011 rows matched. PostgreSQL keeps statistics on `created_at`, but not on the year computed from it, so the planner used a default estimate.

PostgreSQL supports indexes on expressions:

```sql
CREATE INDEX idx_transcripts_created_year
  ON transcripts ((EXTRACT(YEAR FROM created_at)));
```

After this index and an `ANALYZE`, the `EXTRACT` query uses the new index:

```text
 Index Scan using idx_transcripts_created_year on transcripts  (cost=0.42..812.71 rows=20245 width=63)
   Index Cond: (EXTRACT(year FROM created_at) = '2026'::numeric)
```

The estimate also changed, from 1,000 to 20,245. [`pg_statistic`](https://www.postgresql.org/docs/current/catalog-pg-statistic.html) "also stores statistical data about the values of index expressions," so `ANALYZE` now collects statistics on the year.

PostgreSQL `timestamp` keeps microseconds, so the closed range `<= '2026-12-31 23:59:59'` misses the `.500` row here too.

`timestamptz` is different. The same expression index on a `timestamptz` column fails:

```text
ERROR:  functions in index expression must be marked IMMUTABLE
```

The year of a `timestamptz` value depends on the session's `TimeZone` setting, so the expression is not immutable. That setting also changes how PostgreSQL reads a literal. With `TimeZone` set to `Asia/Dhaka`, `'2026-01-01 00:00:00'::timestamptz` is `2025-12-31 18:00:00` in UTC. For `timestamptz` columns, write the boundaries with an explicit offset, such as `'2026-01-01 00:00:00+00'`, or set the session time zone first.

## The question I ask now

Functions in a `WHERE` clause are sometimes necessary. An expression index may be the right design for a query the application runs often.

But when I see `LOWER(email)`, a `CAST` on `order_id`, date arithmetic on `created_at`, or a year taken from `created_at` inside a predicate, I pause. I ask four questions:

1. Does the index store the value the predicate searches?
2. Can I move the transformation to the constant side and compare the column directly?
3. Would an expression index or generated column better match the real access pattern?
4. Does `EXPLAIN` show the access path I expected?

The last question matters most. A rewrite is only a hypothesis until the execution plan confirms it.

In MySQL, check the `type` column of the `EXPLAIN` output. `ALL` is a full table scan, `index` is a full index scan, and `range` and `ref` read only part of an index. In PostgreSQL, look for `Index Scan`, `Index Only Scan`, or `Bitmap Index Scan` instead of `Seq Scan` or `Parallel Seq Scan`.

Some common rewrites, in MySQL syntax:

| Instead of | Try |
|---|---|
| `YEAR(created_at) = 2026` | `created_at >= '2026-01-01' AND created_at < '2027-01-01'` |
| `DATE(created_at) = '2026-03-15'` | `created_at >= '2026-03-15' AND created_at < '2026-03-16'` |
| `created_at + INTERVAL 7 DAY > NOW()` | `created_at > NOW() - INTERVAL 7 DAY` |
| `CAST(order_id AS CHAR) = '42'` | `order_id = 42` |
| `LOWER(email) = 'a@example.com'` | MySQL: `email = 'a@example.com'`, if the column uses a case-insensitive collation such as the default `utf8mb4_0900_ai_ci`. PostgreSQL: an index on `lower(email)`, or the `citext` type. |

Before I learned the word SARGability, I saw these rewrites as separate tricks. Now I see the rule that connects them.

My index on `created_at` was there the whole time. That was never the whole question. The question is whether the predicate lets the database search it.

## Further reading

- [MySQL range optimization](https://dev.mysql.com/doc/refman/8.4/en/range-optimization.html)
- [MySQL B-tree column indexes](https://dev.mysql.com/doc/refman/8.4/en/column-indexes.html)
- [MySQL CREATE INDEX: functional key parts](https://dev.mysql.com/doc/refman/8.4/en/create-index.html)
- [MySQL optimizer use of generated column indexes](https://dev.mysql.com/doc/refman/8.4/en/generated-column-index-optimizations.html)
- [MySQL EXPLAIN output format](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)
- [MySQL fractional seconds in time values](https://dev.mysql.com/doc/refman/8.4/en/fractional-seconds.html)
- [PostgreSQL index types](https://www.postgresql.org/docs/current/indexes-types.html)
- [PostgreSQL indexes on expressions](https://www.postgresql.org/docs/current/indexes-expressional.html)
- [PostgreSQL: using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- [PostgreSQL: statistics used by the planner](https://www.postgresql.org/docs/current/planner-stats.html)
