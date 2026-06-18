# TUF Ops v0.9.0 Production Readiness Plan

## Purpose

v0.9.0 is a production-readiness reset. The objective is not feature expansion. The objective is to make TUF Ops safe for real reps, real schools, real opportunities, real orders, and real commissions.

Until this work is complete, reps should use TUF Academy for onboarding and certification while live CRM access remains restricted.

## Launch posture

Allowed before v0.9.0 is complete:

- TUF Academy orientation
- Product education
- Sales process training
- Practical exercises
- Director review and sign-off

Blocked before v0.9.0 is complete:

- Live account creation by reps
- Live opportunity ownership changes by reps
- Live order creation by reps
- Commission-facing dashboards
- Production imports without admin review
- Destructive seed or reset scripts against production

## Non-negotiable production rules

1. Production database must be separate from development and preview.
2. Production must not contain mock/demo schools, opportunities, orders, activities, or commissions.
3. Destructive seed scripts must fail in production.
4. Dashboard metrics must come from server-side source-of-truth query services.
5. Commission calculations must be server-side and derived from paid/finalized order records.
6. Touched/untouched school counts must be derived from auditable activity records, not assignment alone.
7. Role permissions must be tested for owner/admin, director, and rep views.
8. Academy certification must be database-backed before it unlocks CRM access.
9. Frontend fallback/demo data must not control certification or CRM access in production.
10. Backups and rollback procedure must be documented before launch.

## Critical repo findings

### App architecture split

The repo currently contains two operating patterns:

- `apps/frontend` uses Next.js API routes and Prisma.
- `apps/api` and `apps/web` use a separate API/web structure.

v0.9.0 must define which stack is authoritative for production data.

### Seed risk

The seed flow includes a destructive cleanup path behind an environment flag. That must be blocked from production regardless of accidental configuration.

### Dashboard risk

The current dashboard logic is too shallow for production launch. v0.9.0 needs role-scoped source-of-truth metrics for school coverage, touches, opportunities, orders, revenue, gross profit, and commissions.

### Academy risk

TUF Academy has real backend tables and API routes, but the web frontend can also fall back to local generated training data. That is acceptable for a demo view, but it must not certify a user or unlock CRM access in production.

### Academy phase mismatch

The database uses legacy phases while the Academy UI uses expanded certification levels. These must be aligned before certification is treated as real.

## Implementation sequence

### Phase A — Freeze and protect

- Freeze new feature work except production-readiness and Academy gate work.
- Confirm production, preview, and development database URLs are separate.
- Add a hard production guard to destructive seed logic.
- Create a production-safe seed process for approved users, roles, zones, and real school data only.
- Disable mock/demo data in production.

### Phase B — Academy gate

- Align Academy phases between database and frontend.
- Seed real Academy modules using production-safe idempotent inserts.
- Ensure every rep has an enrollment record.
- Remove silent local fallback as a production certification path.
- Add certification gate: modules complete, practical exercise complete, director sign-off complete, CRM unlocked.

### Phase C — Metrics source of truth

Create backend services for:

- rep dashboard metrics
- director dashboard metrics
- admin dashboard metrics
- school coverage metrics
- commission metrics

All dashboards should consume these services rather than calculating independently in frontend components.

### Phase D — CRM correctness

- Define official school status lifecycle.
- Define what counts as a touch.
- Ensure a school is not counted as touched merely because it is assigned.
- Ensure Closed Won creates a visible order for the correct role scope.
- Ensure unpaid/draft invoices do not create payable commission.
- Ensure director/admin views are scoped correctly.

### Phase E — Launch verification

Run launch checks with three test users:

- owner/admin
- director
- TAE/rep

Each user must pass login, Academy access, Academy progress save, certification status, dashboard visibility, school visibility, opportunity visibility, order visibility, and commission visibility checks.

## Definition of done

v0.9.0 is done when:

- no destructive seed can run in production
- no mock business data appears in production
- Academy certification is database-backed
- CRM access is gated until certification/sign-off
- touched/untouched numbers are correct
- order visibility works from Closed Won through fulfillment
- commissions are server-calculated and payment-gated
- dashboards are role-scoped and source-of-truth backed
- production backup and rollback plan exists
- owner, director, and rep smoke tests pass

## Recommended first 48 hours

- Reps use Academy only.
- Directors review certification/practical exercises.
- Admin imports and verifies schools.
- CRM remains locked except owner/director testing.
- After v0.9.0 smoke test passes, unlock certified reps in waves.
