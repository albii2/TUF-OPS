# TUF Ops — Version Map

**Current: v1.2.0** (July 27, 2026)
**Production:** ops.tufsports.us
**Stack:** TypeScript/pnpm monorepo — Vite+React (web) + Fastify (API) + PostgreSQL

---

## Version History

### v1.2.0 — Employee Issue Intake + UX Hardening (July 23–27, 2026)

New features shipped:
- **Employee Issue Intake system** — employees submit issues via the app; classified, scored, and surfaced through Lighthouse
- **Academy expansion** — quizzes increased from 5 to 10 questions per module; scroll-jump bug fixed
- **Responsive design** — all three home screens (CEO, Director, TAE) now scale to mobile
- **Separated coverage metrics** — three independent KPIs: Contacted, With Opportunities, Active Opportunities
- **Collapsible sports ticker** — user can dismiss it with one click
- **Coverage derived from opportunities** — no longer based on stale timestamps; false coverage reporting eliminated

Platform hardening:
- API build forced clean before deploy (fixes 404 on Railway)
- Backup health check + pre-deploy backup cron job rebuilt
- Pre-deploy gate expanded to 6 checks with post-test cleanup
- Issues routes inlined directly into API index (eliminates cold-start registration races)

Deploy: `9106a71d` (production) | `50754ea4` (HEAD)

---

### v1.1.0 — CRM Hardening + Stabilization (July 22–23, 2026)

Hardening pass across the entire CRM:
- **Pre-deploy gate** — 6 automated checks before any deploy (tests + lint + typecheck + build + seed safety + route registration)
- **Normalization layer** — `createOrganization`, `updateOrganization`, `getOrganizationById` all normalized; `ordersService` create/update/getById normalized
- **Null safety** — Orders page crash fixed (null-safe `missingInfo` and `lane` accesses); Orders detail page hardened
- **Stage advancement** — button fixed after normalization refactor; Director team access scoped correctly
- **Auth** — `credential_version` bumped on self-service PIN change
- **Route fixes** — `/locker-room` route registered (was never wired); duplicate `/orders` route removed
- **E2E tests** — Playwright tests use env vars for credentials; 5 core workflow regression tests pass
- **Migration fix** — migration 5000 uses `pgm.db.query` not `pool.query` (previously blocked deploys)
- **Test data cleanup** — test pollution eliminated; all tests run with `is_test` flag and `test_run_id`

Commit: `65abb721` (tagged v1.1.0)

---

### v1.0.0 — Meridian OS (July 21–22, 2026)

Architecture launch — TUF Ops now runs on the Meridian Operating System. Five new engines:

1. **Classification Engine** — every intake item auto-classified into 17 types with an Attention Score (0–100)
2. **Lighthouse** — real-time organizational awareness: "What requires attention RIGHT NOW?" scored and grouped
3. **Pulse** — four health scores (Coverage, Pipeline, Executive, Operations) color-coded green/yellow/red
4. **Forge** — execution view: active pipeline, near-close deals, production orders
5. **Executive Command Center** (`/command`) — single-page dashboard combining all engines + territory health + intake breakdown + overdue items

Home screen redesign:
- Three role-specific home screens: CEO, Director, TAE — each shows a daily briefing, not a dashboard
- Territory map always visible in sidebar navigation
- All hardcoded personal names removed from the codebase

Status Check tracking:
- System-enforced response tracking with automatic escalation
- Per-director deadlines with attention score penalties when overdue
- Non-respondents can no longer hide — the system knows

Database: `executive_intake` table expanded with `attention_score`, `classification_type`, `due_date`, `related_person_id`, `related_organization_id`. New indexes for scored queries.

Files: +2,500 lines across intake service, controller, Command Center page, and app shell.

Commit: `938ea15c`

---

### v0.9.5 — Scoping + Pipeline Fixes (July 19–20, 2026)

Role-based data scoping:
- REP users now only see their assigned organizations and opportunities
- Director dashboard uses state scoping instead of `assigned_director_id`
- `assigned_rep_name` and `assigned_director_name` populated on org create/update

Pipeline fixes:
- Pipeline valuation zeroed out — fixed by mapping canonical stages and coercing value to number
- "Attack This Lane" creates opportunities correctly; lanes wired end-to-end
- Black screen when viewing opportunity — fixed by adding lanes field to API response
- Stage mapping chain works end-to-end

Academy:
- ACAD-107 Emergency Pipeline + DIR-6 Territory Building courses added
- LockerRoomSimulator cleaned up (legacy auth removed, hardcoded name removed)

Bulk operations: ADMIN and DIRECTOR can now bulk-delete organizations from the list page.

Tags: `v0.9.5-app-shell-org-view`, `v0.10.0-ops-data-model`

---

### v0.9.0 — Foundation Hardening (July 16–19, 2026)

