# CTO SOP: Railway Data Protection & Daily Backup Assurance

## Objective
Guarantee that TUF Ops lead/opportunity data is durable, recoverable, and auditable for daily operations.

## Production Source of Truth
- Railway Postgres is authoritative.
- Frontend/local storage should never be treated as a backup.

## Required Railway Configuration
1. Enable automatic Postgres backups in Railway.
2. Retention: minimum 7 days (recommended 30 days).
3. Add env var to API service:
   - `BACKUP_LAST_SUCCESS_AT` (set by your backup automation daily).

## Daily Backup Verification (Owner/CTO)
1. Open `/data-health` in web app.
2. Confirm:
   - status = `ok`
   - backup timestamp is within last 24h
   - counts are non-zero and trend logically:
     - organizations
     - opportunities
     - users

## Daily Automated DB Health Check
- Endpoint: `GET /health/data`
- Create external daily job (GitHub Action/Cron) that:
  1. calls `/health/data`
  2. checks backup age < 24 hours
  3. alerts Slack/Email if stale or failed

## Weekly Restore Drill (Required)
1. Restore latest backup to a temporary Railway Postgres service.
2. Run quick verification SQL:
   - `select count(*) from organizations;`
   - `select count(*) from opportunities;`
   - `select count(*) from users;`
3. Log restore result in ops journal.

## Incident Procedure
If backup age > 24h or endpoint fails:
1. Freeze schema migrations.
2. Snapshot database immediately.
3. Investigate backup pipeline.
4. Run restore test before resuming normal operation.

## KPI Governance
Review daily in leadership standup:
- organizations count delta
- opportunities count delta
- unassigned lead count
- stale opportunities count

