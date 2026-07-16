#!/bin/bash
# TUF Ops database backup script — runs pg_dump using Railway-provided DATABASE_PUBLIC_URL
set -euo pipefail
BACKUP_DIR="$HOME/tuf-ops-backups"
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/tuf-ops-$STAMP.dump"

if [ -z "${DATABASE_PUBLIC_URL:-}" ]; then
  echo "ERROR: DATABASE_PUBLIC_URL not set (run via: railway run --service Postgres -- bash backup-db.sh)"
  exit 1
fi

PG_DUMP="/opt/homebrew/opt/libpq/bin/pg_dump"
PG_RESTORE="/opt/homebrew/opt/libpq/bin/pg_restore"
"$PG_DUMP" "$DATABASE_PUBLIC_URL" --no-owner --format=custom --file="$OUT"
SIZE=$(du -h "$OUT" | cut -f1)
TABLES=$("$PG_RESTORE" --list "$OUT" | grep -c "TABLE DATA" || true)
echo "Backup OK: $OUT ($SIZE, $TABLES tables with data)"

# Retention: keep last 14 backups
ls -t "$BACKUP_DIR"/tuf-ops-*.dump 2>/dev/null | tail -n +15 | xargs rm -f 2>/dev/null || true
