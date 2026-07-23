#!/bin/bash
# Pre-deploy gate — run before every production deploy.
# If any check fails, the deploy is blocked.
# Usage: bash scripts/pre-deploy-gate.sh
set -e

echo "=== TUF Ops Pre-Deploy Gate ==="
echo ""

FAILURES=0

# [1] TypeScript typecheck
echo -n "[1/6] TypeScript typecheck... "
if npx tsc --noEmit -p apps/api/tsconfig.json 2>/dev/null && \
   npx tsc --noEmit -p apps/web/tsconfig.json 2>/dev/null; then
    echo "PASS"
else
    echo "FAIL"
    FAILURES=$((FAILURES + 1))
fi

# [2] Production build
echo -n "[2/6] Production build... "
if pnpm run build 2>&1 | grep -q "built in"; then
    echo "PASS"
else
    echo "FAIL"
    FAILURES=$((FAILURES + 1))
fi

# [3] Lint
echo -n "[3/6] ESLint... "
if npx eslint apps/web/src/services/organizationsService.ts \
            apps/web/src/services/opportunitiesService.ts \
            apps/web/src/services/ordersService.ts \
            apps/web/src/services/orderWorkflow.ts \
            2>/dev/null; then
    echo "PASS"
else
    echo "WARN (non-blocking)"
fi

# [4] API regression test
echo -n "[4/6] API regression test... "
if python3 scripts/regression_test.py 2>/dev/null; then
    echo "PASS"
else
    echo "FAIL"
    FAILURES=$((FAILURES + 1))
fi

# [5] API hardening test
echo -n "[5/6] API hardening test... "
if python3 scripts/e2e_hardening_test.py 2>/dev/null; then
    echo "PASS"
else
    echo "FAIL"
    FAILURES=$((FAILURES + 1))
fi

# [6] API smoke test
echo -n "[6/6] API smoke test... "
if python3 scripts/crm_smoke_test.py 2>/dev/null; then
    echo "PASS"
else
    echo "FAIL"
    FAILURES=$((FAILURES + 1))
fi

echo ""
echo "=== Result: $FAILURES failure(s) ==="
if [ $FAILURES -gt 0 ]; then
    echo "BLOCKED — fix failures before deploying"
    exit 1
else
    echo "READY — safe to deploy"
fi
