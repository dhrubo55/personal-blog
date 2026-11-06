# SARGability post: reproduction scripts

The test-table numbers in `docs/drafts/sargability-v2.md` come from these scripts. A Claude session generated them and ran them in Docker on 2026-09-28. The data is generated, not production data. The runs used plain `EXPLAIN`, so the output has no timings.

- `mysql.sql` → `mysql.out` (MySQL 8.4, database `blog`)
- `pg.sql` → `pg.out` (PostgreSQL 17.11)

To rerun them:

```sh
docker run -d --name sarg-mysql -e MYSQL_ROOT_PASSWORD=pw -e MYSQL_DATABASE=blog mysql:8.4
docker exec -i sarg-mysql mysql -uroot -ppw --force blog < mysql.sql > mysql.out 2>&1

docker run -d --name sarg-pg -e POSTGRES_PASSWORD=pw postgres:17
docker exec -i sarg-pg psql -U postgres < pg.sql > pg.out 2>&1
```

Wait until each server accepts connections before running its script. `--force` is needed because step 6b in `mysql.sql` fails on purpose. To get timings, change `EXPLAIN` to `EXPLAIN ANALYZE`.
