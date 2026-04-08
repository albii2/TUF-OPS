# TUF Ops Repository State Assessment (2026-04-04)

## Executive summary

This repository is still in a **transitional and internally inconsistent state** at `a93b195` on branch `work`.

The product intent is strong (internal CRM + opportunity execution + operations workflow for a sports apparel business), but engineering reliability is currently limited by contract drift across schema, API, auth types, and UI contracts.

**Bottom line:** This is recoverable and strategically valuable, but it needs a focused hardening pass before it can be treated as a stable baseline for feature velocity.

## Scope reviewed

- Architecture and product scope docs (`README.md`, previous assessment).
- Data model (`apps/frontend/prisma/schema.prisma`, `prisma/seed.ts`).
- Auth/session typing and callback wiring (`apps/frontend/src/lib/auth/auth-options.ts`, `apps/frontend/src/types/auth.ts`, `apps/frontend/src/types/next-auth.d.ts`, `apps/frontend/src/lib/auth/session.ts`).
- Navigation and app-shell state (`apps/frontend/src/config/navigation.ts`, `apps/frontend/src/components/app-shell/app-sidebar.tsx`).
- Build/lint/typecheck health via commands listed in “Verification checks”.

## What this repo currently is

A Next.js App Router monorepo application using Prisma/Postgres + NextAuth + Tailwind/shadcn for internal ops.

Current baseline narrative in `README.md` is MVP-focused (auth, orgs, opportunities), with earlier broader workflows intentionally deferred.

## Strengths

1. **Business-aligned product direction**
   - Core entities (users, organizations, opportunities) map directly to the sales pipeline and rep accountability model used in sports apparel operations.

2. **Sensible stack for internal ops tooling**
   - Next.js + Prisma + Postgres + NextAuth is pragmatic for a small team optimizing for iteration speed.

3. **Evidence of advanced feature experimentation exists**
   - Repository contains traces of broader operations features (orders/team stores/uniform-orders routes, etc.), indicating meaningful prior product exploration.

## Critical findings (current risks)

### 1) Severe schema ↔ API drift

The active Prisma schema defines `User`, `Organization`, and `Opportunity`, but many API endpoints still reference removed/unknown Prisma models (`invoice`, `uniformOrder`, `repActivity`, `mockup`, `sampleRequest`, `rosterUpload`, `opportunityNote`).

This is the largest reliability risk because it breaks typecheck and likely runtime paths depending on route usage.

### 2) Auth role and session contract drift

Role taxonomy is inconsistent across code paths:
- `AppRole` uses `admin | regional_director | sales_rep`
- schema uses `admin | director | rep`
- app logic checks `director/rep` in multiple places.

Session typing expects fields like `id`, but numerous code paths still see user objects typed without `id`, producing compile failures and guard inconsistencies.

### 3) Seed script is incompatible with enum definition

`prisma/seed.ts` inserts `stage: "discovery"`, but current Prisma enum values are `lead/contacted/mockup/sample/invoice/closed_won/closed_lost`.

This mismatch is a direct source of seed and local environment instability.

### 4) UI/navigation contract divergence

Two navigation systems diverge in role definitions and labels:
- central nav config uses `regional_director/sales_rep`
- app sidebar uses `user/admin`.

This weakens confidence in role-based visibility and can produce hidden/incorrect navigation behavior.

### 5) Tooling and release gates are not production-ready

- `lint` is interactive (not CI-safe by default in this repo state).
- `tsc --noEmit` fails with broad type errors.
- `build` fails in this environment due external Google Font fetch (`Inter`).

## Assessment of the recovery work described by your other AI

From the transcript, the recovery actions were directionally correct (rehydrating stash on original base and snapshotting). That was the right move.

However, before treating that result as “done,” a professional closeout should include:

1. **Artifact hygiene checks**
   - Ensure local artifacts like `cookies.txt` are not committed and are ignored.
2. **Baseline verification commit**
   - Record deterministic checks (seed, auth smoke, dashboard load) with exact commands.
3. **Branch policy**
   - Avoid direct integration into `main` without PR + checks.
4. **Post-recovery hardening sprint**
   - Resolve role/session/schema contract mismatches before resuming feature work.

## Business impact (if stabilized)

If hardened, this platform can materially improve operations by:
- Increasing pipeline discipline (stale/missing-next-step visibility).
- Improving rep-manager accountability and forecasting consistency.
- Reducing fragmented manual tracking across spreadsheets.
- Creating a base for opportunity-to-order conversion workflows specific to sports apparel selling motions.

## Priority hardening plan (recommended)

### P0 — Restore contract integrity (must do first)
1. Align Prisma schema with all active API/routes (or remove/archive deferred endpoints).
2. Unify role taxonomy into a single canonical type shared by schema/auth/ui.
3. Fix session typing so `session.user.id/role/managerId` are consistently typed and populated.
4. Fix seed enum mismatch (`discovery` -> valid `OpportunityStage`).

### P1 — Make CI trustworthy
1. Commit non-interactive ESLint config.
2. Enforce `tsc --noEmit`, `prisma validate`, and `next build` in CI.
3. Add auth + dashboard smoke tests (seed user login/session/dashboard response assertions).

### P2 — Stabilize product boundaries
1. Explicitly mark which features are active vs deferred.
2. Move deferred routes behind feature flags or delete them from runtime surface.
3. Keep a migration/contract changelog between schema and API to avoid future drift.

## Verification checks run for this assessment

- `pnpm --filter frontend exec tsc --noEmit`
  - Failed with extensive schema/auth/type mismatches.
- `pnpm --filter frontend lint`
  - Failed due interactive ESLint setup prompt.
- `pnpm --filter frontend build`
  - Failed in this environment due inability to fetch Google Font `Inter`.

## Final verdict

- **Strategic product value:** High
- **Current engineering reliability:** Low-to-moderate (transitional)
- **Recovery likelihood:** High, if the team executes a focused P0/P1 hardening pass before new feature expansion.
