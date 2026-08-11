#!/bin/bash
set -euo pipefail
BASE="https://terrific-patience-production-bc32.up.railway.app"
FRONTEND="https://ops.tufsports.us"
PASS=0
FAIL=0

check() {
  local label="$1"
  local url="$2"
  local expected="$3"
  local resp
  resp=$(curl -s -w "%{http_code}" -o /tmp/tuf-check.txt "$url" 2>/dev/null)
  local code="${resp: -3}"
  if [ "$code" = "$expected" ]; then
    echo "PASS: $label ($code)"
    PASS=$((PASS+1))
  else
    echo "FAIL: $label (got $code, expected $expected)"
    FAIL=$((FAIL+1))
  fi
}

echo "=== TUF Ops Deployment Verification ==="
check "API health"         "$BASE/health"       "200"
check "Frontend"           "$FRONTEND"           "200"
echo "---"
echo "$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] && echo "DEPLOY VERIFIED" || echo "DEPLOY FAILED"
exit $FAIL
