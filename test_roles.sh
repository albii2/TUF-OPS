#!/bin/bash
set -euo pipefail

BASE="https://terrific-patience-production-bc32.up.railway.app"

# Login and get tokens
ADMIN_TOKEN=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d '{"credential":"8188"}' | jq -r '.token')
DIR_TOKEN=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d '{"credential":"7288"}' | jq -r '.token')
REP_TOKEN=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d '{"credential":"5080"}' | jq -r '.token')

echo "Tokens acquired. Admin=${#ADMIN_TOKEN} chars, Dir=${#DIR_TOKEN} chars, Rep=${#REP_TOKEN} chars"
echo ""

# Helper functions
call() {
  local method="$1" url="$2" token="$3" body="${4:--}"
  if [ "$body" = "-" ]; then
    RESPONSE=$(curl -s -X "$method" -H "Authorization: Bearer *** -w "\n%{http_code}" "$url")
  else
    RESPONSE=$(curl -s -X "$method" -H "Authorization: Bearer *** -H "Content-Type: application/json" -d "$body" -w "\n%{http_code}" "$url")
  fi
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  echo "HTTP: $HTTP_CODE"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
}

call_notoken() {
  local method="$1" url="$2" body="${3:--}"
  if [ "$body" = "-" ]; then
    RESPONSE=$(curl -s -X "$method" -w "\n%{http_code}" "$url")
  else
    RESPONSE=$(curl -s -X "$method" -H "Content-Type: application/json" -d "$body" -w "\n%{http_code}" "$url")
  fi
  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  echo "HTTP: $HTTP_CODE"
  echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
}

echo "============================================"
echo "  ADMIN TESTS (all should return 200)"
echo "============================================"

echo ""
echo "--- GET /api/users ---"
call "GET" "$BASE/api/users" "$ADMIN_TOKEN"

echo ""
echo "--- GET /api/organizations ---"
call "GET" "$BASE/api/organizations" "$ADMIN_TOKEN"

echo ""
echo "--- GET /api/opportunities ---"
call "GET" "$BASE/api/opportunities" "$ADMIN_TOKEN"

echo ""
echo "--- GET /api/dashboard ---"
call "GET" "$BASE/api/dashboard" "$ADMIN_TOKEN"

echo ""
echo "--- PUT /api/users/56 {territory:north} ---"
call "PUT" "$BASE/api/users/56" "$ADMIN_TOKEN" '{"territory":"north"}'

echo ""
echo "============================================"
echo "  DIRECTOR TESTS"
echo "============================================"

echo ""
echo "--- GET /api/users ---"
call "GET" "$BASE/api/users" "$DIR_TOKEN"

echo ""
echo "--- GET /api/organizations ---"
call "GET" "$BASE/api/organizations" "$DIR_TOKEN"

echo ""
echo "--- GET /api/opportunities ---"
call "GET" "$BASE/api/opportunities" "$DIR_TOKEN"

echo ""
echo "--- POST /api/organizations (create) ---"
call "POST" "$BASE/api/organizations" "$DIR_TOKEN" '{"name":"DirectorTestOrg"}'

echo ""
echo "--- GET /api/dashboard ---"
call "GET" "$BASE/api/dashboard" "$DIR_TOKEN"

echo ""
echo "============================================"
echo "  REP TESTS (most restricted)"
echo "============================================"

echo ""
echo "--- GET /api/organizations ---"
call "GET" "$BASE/api/organizations" "$REP_TOKEN"

echo ""
echo "--- GET /api/opportunities ---"
call "GET" "$BASE/api/opportunities" "$REP_TOKEN"

echo ""
echo "--- GET /api/users ---"
call "GET" "$BASE/api/users" "$REP_TOKEN"

echo ""
echo "--- POST /api/users (should be 403) ---"
call "POST" "$BASE/api/users" "$REP_TOKEN" '{"name":"testuser","email":"test@test.com"}'

echo ""
echo "--- PUT /api/users/54 (should be denied) ---"
call "PUT" "$BASE/api/users/54" "$REP_TOKEN" '{"territory":"hack"}'

echo ""
echo "--- GET /api/dashboard ---"
call "GET" "$BASE/api/dashboard" "$REP_TOKEN"

echo ""
echo "============================================"
echo "  NEGATIVE TESTS (no auth / bad auth)"
echo "============================================"

echo ""
echo "--- GET /api/organizations (no token) ---"
call_notoken "GET" "$BASE/api/organizations"

echo ""
echo "--- GET /api/users (garbage token) ---"
RESPONSE=$(curl -s -X GET -H "Authorization: Bearer *** -w "\n%{http_code}" "$BASE/api/users")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "HTTP: $HTTP_CODE"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

echo ""
echo "--- POST /api/work-items (no token) ---"
call_notoken "POST" "$BASE/api/work-items" '{"test":true}'

echo ""
echo "============================================"
echo "  DONE"
echo "============================================"
