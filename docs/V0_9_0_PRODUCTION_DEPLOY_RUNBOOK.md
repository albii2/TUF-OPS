# v0.9.0 Production Deploy Runbook

**Date context:** Thursday, June 18, 2026.
**Launch rule:** TUF Academy can open first. CRM/live selling stays gated until production smoke testing confirms database-backed certification, route gating, real school visibility, order visibility, and commission correctness.

## A. Pre-merge checklist

1. Confirm the active PR branch and head SHA.
   ```bash
   git branch --show-current
   git rev-parse HEAD
   git log --oneline -5
   ```
2. Confirm TypeScript checks pass.
   ```bash
   pnpm --filter @apps/api exec tsc --noEmit
   pnpm --filter web exec tsc --noEmit
   ```
3. Confirm launch-safety scripts pass.
   ```bash
   node scripts/validate-touched-counts.js
   node scripts/validate-seed-safety.js
   node scripts/validate-v090-launch-safety.js
   node scripts/validate-v090-production-ready.js
   ```
4. Confirm no dependency-install noise is staged or committed.
   ```bash
   git status --short -- . ':(exclude)node_modules' ':(exclude)apps/api/node_modules' ':(exclude)packages/database/node_modules' ':(exclude)packages/logger/node_modules'
   git diff --cached --name-only
   ```
   Do not merge if staged files include `node_modules`, package-manager symlink churn, local env files, or generated build artifacts.
5. Confirm no production deployment will run mock/test-account seeds.
   - Allowed production seed/import paths are idempotent baseline lead/account/user/enrollment imports only.
   - Forbidden in production: database reset scripts, mock data scripts, test-account scripts, and anything requiring `ALLOW_TEST_ACCOUNT_SEED`.
   - `packages/database/seed_test_training_accounts.js` must require `TEST_ACCOUNT_CREDENTIAL`; it is not a production seed.

## B. Pre-deploy production backup

1. Take a production Postgres backup using the hosting provider controls or a controlled `pg_dump` from an approved admin machine.
2. Record the following before any migration:
   - Backup timestamp, including timezone.
   - Backup identifier / snapshot name.
   - Database service name and environment.
   - Operator who confirmed the backup.
3. Confirm restore is available before migration.
   - Verify the provider UI or CLI shows the backup as restorable.
   - Confirm the team knows whether restore is full-instance, database-level, or point-in-time.
   - Do not run migrations until restore capability is confirmed.

## C. Environment variable check

Confirm production values in Vercel/Railway/provider dashboards before deploy:

- `NODE_ENV=production`
- `VERCEL_ENV=production`
- `APP_ENV=production`
- Web API base URL, for example `VITE_API_BASE_URL=https://<production-api>/api/v1`
- Production API `DATABASE_URL` pointing to the production Postgres database
- Credential/secrets values used by auth and credential hashing
- Railway production env names if applicable:
  - `RAILWAY_ENVIRONMENT=production`
  - `RAILWAY_ENVIRONMENT_NAME=production`
- Seed credential env vars, only outside production/test-account workflows:
  - `TEST_ACCOUNT_CREDENTIAL` is required for test-account seed scripts and must not be used for production launch seeding.

## D. Merge/deploy sequence

1. Merge the PR only after all pre-merge checks pass and the production backup is confirmed.
2. Deploy backend API.
3. Deploy web app.
4. Confirm web app points to production API.
   - Open browser devtools/network and verify API requests target the production API base URL.
5. Confirm backend API points to production DB.
   - Use provider env var dashboard and a safe read-only health/data check.
   - Do not run destructive scripts as a connectivity check.

## E. Migration procedure

1. Run migrations only after the production backup is complete and restorable.
2. Identify migration command from root `package.json` scripts:
   - Standard migration: `pnpm -w run db:migrate`
   - Railway production helper if required by deployment process: `pnpm -w run db:migrate:railway:prod`
