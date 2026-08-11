#!/bin/bash
# Archive command for Postgres WAL files (writes to a safe local location)
# Usage: pgbackrest-archive-local.sh %p

set -uo pipefail

WAL_FILE="$1"
ARCHIVE_DIR="/var/lib/postgresql/data/wal_archive"

# quick input guard
if [ -z "${WAL_FILE:-}" ]; then
  echo "ERROR: missing WAL file path argument" >&2
  exit 1
fi

mkdir -p "$ARCHIVE_DIR" 2>/dev/null || true
cp "$WAL_FILE" "$ARCHIVE_DIR/" 2>/dev/null || exit 2
exit 0
