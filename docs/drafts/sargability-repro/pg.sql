\pset pager off
SELECT version();
CREATE TABLE transcripts (id serial PRIMARY KEY, body text, created_at timestamp NOT NULL);
INSERT INTO transcripts (body, created_at)
SELECT repeat('x', 50), ts FROM generate_series('2020-01-01'::timestamp, '2029-12-28'::timestamp, interval '1576 seconds') ts;
INSERT INTO transcripts (body, created_at) VALUES ('frac', '2026-12-31 23:59:59.500');
CREATE INDEX idx_created ON transcripts (created_at);
ANALYZE transcripts;
SELECT count(*) FROM transcripts;
\echo --- 1. EXTRACT plan
EXPLAIN SELECT * FROM transcripts WHERE EXTRACT(YEAR FROM created_at) = 2026;
\echo --- 1b. YEAR() in postgres
SELECT * FROM transcripts WHERE YEAR(created_at) = 2026;
\echo --- 2. range plan
EXPLAIN SELECT * FROM transcripts WHERE created_at >= '2026-01-01 00:00:00' AND created_at < '2027-01-01 00:00:00';
\echo --- 3. counts
SELECT (SELECT count(*) FROM transcripts WHERE EXTRACT(YEAR FROM created_at) = 2026) AS by_year,
       (SELECT count(*) FROM transcripts WHERE created_at >= '2026-01-01 00:00:00' AND created_at < '2027-01-01 00:00:00') AS half_open,
       (SELECT count(*) FROM transcripts WHERE created_at >= '2026-01-01 00:00:00' AND created_at <= '2026-12-31 23:59:59') AS closed;
\echo --- 4. wide range plan
EXPLAIN SELECT * FROM transcripts WHERE created_at >= '2021-01-01 00:00:00' AND created_at < '2030-01-01 00:00:00';
\echo --- 5. covering with EXTRACT
VACUUM transcripts;
EXPLAIN SELECT created_at FROM transcripts WHERE EXTRACT(YEAR FROM created_at) = 2026;
\echo --- 6. expression index on timestamp
CREATE INDEX idx_transcripts_created_year ON transcripts ((EXTRACT(YEAR FROM created_at)));
ANALYZE transcripts;
EXPLAIN SELECT * FROM transcripts WHERE EXTRACT(YEAR FROM created_at) = 2026;
\echo --- 7. expression index on timestamptz
CREATE TABLE tz (created_at timestamptz);
CREATE INDEX ON tz ((EXTRACT(YEAR FROM created_at)));
\echo --- 8. timestamptz literal read in session TimeZone
SET TimeZone = 'Asia/Dhaka';
SELECT ('2026-01-01 00:00:00'::timestamptz AT TIME ZONE 'UTC') AS as_utc;