3. Confirm migration `packages/database/migrations/1900000009000_v090_production_readiness_gates.js` is included in the deployed commit.
4. The v0.9.0 readiness migration is designed to be idempotent:
   - checks table/column existence before phase mapping,
   - adds `users.practical_exercise_completed` and `users.certification_source` with `IF NOT EXISTS`,
   - adds order assignment columns with `IF NOT EXISTS`,
   - creates indexes with `IF NOT EXISTS`,
   - only updates `orders.updated_at` if that column exists.
5. If migration fails:
   - stop deploy/unlock activity immediately,
   - preserve the migration logs,
   - do not rerun blindly,
   - inspect whether failure happened before or after a transaction boundary,
   - roll back app deployment to previous known-good commit if the app is degraded,
   - restore DB from backup only if data/schema is unsafe and leadership approves restore.

## F. Seed/import rules

1. Run only production-safe baseline imports:
   - real lead/account baseline data,
   - approved production users/roles/enrollments where needed,
   - idempotent upserts only.
2. Explicitly forbidden in production:
   - `pnpm -w run db:reset`,
   - `packages/database/reset_db.js`,
   - mock data seed scripts,
   - `packages/database/seed_test_training_accounts.js`,
   - any script that creates default test credentials or demo CRM data.
3. Seed safety guard expectation:
   - destructive flows must hard-fail when `NODE_ENV`, `VERCEL_ENV`, `APP_ENV`, `RAILWAY_ENVIRONMENT`, or `RAILWAY_ENVIRONMENT_NAME` indicates production/prod,
   - production imports must be non-destructive and idempotent,
   - no password/PIN/default credential values should be embedded in seed files.

## G. Smoke test execution

Use `docs/V0_9_0_SMOKE_TEST_RESULTS_TEMPLATE.md` and record pass/fail notes with real users:

- owner/admin user,
- Primeau/director user,
- one rep user.

Minimum smoke coverage:

1. admin login,
2. director login,
3. rep login,
4. Academy enrollment,
5. Academy progress persistence,
6. database-backed certification status,
7. uncertified rep CRM gate,
8. certified rep CRM unlock,
9. school assignment visibility,
10. touched/untouched counts,
11. opportunity creation,
12. stage advancement,
13. Closed Won order creation,
14. order visibility,
15. unpaid commission exclusion,
16. delivered/completed commission inclusion,
17. rep commission visibility restriction,
18. director override visibility restriction,
19. dashboard totals matching backend.

## H. Operational route-gating expectations

### Uncertified rep

An uncertified rep should see:

- TUF Academy available,
- dashboard locked/onboarding state available,
- pipeline/opportunities blocked or redirected to Academy,
- organizations blocked or redirected to Academy,
- territory blocked or redirected to Academy,
- orders/invoices blocked or redirected to Academy,
- performance/commission pages blocked or redirected to Academy.

### Certified rep

A rep should receive CRM access only after all of the following are complete in production-backed state:

- all required Academy modules complete,
- HR docs complete,
- practical exercise complete,
- director sign-off complete.

After those conditions are true, the rep should see their assigned CRM/sales scope only: assigned schools, assigned opportunities, visible linked orders, and their own commission estimates without director override amounts or other reps' details.

## I. Unlock sequence

1. **Phase 1 — Academy only:** reps can enter Academy and train; CRM remains gated.
2. **Phase 2 — certified pilot rep:** unlock one certified pilot rep after module completion, HR docs, practical exercise, director sign-off, and smoke-test verification.
3. **Phase 3 — remaining reps:** unlock additional reps only after their individual certification/sign-off is complete.
4. **Phase 4 — Monday live selling:** begin live selling Monday only if production smoke tests pass and leadership signs off.

## J. Rollback plan

If a production issue appears:

1. Stop rep unlock immediately.
2. Keep Academy-only access if Academy is safe and database-backed progress is intact.
3. Revert web/API deployment to the previous known-good commit.
4. Restore DB from the recorded backup if migration/data integrity is unsafe and restore is approved.
5. Preserve activity logs, API logs, browser errors, migration logs, and smoke-test notes for debugging.
6. Communicate delay to reps/directors with a clear message: Academy remains available if safe; CRM/live selling is delayed until smoke tests pass.
