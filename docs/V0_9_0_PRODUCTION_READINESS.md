# v0.9.0 Production Readiness — Academy Gate

## App authority

- **Authoritative production web app:** `apps/web` (Vite React). Root scripts `dev`, `dev:v1`, `build:v1`, `deploy:check:web`, and root `vercel.json` route the launchable app through the `web` workspace.
- **Authoritative backend API:** `apps/api` (Fastify). The API owns database-backed training, orders, commissions, and reporting metrics.
- **Non-authoritative legacy app:** `apps/frontend` (Next.js) is not the current production authority for v0.9.0 launch readiness. Do not duplicate launch-critical gating or metric logic there unless deployment authority changes.

## Seed and data safety

- Destructive database reset is blocked whenever `NODE_ENV`, `VERCEL_ENV`, `APP_ENV`, `RAILWAY_ENVIRONMENT`, or `RAILWAY_ENVIRONMENT_NAME` is `production`/`prod`.
- Production-safe baseline seed paths must be idempotent upserts only: approved users/roles, training enrollments, real business lead/account baseline data, and no mock orders/opportunities/commissions.
- Test-account seed requires `TEST_ACCOUNT_CREDENTIAL`; default credentials are not embedded.

## Academy phase alignment

Persisted Academy phases are aligned to the v0.9.0 frontend contract:

1. `LEVEL_1_OPERATOR`
2. `LEVEL_2_PRODUCT`
3. `LEVEL_3_TERRITORY`
4. `LEVEL_4_SALES`
5. `LEVEL_5_EXPANSION`
6. `SPECIALIZED_TRACKS`
7. `LEVEL_7_DIRECTOR`
8. `MARKET_MASTERY`

Migration `1900000009000_v090_production_readiness_gates.js` maps legacy phase data (`DAY_1`, `DAY_1_2`, `WEEK_1_2`, `MONTH_1`) to the new canonical values before applying stricter constraints.

## Certification and CRM gate

In production, rep certification is database-backed only. Local/demo fallback may be used for read-only preview content, but it is not a valid production certification source.

CRM unlock for reps requires all of the following:

- all required Academy modules complete,
- practical exercise complete,
- director sign-off complete.

Directors/admins may bypass the rep onboarding gate for appropriate management functions; rep sales access remains gated.

## Dashboard source of truth

Backend reporting service now owns launch-critical metrics for rep, director, admin/owner, school coverage, and commissions:

- assigned schools,
- auditable touched schools,
- untouched schools,
- active opportunities,
- follow-ups due,
- action-needed items,
- closed-won count,
- paid order count,
- paid revenue,
- gross profit,
- rep commission estimate,
- director override estimate,
- month-to-date activity.

Touched means an auditable activity exists (`CALL`, `EMAIL`, `TEXT`, `MEETING`, `NOTE`, `OPPORTUNITY_ACTIVITY`, or `LOGGED_CONTACT`). Assignment alone is not touched.

## Commission/order launch rules

- Closed Won order creation is server-side and copies assigned rep/director scope to the order for visibility.
- Commission metrics are server-side and payment-gated to paid/fulfilled order statuses (`DELIVERED`, `COMPLETED`) for payable estimates.
- Director override estimates are hidden from reps.
- Rep commission estimates are hidden from director dashboard metrics to avoid exposing other reps' details.

## Remaining manual production steps before Monday

1. Apply migrations against production after confirming the database backup completed.
2. Run only production-safe baseline seeds; do not run reset/test-account/mock-data scripts in production.
3. Confirm environment variables: `NODE_ENV=production`, `VERCEL_ENV=production`, `APP_ENV=production`, API/database URLs, and credential secrets.
4. Complete the launch smoke checklist in `docs/V0_9_0_LAUNCH_SMOKE_TEST.md` with real admin/director/rep users.
