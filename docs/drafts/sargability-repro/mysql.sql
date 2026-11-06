SET SESSION cte_max_recursion_depth = 300000;
CREATE TABLE transcripts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  body VARCHAR(100),
  created_at DATETIME(3) NOT NULL,
  KEY idx_created (created_at)
);
INSERT INTO transcripts (body, created_at)
WITH RECURSIVE seq(n) AS (SELECT 0 UNION ALL SELECT n + 1 FROM seq WHERE n < 199999)
SELECT REPEAT('x', 50), TIMESTAMP('2020-01-01') + INTERVAL (n * 1576) SECOND FROM seq;
INSERT INTO transcripts (body, created_at) VALUES ('frac', '2026-12-31 23:59:59.500');
ANALYZE TABLE transcripts;
SELECT MIN(created_at), MAX(created_at), COUNT(*) FROM transcripts;
SELECT '--- 1. YEAR() plan';
EXPLAIN SELECT * FROM transcripts WHERE YEAR(created_at) = 2026;
SELECT '--- 2. range plan';
EXPLAIN SELECT * FROM transcripts WHERE created_at >= '2026-01-01 00:00:00' AND created_at < '2027-01-01 00:00:00';
SELECT '--- 3. counts: YEAR vs half-open vs <= 23:59:59';
SELECT (SELECT COUNT(*) FROM transcripts WHERE YEAR(created_at) = 2026) AS by_year,
       (SELECT COUNT(*) FROM transcripts WHERE created_at >= '2026-01-01 00:00:00' AND created_at < '2027-01-01 00:00:00') AS half_open,
       (SELECT COUNT(*) FROM transcripts WHERE created_at >= '2026-01-01 00:00:00' AND created_at <= '2026-12-31 23:59:59') AS closed;
SELECT '--- 4. wide range (90%) plan';
EXPLAIN SELECT * FROM transcripts WHERE created_at >= '2021-01-01 00:00:00' AND created_at < '2030-01-01 00:00:00';
SELECT '--- 5. covering: SELECT created_at with YEAR()';
EXPLAIN SELECT created_at FROM transcripts WHERE YEAR(created_at) = 2026;
SELECT '--- 6. functional index';
CREATE INDEX idx_transcripts_created_year ON transcripts ((YEAR(created_at)));
ANALYZE TABLE transcripts;
EXPLAIN SELECT * FROM transcripts WHERE YEAR(created_at) = 2026;
SELECT '--- 6b. functional index without extra parens';
CREATE INDEX idx_bad ON transcripts (YEAR(created_at));
SELECT '--- 7. TIMESTAMP literal read in session tz';
CREATE TABLE tz (ts TIMESTAMP);
SET time_zone = '+06:00';
INSERT INTO tz VALUES ('2026-01-01 00:00:00');
SET time_zone = '+00:00';
SELECT ts AS stored_as_utc FROM tz;
SELECT '--- 8. DATETIME(0) rounding';
CREATE TABLE r (d DATETIME);
INSERT INTO r VALUES ('2026-12-31 23:59:59.500');
SELECT d FROM r;