Infrastructure:
- Multi-state territories (MN, IL, WI) with territory-scoped organization and opportunity filtering
- PIN authentication classes (8XXX executive, 7XXX directors, 6XXX senior TAEs, 5XXX TAEs, 4XXX interns)
- Certification ungated — uncertified reps can build pipeline while training

Data integrity:
- `coverageStatus` derived from `updated_at` instead of hardcoding UNTOUCHED
- Activities `ORDER BY created_at` (was returning 500)
- Organization create now persists city field
- Stale compiled artifacts (828 files) removed from source tree; gitignored permanently

Operations:
- Automated daily DB backup + restore procedure (tested and rehearsed)
- Vercel preview builds fixed with restored `vercel.json`

Tags: `v0.9.0-stable-runtime`, `v0.9.0-owner-dashboard`

---

### v0.8.0 — Payment Confirmation + Territory Scoping (July 16, 2026)

- Payment confirmation workflow implemented
- Territory-based data scoping foundation
- Multi-environment Vercel preview/production split stabilized

Tags: `v0.8.0-payment-confirmation`, `v0.8.0-payment-complete`

---

### v0.7.0 — Core Stable (pre-July 2026)

- Primary Opportunity Command Center
- Order Handoff features
- Role-based access control (OWNER, ADMIN, DIRECTOR, REP, OPS)
- Cryptographic PIN login (scrypt)

Tag: `v0.7.0-core-stable`

---

### v0.1.0–v0.2.1 — Foundation (pre-July 2026)

- Authentication stabilized (PIN-based)
- Core data model: organizations, contacts, opportunities, orders
- Fastify API + React frontend monorepo established

Tags: `v0.1.0-auth-stable`, `v0.2.1`

---

## Current Architecture

```
apps/
  api/     Fastify + node-pg-migrate + PostgreSQL (Railway)
  web/     React 18 + Vite + React Router + TanStack Query (Vercel)
  frontend/  Next.js 14 (⚠️ legacy — being phased out)

packages/
  auth/       PIN authentication (scrypt), role management
  database/   Migration files (node-pg-migrate)
  shared/     TypeScript types
  logger/     Structured logging
  env/        Environment configuration
```

**Production topology:**
- Frontend: Vercel (`ops.tufsports.us`)
- API + DB: Railway (Postgres + Fastify)
- Backups: Daily snapshots (30-day retention), weekly (90-day), monthly (1-year)

---

## Known Technical Debt (from Strategic Audit, July 14)

See `CODEBASE_STRATEGIC_AUDIT.md` for full details. Top items:

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| O1 | Two parallel frontends (Vite + Next.js) | Critical | Next.js legacy — phase out |
| O4 | Role model mismatch (frontend uppercase vs backend lowercase) | Critical | Partially addressed |
| D1 | `usersService` stub functions throw errors | Critical | Open |
| D3 | Ecosystem referrals are localStorage-only | Critical | Open |
| U8 | `isRepCertified()` always returns true | Critical | Open |
| M1 | No frontend automated tests | Critical | Playwright E2E added in v1.1.0 |

---

## Roadmap

### v1.3.0 — Guided Onboarding + User Experience

- **Guided app tour** — first-time user walkthrough for each role (CEO, Director, TAE)
- Self-service PIN recovery flow (no more "ask the owner")
- Loading states on all data pages (skeleton loaders)
- Error messages surfaced to user (stop swallowing errors silently)
- Mobile hamburger menu + bottom nav bar for field reps

### v1.4.0 — Data Integrity Close

- Fix `usersService` stubs — wire to real API endpoints
- Ecosystem referrals backed by API (remove localStorage dependency)
- `isRepCertified()` backed by real Academy data
- Role model unification (frontend consumes `@tuf/shared` roles)
- Mock type imports replaced with shared types

### v1.5.0 — Director Portals + Order Operations

- State Director dashboards (team health, territory health, rep scorecards)
- Payment confirmation workflows
- Artwork approval tracking
- Order readiness states

### v2.0.0 — Midwest Launch

- 10 TAEs, 3 Directors, Ownership operating for 90 days without intervention
- Verified relationship integrity across all data
- End-to-end order flow with RBAC permissions
- Academy 101–105 completed, Director certifications verified
- Operational monitoring dashboards

---

## Versioning Policy

TUF Ops follows **Meridian Semantic Versioning**:

- **Major (X.0.0):** Architecture changes — new engines, new data models, breaking API changes
- **Minor (0.X.0):** Feature releases — new screens, new workflows, significant UX changes
- **Patch (0.0.X):** Bug fixes, hardening, normalization — no new features

Every version ships to production. There are no long-running branches. The `main` branch is always deployable.

---

*Last updated: July 27, 2026. This file is the canonical version record. The git log is the source of truth; this file is the human-readable map.*
