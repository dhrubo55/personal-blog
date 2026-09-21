+++
category = ["SQL", "Databases", "Performance"]
date = 2026-09-21T00:00:00+06:00
description = "Why applying a function to an indexed column can block a direct index range lookup, and how a SARGable predicate changes the access path."
draft = true
ShowToc = true
TocOpen = false
slug = "sql/sargability"
summary = "The index was there, but the query still scanned. The reason gave me a name for a SQL optimization I had already used: SARGability."
topics = ["Databases & SQL"]
title = "SARGability: the SQL optimization I knew before I knew its name"
[cover]
alt = ""
caption = ""
image = ""
relative = false
+++

Recently while rewriting a sql query found a term in chatgpts output. #sargability. I was like what is this? but the when chatgpt explained the term i was like i usually use this techinque when writing range queries. Lets explore what I am talking about with an example

```sql
SELECT *
FROM transcripts
WHERE YEAR(createdAt) = 2026;
```

I knew the rewrite I would try. I had made similar changes before. What I did not know was that the idea behind the rewrite had a name.

**SARGability**

Lets understand how does B-Tree handles Indexes first

## Picture the index as a phonebook

Many ordinary database indexes use a B-tree. Assume that the index on `createdAt` does. A phonebook gives us a useful picture of how its order helps.

Picture a thick phonebook open on a desk. Every surname appears in alphabetical order.

If you want everyone named Smith, you do not read from the first page. You open the book near the S section, then you go for SM and then find the first Smith, and keep reading until the surnames change.

```text
A ... R | Smith, Smith, Smithson | T ... Z
          ^ start here             ^ stop here
```

Now change the question. Find every surname with exactly five letters.

The alphabetical order no longer tells you where to begin. Adams qualifies. Brown qualifies. Smith qualifies. Other five-letter names are scattered through the book. You have to inspect each name and count its letters.

```text
Adams -> count 5 -> keep
Brown -> count 5 -> keep
Ng    -> count 2 -> skip
Smith -> count 5 -> keep
...
```

The phonebook still has an order. The new question cannot use that order to narrow the search.

`YEAR(createdAt) = 2026` creates the same mismatch. The B-tree contains full timestamp values in order. It does not contain the result of `YEAR(createdAt)` unless I created an index for that expression.

With only the regular indexes the database cannot use this predicate as a direct timestamp range. It might need to inspect many index entries or rows and evaluate `YEAR()` for each one. If no other condition narrows the work, that can mean a full index scan or a full table scan.

The exact plan depends on the database and its optimizer.

## Ask the right question

The name SARGability comes from **search argumentable**. A predicate is SARGable when the database can use it as an efficient search condition for an appropriate index.

For this example, I can express the same request as a range:

```sql
SELECT *
FROM transcripts
WHERE createdAt >= '2026-01-01 00:00:00'
  AND createdAt <  '2027-01-01 00:00:00';
```

Now the predicate compares the indexed column with two constant values. The order of the B-tree becomes useful again.

here are some visualizations that might help you to get it better. 



The database can seek to the lower boundary, read the matching entries, and stop at the upper boundary. MySQL calls this its `range` access method. One index retrieves rows from one or more value intervals.

The half-open interval matters. Using `< '2027-01-01'` includes every timestamp in 2026 without depending on the column's fractional-second precision. A condition such as `<= '2026-12-31 23:59:59'` can miss values when the column stores smaller units.

If `createdAt` uses UTC but "2026" means a local business year, calculate the two UTC boundaries first. Then compare the unchanged column with those values.

## A usable index is not a chosen index

A SARGable predicate makes an index-based path possible. It does not force the optimizer to choose that path.

If most of the table contains rows from 2026, scanning the table may cost less than following the index and fetching nearly every row. Table size, data distribution, selected columns, index coverage, and database statistics all affect the decision.

So we can assume that "The rewritten query gives the optimizer a direct index range it can consider."

Nor does a non-SARGable predicate guarantee one kind of scan. Some databases transform specific expressions. Others support expression indexes or generated columns. PostgreSQL, for example, can use an index on `lower(email)` for a search on `lower(email)`. MySQL can consider an indexed generated column when the query expression matches its definition.

The index must match the expression the query searches.

## The question I ask now

The lesson is not "never use a function in a `WHERE` clause." Functions are sometimes necessary. An expression index may be the right design for a query the application runs often.

But when I see `LOWER(email)`, `CAST(order_id AS CHAR)`, arithmetic on `price`, or `YEAR(createdAt)` inside a predicate, I pause. I ask four questions:

1. Does the index store the value the predicate searches?
2. Can I move the transformation to the constant side and compare the column directly?
3. Would an expression index or generated column better match the real access pattern?
4. Does `EXPLAIN` show the access path I expected?

The last question matters most. A rewrite is only a hypothesis until the execution plan confirms it.

Before I learned the word SARGability, I saw these rewrites as separate tricks. Now I see the rule that connects them.

The index was there. That was never the whole question. The question is whether the predicate lets the database search it.

## Further reading

- [MySQL range optimization](https://dev.mysql.com/doc/refman/8.4/en/range-optimization.html)
- [MySQL B-tree column indexes](https://dev.mysql.com/doc/refman/8.4/en/column-indexes.html)
- [PostgreSQL indexes on expressions](https://www.postgresql.org/docs/current/indexes-expressional.html)
