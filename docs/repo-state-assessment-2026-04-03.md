# TUF Ops Repository State Assessment (2026-04-03)

This document captures a high-level technical assessment of the current repository state.

## What this repo is
- Monorepo centered on a Next.js app (`apps/frontend`) for CRM-like sales operations.
- Core implemented model set in Prisma currently focuses on users, organizations, and opportunities.
- Product intent targets opportunity progression and owner accountability via dashboard metrics.

## Strengths
- Clear business intent and MVP framing in README.
- Solid baseline stack choices for speed-to-market (Next.js + Prisma + Postgres + NextAuth).
- Role-aware visibility logic exists for opportunity access.

## Critical gaps
- Significant mismatch between active Prisma schema and many API/routes/components that still reference removed/deferred models.
- Role naming inconsistencies across auth/session/types/navigation create broken typing and likely runtime authorization drift.
- Build/lint/typecheck reliability is currently poor, with many TypeScript errors.
- Seed script contains values that do not align with current enum definitions.

## Operational implications
- Current codebase appears to be in transition from a broader prior schema to a narrower MVP baseline.
- As-is, engineering velocity and release confidence are constrained by schema/type drift and test/tooling instability.

## Priority improvements
1. Align data model contracts end-to-end (Prisma schema, API routes, server actions, UI types).
2. Normalize role taxonomy and enforce through a single shared type source.
3. Restore CI gates: non-interactive lint, strict typecheck, migration validation, and smoke tests.
4. Clarify scope by archiving/deleting deferred endpoints or moving to feature flags.
5. Improve production readiness around logging, observability, and secret/config management.
