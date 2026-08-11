#!/bin/bash
set -e

BASE="https://ops.tufsports.us/api/v1"

# Login as Ryan
echo "=== LOGIN ==="
RESP=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"credential":"6350"}')
TOKEN=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Login OK, token length=${#TOKEN}"

# Step 1: Get current stage of opp 1327
echo ""
echo "=== CURRENT STATE ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/opportunities/1327" | python3 -c "
import sys,json
o=json.load(sys.stdin)
print(f\"  id={o['id']} stage={o['stage']} name={o['name']}\")
"

# Step 2: proposal_sent → negotiation (DISCOVERY → MOCKUP_STAGE)
echo ""
echo "=== Step 2: proposal_sent → negotiation ==="
curl -s -w "\nHTTP_STATUS: %{http_code}" -X PUT "$BASE/opportunities/1327/stage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage":"negotiation"}'
echo ""

# Step 3: negotiation → order_assembly (MOCKUP_STAGE → INVOICE_SENT)
echo ""
echo "=== Step 3: negotiation → order_assembly ==="
curl -s -w "\nHTTP_STATUS: %{http_code}" -X PUT "$BASE/opportunities/1327/stage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage":"order_assembly"}'
echo ""

# Step 4: Try skipping a stage (should fail)
echo ""
echo "=== Step 4: order_assembly → delivered (SKIP - should fail) ==="
curl -s -w "\nHTTP_STATUS: %{http_code}" -X PUT "$BASE/opportunities/1327/stage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage":"delivered"}'
echo ""

# Step 5: Go back to lead on a different opp and try LEAD_ENGAGED→DISCOVERY→MOCKUP_STAGE→INVOICE_SENT with frontend stage names
echo ""
echo "=== Step 5: Try frontend stage names on opp 1323 (lead) ==="
curl -s -w "\nHTTP_STATUS: %{http_code}" -X PUT "$BASE/opportunities/1323/stage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage":"DISCOVERY"}'
echo ""

echo ""
echo "=== DONE ==="
