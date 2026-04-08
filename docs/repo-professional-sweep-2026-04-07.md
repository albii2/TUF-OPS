# TUF Ops Professional Sweep Report (2026-04-07)

## Purpose
This sweep focused on reducing high-risk contract drift and stabilizing the codebase for internal business use. The goal was to prioritize operational reliability for active workflows over preserving broken legacy endpoints.

---

## What was fixed in this sweep

### 1) Auth/session contract normalization
- Unified app role model to active roles: `admin | director | rep`.
- Updated NextAuth type augmentation to consistently include:
  - `session.user.id`
  - `session.user.role`
  - `session.user.managerId`
- Removed conflicting role/type drift between `src/next-auth.d.ts` and `src/types/next-auth.d.ts`.

### 2) Registration/settings API alignment
- `POST /api/auth/register` now writes to `name` (not deprecated `full_name`) and validates role against active schema values.
- `PUT /api/settings` now updates `name` and reads authenticated user id from typed session.

### 3) Opportunity API schema compliance
- Replaced stale opportunity routes that referenced removed relations (`team`, `rep_activities`, `opportunity_notes`) with schema-compliant handlers for current `Opportunity`/`Organization` models.
- Added stage validation against Prisma enum values.

### 4) Dashboard API de-risking
- Rewrote dashboard API to compute metrics only from active models (`opportunity`, `organization`) and removed references to removed billing/order models.

### 5) Legacy endpoint containment
The following endpoints were converted to explicit HTTP 410 responses to prevent runtime/compile instability from removed models:
- `/api/activities`
- `/api/invoices`
- `/api/invoices/[id]/pdf`
- `/api/notes`
- `/api/rosters`
- `/api/samples`
- `/api/uniform-orders`

This is intentional containment until corresponding schema/models are formally reintroduced.

### 6) Navigation role drift cleanup
- Updated navigation role config from deprecated values (`regional_director`, `sales_rep`) to active values (`director`, `rep`).

---

## Current repo state after sweep

### Improved
- Major API/schema drift reduced in critical auth/opportunity/dashboard surfaces.
- Session typing consistency improved.
- Legacy broken APIs are now explicitly deprecated instead of silently failing.

### Still remaining (next sweep)
- UI/form contract mismatches in opportunity/organization forms (prop shape drift).
- Some session/user typing assumptions in older app actions and dashboard selectors.
- Metrics query type mismatches due enum/value assumptions.
- One exported mutation mismatch in workflow form (`updateOpportunityWorkflow` vs current mutation exports).

---

## Business rationale
For internal business operations, this sweep prioritizes:
1. **Stable core flows** (auth, opportunities, dashboard) over broken optional legacy routes.
2. **Explicit deprecation** rather than hidden failures.
3. **Clear type contracts** to reduce regressions as team members/AI workers continue development.

---

## Recommended next implementation sprint
1. Complete UI form contract convergence (shared form primitives and prop signatures).
2. Align metrics and dashboard selectors to active opportunity enum set.
3. Add focused smoke tests for:
   - auth sign-in/session
   - create/update opportunity
   - mockup request create/remove
4. Re-enable deprecated APIs only when schema additions are intentionally designed and migrated.

---

## Acceptance criteria to resume feature expansion
- `tsc --noEmit` passes.
- `lint` passes non-interactively.
- `build` passes.
- Core smoke tests pass in CI.

