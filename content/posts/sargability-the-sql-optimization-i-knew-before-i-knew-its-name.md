+++
category = ["SQL", "Databases", "Performance"]
date = 2026-09-21T00:00:00+06:00
description = "Why a function on an indexed column can block an index range lookup in MySQL and PostgreSQL, and how rewriting the predicate as a range lets the optimizer consider the index."
draft = true
ShowToc = true
TocOpen = false
slug = "sql/sargability"
summary = "The index was there, but the query still scanned. ChatGPT explained why, and gave me a name for a rewrite I already used: SARGability."
topics = ["Databases & SQL"]
title = "SARGability: the SQL optimization I knew before I knew its name"
[cover]
alt = ""
caption = ""
image = ""
relative = false
+++
Recently, while rewriting a SQL query, I found a term in ChatGPT's output: SARGability. I had never heard of it. When ChatGPT explained it, I thought this technique I used quite often when I wrote range queries. I just did not know it had a name.

This post explains why a function on an indexed column can stop the database from using the index for a range lookup, and how to rewrite the query so it can. Each example shows MySQL 8.4 and PostgreSQL.

Here is the kind of query I was rewriting. In MySQL:

```sql
SELECT *
FROM transcripts
WHERE YEAR(created_at) = 2026;
```

PostgreSQL has no `YEAR()` function. The same filter uses `EXTRACT`:

```sql
SELECT *
FROM transcripts
WHERE EXTRACT(YEAR FROM created_at) = 2026;
```

The `transcripts` table had an index on `created_at`, but `EXPLAIN` showed a full table scan. I knew the rewrite I would try, because I had made similar changes before. What I did not know was that the idea behind it had a name.

In the examples below, `created_at` is a `DATETIME` column in MySQL and a `timestamp` column in PostgreSQL. It holds UTC values and has a plain index.

To see why the rewrite works, start with how a B-tree index orders its values.

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



`YEAR(created_at) = 2026` creates the same mismatch, and so does the `EXTRACT` version. The B-tree stores full timestamp values in order. It does not store the year of each timestamp unless I create an index on that expression.

