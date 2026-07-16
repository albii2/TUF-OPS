# TUF Ops — Backup & Recovery

## Automated backups
- Daily at 06:00 local via Hermes cron (`tuf-ops-backup.sh`), runs `scripts/backup-db.sh` through `railway run --service Postgres`.
- Dumps stored in `~/tuf-ops-backups/` (custom format, `--no-owner`), retention: last 14.
- Verified 2026-07-16: 256K dump, 40 tables with data.

## Manual backup
```bash
cd <repo>
railway run --service Postgres -- bash scripts/backup-db.sh
```

## Restore procedure (rehearsed 2026-07-16 — PASS)
1. Pick a dump: `ls -t ~/tuf-ops-backups/`
2. Restore into a scratch DB to validate:
   ```bash
   createdb tuf_restore_test
   /opt/homebrew/opt/libpq/bin/pg_restore --no-owner --dbname=tuf_restore_test ~/tuf-ops-backups/<dump>
   psql tuf_restore_test -c "SELECT COUNT(*) FROM users"
   ```
3. To restore PRODUCTION (destructive — confirm with owner first):
   ```bash
   railway run --service Postgres -- /opt/homebrew/opt/libpq/bin/pg_restore \
     --no-owner --clean --if-exists --dbname="$DATABASE_PUBLIC_URL" ~/tuf-ops-backups/<dump>
   ```
4. Verify: `curl https://terrific-patience-production-bc32.up.railway.app/health` and spot-check org/user counts.

## Recovery time
- Dump size ~256K → restore completes in under 1 minute.
- Worst-case data loss window: 24h (daily schedule).

## Requirements
- `libpq` via Homebrew (pg_dump/pg_restore v18 to match Railway PG 18).
- Railway CLI linked to project "TUF Ops", environment production.
