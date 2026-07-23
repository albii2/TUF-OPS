#!/bin/bash
# Pre-deploy gate — run before every production deploy.
# If any check fails, the deploy is blocked.
# Usage: bash scripts/pre-deploy-gate.sh
set -e

echo "=== TUF Ops Pre-Deploy Gate ==="
echo ""

FAILURES=0

# 1. TypeScript compilation
echo -n "[1/4] TypeScript typecheck... "
if npx tsc --noEmit -p apps/api/tsconfig.json 2>/dev/null && \
   npx tsc --noEmit -p apps/web/tsconfig.json 2>/dev/null; then
    echo "PASS"
else
    echo "FAIL"
    FAILURES=$((FAILURES + 1))
fi

# 2. Production build
echo -n "[2/4] Production build... "
if pnpm run build 2>&1 | grep -q "built in"; then
    echo "PASS"
else
    echo "FAIL"
    FAILURES=$((FAILURES + 1))
fi

# 3. Lint
echo -n "[3/4] ESLint... "
if npx eslint apps/web/src/services/organizationsService.ts \
            apps/web/src/services/opportunitiesService.ts \
            apps/web/src/services/ordersService.ts \
            apps/web/src/services/orderWorkflow.ts \
            apps/web/src/services/roleScope.ts \
            apps/api/src/modules/intake/intake.service.ts \
            apps/api/src/modules/users/users.service.ts \
            2>/dev/null; then
    echo "PASS"
else
    echo "WARN (non-blocking)"
fi

# 4. CRM regression test (against production)
echo "[4/4] CRM regression test (production)... "
if python3 scripts/regression_test.py 2>/dev/null; then
    echo "PASS"
else
    echo "FAIL — CRM workflows broken in production"
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