![B-tree index on the timestamp column, with leaf keys from 2025-11-03 to 2027-01-01 in order. The predicate YEAR(createdAt) = 2026 cannot be turned into a seek on those raw keys.](https://res.cloudinary.com/dlsxyts6o/image/upload/v1790919027/ChatGPT_Image_Oct_2_2026_10_30_34_AM-1_dypykp.png)

With only a plain index on `created_at`, the database cannot turn this predicate into a timestamp range. It has to compute the year for each row and compare it with 2026. If no other condition narrows the work, that means a full table scan, or a full index scan when the index holds every column the query needs.

![Table of eight rows from 2025 to 2027. The database computes YEAR() for every row and keeps only the three rows where the result is 2026.](https://res.cloudinary.com/dlsxyts6o/image/upload/v1790919023/ChatGPT_Image_Oct_2_2026_10_30_36_AM-2_riapb2.png)

The exact plan depends on the database and its optimizer.

## Rewrite the predicate as a range

SARG is short for *search argument*, a term from IBM's System R query optimizer ([Selinger et al., 1979](https://doi.org/10.1145/582095.582099)). A predicate is SARGable when the database can use it as a search argument for an index. In practice, the indexed column appears alone on one side of the comparison, and a constant appears on the other.

For this example, I can express the same request as a range. This query works in both MySQL and PostgreSQL:

```sql
SELECT *
FROM transcripts
WHERE created_at >= '2026-01-01 00:00:00'
  AND created_at <  '2027-01-01 00:00:00';
```

Now the predicate compares the indexed column with two constant values. The order of the B-tree becomes useful again.

![The same B-tree with the range query. The lower bound points at the 2026-01-01 leaf key and the upper bound at 2027-01-01, and the 2026 keys between them are highlighted.](https://res.cloudinary.com/dlsxyts6o/image/upload/v1790919027/ChatGPT_Image_Oct_2_2026_10_30_39_AM-3_vhbmwc.png)

The database can seek to the lower boundary, read the matching entries, and stop at the upper boundary. MySQL calls this the `range` access method. It uses one index to read the rows inside one or more intervals of index values. PostgreSQL shows the same work as an `Index Scan` or a `Bitmap Index Scan`, with both boundaries in the `Index Cond` line of the plan.

![Range seek in four steps: follow the tree from the root to the first key on or after 2026-01-01, read the keys in order, return their rows, and stop before 2027-01-01.](https://res.cloudinary.com/dlsxyts6o/image/upload/v1790919022/ChatGPT_Image_Oct_2_2026_10_30_40_AM-4_lyoi7p.png)

The range is half-open: it includes the lower boundary and excludes the upper one. `< '2027-01-01 00:00:00'` includes every timestamp in 2026, whatever the column's fractional-second precision. A condition such as `<= '2026-12-31 23:59:59'` can miss a row stamped `23:59:59.500` when the column stores fractional seconds. MySQL `DATETIME(3)` does, and so does PostgreSQL `timestamp`, which keeps microseconds by default.

Fractional seconds can also move a row into the wrong year before any query runs. A plain MySQL `DATETIME` column stores whole seconds, so MySQL rounds the fraction when the row is inserted. Insert `'2026-12-31 23:59:59.500'` and MySQL stores `2027-01-01 00:00:00`. Every query after that counts it as a 2027 row, and no `WHERE` clause can change that. If the fraction matters, give the column the precision you need, such as `DATETIME(3)`.

The boundaries also depend on time zones. Here, `created_at` holds UTC values. If "2026" means a local business year, calculate the two UTC boundaries first, then compare the unchanged column with them. For a business year in Dhaka (UTC+6), the range runs from `'2025-12-31 18:00:00'` to `'2026-12-31 18:00:00'`.

A MySQL `TIMESTAMP` column and a PostgreSQL `timestamptz` column work differently from `DATETIME` and `timestamp`. Both read a literal without an offset in the session time zone. For those types, write the boundaries in the session time zone, or set the session time zone to UTC first.

## A usable index is not a chosen index

A SARGable predicate makes an index-based path possible. It does not force the optimizer to choose that path.

If most rows in the table are from 2026, scanning the table may cost less than following the index and fetching nearly every row. Table size, data distribution, the selected columns, and the table statistics all affect the decision.

So the rewrite gives the optimizer an index range to consider. The optimizer still decides whether to use it.

A non-SARGable predicate does not guarantee a full scan either. Some optimizers rewrite a few specific expressions. SQL Server, for example, can still [seek an index on a `datetime` column](https://lobsterpot.com.au/blog/2021/03/09/beware-the-width-of-the-covering-range/) for `CAST(col AS date) = @d`. These rewrites are exceptions, and they differ between databases.

MySQL and PostgreSQL can also index the expression itself. MySQL 8.0.13 and later support functional key parts. The expression needs its own parentheses:

```sql
CREATE INDEX idx_transcripts_created_year
  ON transcripts ((YEAR(created_at)));
```

MySQL can also use an index on a generated column when the query expression matches the column's definition exactly.

PostgreSQL supports indexes on expressions:

```sql
CREATE INDEX idx_transcripts_created_year
  ON transcripts ((EXTRACT(YEAR FROM created_at)));
```

This works for a `timestamp` column. PostgreSQL rejects it for `timestamptz`, because index expressions must be immutable and the year of a `timestamptz` value depends on the session time zone.

In both databases, the index must match the expression the query searches. For a year filter, I still try the range rewrite first, because it needs no extra index.

## The question I ask now

Functions in a `WHERE` clause are sometimes necessary. An expression index may be the right design for a query the application runs often.

But when I see `LOWER(email)`, a `CAST` on `order_id`, arithmetic on `price`, or a year taken from `created_at` inside a predicate, I pause. I ask four questions:

1. Does the index store the value the predicate searches?
2. Can I move the transformation to the constant side and compare the column directly?
3. Would an expression index or generated column better match the real access pattern?
4. Does `EXPLAIN` show the access path I expected?

The last question matters most. A rewrite is only a hypothesis until the execution plan confirms it.

In MySQL, check the `type` column of the `EXPLAIN` output. `ALL` is a full table scan, `index` is a full index scan, and `range` is an index range scan. In PostgreSQL, look for `Index Scan`, `Index Only Scan`, or `Bitmap Index Scan` instead of `Seq Scan` or `Parallel Seq Scan`.

Before I learned the word SARGability, I saw these rewrites as separate tricks. Now I see the rule that connects them.

My index on `created_at` was there the whole time. It helps only when the predicate lets the database search it.

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

