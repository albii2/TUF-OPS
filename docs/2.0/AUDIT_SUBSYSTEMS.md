# TUF Ops 2.0 — Subsystem Audit (Phase 0 / T0.2)

**Status:** Draft for Gate 0 exit · **Task:** T0.2 · **Author:** Phase 0 audit subagent
**Repo:** `TUF-OPS Repo` @ `feat/opportunity-lifecycle` (`59372e12`, 2026-09-21) · **Live DB:** PostgreSQL 18.6
**Mandate:** read-only for code and git. This file is one of the two writes permitted to this subagent (T0.2); the other is `docs/2.0/DEPENDENCY_GRAPH.md` (T0.3).
**Companions (written by sibling Phase-0 tasks — do not duplicate):** `CLASSIFICATION.md` (T0.4), `UNIVERSE_VS_MARKETS.md` (T0.6), `ACTIVATE_MARKET_SPEC.md` (T0.7).

This document supplies the **path / LOC / liveness evidence** the plan requires for every meaningful subsystem, plus the **`organizations` FK leak analysis** (R2's added T0.2 requirement). It does not re-issue the KEEP/MODIFY/REBUILD/REMOVE/DEFER verdicts — those live in `CLASSIFICATION.md`; the "Class ptr" column below points at that file.

---

## How to read the evidence

| Tag | Meaning |
|---|---|
| **VERIFIED** | Directly observed at this commit (grep / `wc -l` / route table / config) or on the live DB / live HTTP, with the method stated. |
| **INFERENCE** | Reasoned from code shape or adjacent evidence; not directly proven. |
| **UNKNOWN** | Cannot be determined from available evidence. What would settle it is stated inline. |

**Liveness definition used here.** A subsystem is **LIVE** only when something real *reaches* it — a route mount, a route element, or a non-type import from a live module. Import count = number of files that import the module by path (self and tests excluded). A module that exists but is imported by nothing and is not mounted is **DEAD**; a module that is imported but never rendered/mounted is **bundled-not-reached**.

**Repo-topology note (plan §0 trap).** `/Users/bradshaw/Repos/TUF-Ops` is **not** a git repo. The git repo is the nested `TUF-OPS Repo/`. The sibling dirs `{docs, src, tools, Orders}` are **outside git** (untracked siblings). `src/` is empty; `docs/` holds 114 files; `tools/` holds 7 (a "teds" document generator); `Orders/` holds 8 (Certified Tweakers artifacts). Note the plan's claim that repo `docs/` is untracked is **wrong** — the repo's own `docs/` is git-tracked (37 files); the *sibling* `docs/` is the untracked one. Both exist and are distinct.

---

## 0. Liveness summary (one line per subsystem group)

| Subsystem group | Path | Files | LOC | Liveness | Evidence | Class ptr |
|---|---|---:|---:|---|---|---|
| Live frontend SPA | `apps/web/src/**` (non-test) | 133 | ~38,300 | **LIVE** | `vercel.json` framework=vite → `apps/web/dist`; `ops.tufsports.us` 200 | CLASSIFICATION §5 |
| Live API | `apps/api/src/**` | 503 tracked | ~13,600 (modules) | **LIVE** | `railway.json` start = `apps/api/dist/index.js`; `/health` 200 | CLASSIFICATION §4 |
| API entrypoint | `apps/api/src/index.ts` | 1 | 287 | **LIVE** | 17 `server.register` calls → **14** modules mounted; `vendors` imported but never registered | CLASSIFICATION §4 |
| Shared types | `packages/shared/src/types/*` | 5 | 309 | **LIVE (web-heavy)** | 12 web files import `@tuf/shared`; only 2 API refs | CLASSIFICATION §2 |
| Auth/permissions | `packages/auth/src/*` | 4 + 2 tests | 244 | **LIVE** | imported by 10 API route files; `apps/api/src/auth.ts` | CLASSIFICATION §3 |
| DB access (`pg.Pool`) | `packages/database/src/db.ts` | 1 | 14 | **LIVE** | imported by ~28 API service files | CLASSIFICATION §1 |
| Migrations | `packages/database/migrations/*.js` | **65 on disk** | — | **LIVE (70 applied)** | `pgmigrations` = 70 live; mismatch noted | CLASSIFICATION §1 |
| Seeds | `packages/database/seed_*.js` | 2 | 740 | **LIVE (universe)** | `seed_leads_from_csv.js` = 288 orgs | CLASSIFICATION §9 |
| Mock data layer | `apps/web/src/data/mockSalesData.ts` | 1 | **10,312** | **LIVE (fabricated)** | imported by 32 web files (27 type-only) | CLASSIFICATION §6 |
| Mock generator | `scripts/generate_mock_data.py` | 1 | **1,291** | **LIVE (source of mocks)** | generates the file above | CLASSIFICATION §6 |
| Dead 2nd frontend | `apps/frontend/**` | 56 src files | 2,980 + 294 schema | **DEAD** | excluded in root `tsconfig.json`; not in any build/deploy | CLASSIFICATION §7 |
| Scripts | `scripts/**` | 46 | 3,973 | **MIXED** | 12 validate-*.js wired into `package.json` | CLASSIFICATION §8 |
| Deprecated deploy | `render.yaml.deprecated` etc. | 4 | — | **DEAD** | superseded by `railway.json`/`vercel.json` | CLASSIFICATION §7 |

---

## 1. `apps/web` — the live Vite + React SPA

Build proof: root `vercel.json` → `framework: "vite"`, `buildCommand: pnpm --filter web build`, `outputDirectory: apps/web/dist`; `/api/*` rewritten to the Railway API. `ops.tufsports.us` returned **200** (live probe).

### 1.1 `apps/web/src/pages` — 51 files, 14,589 LOC (incl. `academy/`, `academy-v2/`)

Router truth = `apps/web/src/App.tsx` (191 LOC). Every page import that is used by a `<Route>` element is **LIVE**. Import counts below are files-referencing-the-basename (App.tsx + barrel counted).

| Page | LOC | Reached via | Liveness |
|---|---:|---|---|
| `CrudPages.tsx` (barrel) | (see members) | `App.tsx:7-29` | LIVE |
| `NewPages.tsx` → `OrganizationNewPage`, `OpportunityNewPage` | — | `CrudPages.tsx:10`; routes `/organizations/new`, `/opportunities/new` | LIVE |
| `OrganizationsPage.tsx` | — | `/organizations` | LIVE |
| `OpportunitiesPage.tsx` | — | `/opportunities` | LIVE |
| `ProductionTrackerPage.tsx` | — | `/vendor-ops` | LIVE |
| `TerritoryMapPage.tsx` | — | re-exported by `CrudPages.tsx:13` **but no route uses it** (`/territory` uses `TerritoryMapView`) | **bundled-not-reached** |
| `AcademyPage.tsx` | 1,281 | imported `App.tsx:30`; route `/academy` **redirects to `/academy/v2`** | **bundled-not-reached (superseded by v2)** |
| `DashboardPage.tsx` | — | **no importer anywhere** | **DEAD** (superseded by `ExecutiveCommandCenter`) |
| `DataHealthPage.tsx` | — | **no importer anywhere** | **DEAD** |
| `ExecutiveDashboard.tsx` | — | **no importer anywhere** | **DEAD** (superseded by `ExecutiveCommandCenter`) |
| `LockerRoomSimulatorPage.tsx` | — | **no importer anywhere** (`/locker-room` renders the *component* `components/academy/LockerRoomSimulator`) | **DEAD (duplicate)** |
| `TrainingPage.tsx` | — | **no importer anywhere** | **DEAD** (superseded by Academy v2) |
| `RepOrdersPage.tsx` | — | re-exported by `CrudPages.tsx:15`; **no route uses it** | **bundled-not-reached** |

LIVE pages (route-wired, import count ≥1): `LoginPage`, `ForgePage`, `CEOHome`, `DirectorHome`, `TAEHome`, `ExecutiveCommandCenter`, `DocumentGeneratorPage`, `AcademyMissionPage`, `AcademyProgressPage`, `CertificationChecklist`, `AcademyV2Page` (2,464 LOC — largest), `AcademyCommandPage`, `academy/AcademyDirectorReview`, `AdminCertificationPage` (1,386), `EcosystemPipelinePage`, `OpportunityDetailPage`, `MyOpportunitiesPage`, `TeamOpportunitiesPage`, `TeamPerformancePage`, `OrdersPage`, `OrderDetailPage`, `OpsWorkspacePage`, `ReportsPage`, `EarningsPage`, `TerritoryPage`, `SettingsPage`, `UsersPage`, `DailyActivityCommand`, `RecruitingPage`, `CandidateDetailPage`, `ExecutiveIntakePage`, `PeopleOpsPage`, `LeadershipCommsPage`, `IssuesPage`, `IssueNewPage`, `IssueDetailPage`, `ChangeCredentialPage`.

> **Confidence:** import-count method VERIFIED; "no importer anywhere" entries VERIFIED by repo-wide grep across `apps/ packages/ e2e/` (excluding `node_modules`/`dist`).

### 1.2 `apps/web/src/components` — 25 files, 3,665 LOC

LIVE (imported by live code): `AppShell` (App.tsx), `primitives.tsx` (**27 importers — the shared UI choke point**), `ui.tsx` (4), `toast.tsx` (4), `ToastHost`, `BadgeLocker`, `DocumentPreview`, `ForgePanel`, `LighthousePanel`, `OrganizationImportPanel`, `QualificationBadge`, `SportsTicker`, `TerritoryCommandMap`, `TerritoryMap`, `TrainingModuleCard`, `TrainingModuleDetail`, `TrainingPortalPage`, `academy/LockerRoomSimulator` (routed at `/locker-room`), `academy/TrainingFrictionPanel`.

**DEAD (0 importers — VERIFIED):** `academy/CrmWalkthroughTour.tsx`, `DirectorEarnings.tsx`, `OwnerEarnings.tsx`, `RepEarnings.tsx`, `ProgressRing.tsx`, `TrainingPhaseView.tsx`.

> The three earnings components are dead *as routed UI* but they are the value-consumers of `mockSalesData` (see §1.7) — they import live fixture objects, which is why they can't ship as-is.

### 1.3 `apps/web/src/hooks` — 11 files, 1,111 LOC

All are TanStack Query hooks except the last. LIVE: `useOpportunities` (17 refs), `useOrganizations` (16), `useOrders` (12), `useReports` (5), `useTerritory` (3), `useTrainingEnrollment` (3, **806 LOC — 73% of the hook layer; Academy only**), `useEcosystemReferrals` (2), `useCreativeRequests` (1), `useDailyActivities` (1), `useDashboardMetrics` (1). **DEAD: `useWorkItems` (0 importers).**

### 1.4 `apps/web/src/lib` — 3 files, 4,841 LOC

| File | LOC | Ref | Liveness |
|---|---:|---:|---|
| `academy.ts` | 2,986 | 5 | LIVE (Academy routes) — **72 case-insensitive "lane" refs** (VERIFIED; R7 DEFER) |
| `achievements.ts` | 1,180 | 4 | LIVE (Academy badges; obsolete lane badge IDs) |
| `documentGenerator.ts` | 675 | 2 | LIVE (route `/documents`) |

### 1.5 `apps/web/src/config` — 3 files, 114 LOC

`business.ts` (10 LOC, lane/season constants), `roles.ts` (68, `roleConfig` — **the nav choke point; App.tsx + AppShell depend on it**), `roleSmokeContract.ts` (36). All LIVE.

### 1.6 `apps/web/src/services` — 22 files, 2,346 LOC

**Real API-backed (LIVE):** `apiClient.ts` (23 refs — **the API choke point**), `apiBaseUrl.ts` (9), `usersService` (16), `opportunitiesService` (13), `organizationsService` (13), `ordersService` (7), `activitiesService` (7), `orderWorkflow` (5), `ecosystemReferralsService` (5), `feedbackService` (4), `recruitingService` (4), `creativeRequestsService` (2), `dashboardMetricsService` (2), `workItemsService` (2), `kpiUtils` (3), `roleScope` (3), `forgeEngine` (1), `lighthouseEngine` (1), `territoryService` (1), `v085DataCleanup` (1).

**Fabricated / simulated (REMOVE per CLASSIFICATION §5):** `reportsService.ts` is a **5-line stub** returning `reportsSummary` from `mockSalesData`; `territoryService` reads `territoryMock`; `lighthouseEngine`/`forgeEngine` are deterministic simulations; `businessSelectors` derives from mock objects; `v085DataCleanup` is a one-off local cleanup. All import counts ≥1 because live pages still call them — which is exactly the fabricated-reporting problem the brief bans.

> **Duplication finding (VERIFIED):** there are **two parallel data layers** — `apps/web/src/api/*` (10 files, 134 LOC, TanStack Query wrappers, imported by 8 hooks) and `apps/web/src/services/*` (direct `apiClient` calls, imported by pages). `api/index.ts` re-exports 9 modules. Both hit the same REST API; the split is historical, not architectural.

### 1.7 `apps/web/src/data` — 3 files, 10,687 LOC

| File | LOC | Importers | Liveness |
|---|---:|---:|---|
| `mockSalesData.ts` | **10,312** | **32 files** (27 `import type`, 5 value imports: `RepEarnings`, `OwnerEarnings`, `DirectorEarnings`, `territoryMock`, `reportsService`) | **LIVE but fabricated** |
| `mnZipCoords.ts` | 297 | 1 | LIVE — real MN zip→lat/lng reference (not fabricated) |
| `territoryMock.ts` | 78 | 1 | LIVE but fabricated (feeds `territoryService`) |

> `mockSalesData.ts` is **27% of the entire frontend** and the single largest fabricated artifact. Because 27 of its 32 importers are type-only (`import type { Organization, Opportunity, … } from '../data/mockSalesData'`), the file is simultaneously **the de-facto shared type source for web** — a structural coupling that must be severed by re-pointing types at `@tuf/shared` (T6.2) before removal.

### 1.8 `apps/web/src/{api, types, utils}` and root files

- `api/` — 10 files, 134 LOC. `queryKeys.ts` (81) is the largest; the rest are thin wrappers. LIVE via hooks.
- `types.ts` (49), `types/issues.ts` (50). LIVE.
- `utils/`: `leadImport.ts` (183), `naming.ts` (37), `format.ts` (14) = 4 files / 298 LOC. LIVE.
- Root: `App.tsx` (191), `auth.ts` (145), `main.tsx` (51). LIVE.
- `apps/web/src/__tests__/` — 1 file, 787 LOC. Read-only in this audit.
- `apps/web/public/training/` — **16 files** (tracked, authoritative for the app; per plan §0 the untracked sibling copy of 24 files is NOT).

---

## 2. `apps/api` — the live Fastify service

Entrypoint proof: `railway.json` `startCommand: node apps/api/dist/index.js`. Live probes: `/health`, `/api/v1/health`, `/api/v1/announcements` returned **200**; auth-gated mounted routes (`/api/v1/organizations`, `/api/v1/opportunities`) returned **401**; routes with **no registration** returned **404** (see §2.2). **Probe caveat (¹):** a 404 on a *mounted* module's exact GET path does **not** prove it is unmounted (the module may expose only POST/sub-path routes); liveness is proven by the register line in `index.ts`, and the probe is conclusive only for modules with **no** register line at all.

### 2.1 Entrypoint

`apps/api/src/index.ts` (287 LOC) is the **only route registration point**. It imports 15 route groups but issues **17 `server.register()` calls** — 1 for CORS + **16 route registrations covering 14 distinct modules** (`userRoutes` is registered 3×; **`vendorRoutes` is imported at line 13 and never registered**). Registered modules mount under `/api/v1/*`. It also:
- hosts `/health`, `/api/health`, `/api/v1/health`, `/health/data`;
- runs **idempotent DDL at boot** (`ALTER TABLE users ADD COLUMN IF NOT EXISTS …`, `CREATE TABLE IF NOT EXISTS academy_activity_events …`) — a schema-drift workaround (INFERENCE: this is why Academy Command schema exists live without a matching repo migration);
- **hard-resets the admin PIN to `8188` on every boot** (`index.ts:259-274`) — a live security/credential issue to flag for the rebuild.

### 2.2 API modules — mount status and live probe

`grep` of `server.register` across all of `apps/api/src` shows registrations exist **only** in `index.ts`. The table gives both the **source proof** (register line) and the live HTTP probe; where they disagree, **the register line is authoritative** (footnote ¹):

| Module | Path | Files | LOC | Mounted? (source proof) | Live probe | Liveness |
|---|---|---:|---:|---|---|---|
| `organizations` | `modules/organizations/` | 6 | 542 | ✅ `index.ts:130` | **401** (probed) | LIVE |
| `opportunities` | `modules/opportunities/` | 8 | 1,339 | ✅ `index.ts:131` | **401** (probed) | LIVE |
| `activities` | `modules/activities/` | 5 | 636 | ✅ `index.ts:132` | mounted (not probe-tested) | LIVE |
| `production-requests` | `modules/production-requests/` | 5 | 279 | ✅ `index.ts:134` | 404¹ (GET; mounted) | LIVE |
| `reporting` | `modules/reporting/` | 7 | 587 | ✅ `index.ts:133` | mounted (not probe-tested) | LIVE |
| `orders` | `modules/orders/` | 5 | 322 | ✅ `index.ts:135` | mounted (not probe-tested) | LIVE |
| `creative-requests` | `modules/creative-requests/` | 5 | 93 | ✅ prefix `/api/v1` `index.ts:136` | 404¹ (GET; mounted) | LIVE |
| `training` | `modules/training/` | 4 | 1,244 | ✅ `index.ts:137` | mounted (not probe-tested) | LIVE |
| `academy-command` | `modules/academy-command/` | 5 | 893 | ✅ `index.ts:138` | mounted (not probe-tested) | LIVE |
| `academy-resources` | `modules/academy-resources/` | 3 | 73 | ✅ `index.ts:139` | mounted (not probe-tested) | LIVE |
| `academy-v2` | `modules/academy-v2/` | 4 | 1,981 | ✅ `index.ts:140` | mounted (not probe-tested) | LIVE |
| `intake` | `modules/intake/` | 3 | 603 | ✅ `index.ts:150` (HEAD commit) | mounted (not probe-tested) | LIVE |
| `announcements` | `modules/announcements/` | 2 | 77 | ✅ `index.ts:151` | **200** (probed) | LIVE |
| `users` | `modules/users/` | 6 | 681 | ✅ ×3 (`index.ts:152,153,156`) | mounted (not probe-tested) | LIVE |
| **`vendors`** | `modules/vendors/` | 5 | 1,009 | ❌ **imported (`index.ts:13`) but NEVER registered** | **404** (probed) | **DEAD (unmounted)** |
| `academy` (v1) | `modules/academy/` | 4 | 936 | ❌ **never mounted** | **404** (probed) | **DEAD** (superseded by academy-v2/-command/-resources) |
| `commissions` | `modules/commissions/` | 3 | 173 | n/a — **no routes file; service only** | — | **LIVE as a service** (imported by `opportunities.service`; joined by `reporting.service`) |
| `comms` | `modules/comms/` | 3 | 235 | ❌ **never mounted** | **404** (probed) | **DEAD** (web calls it → broken surface) |
| `daily-activities` | `modules/daily-activities/` | 4 | 191 | ❌ **never mounted** | **404** (probed) | **DEAD** |
| `dashboard` | `modules/dashboard/` | 3 | 87 | ❌ **never mounted** | **404** (probed) | **DEAD** (superseded by COMMAND) |
| `issues` | `modules/issues/` | 4 | 369 | ❌ **never mounted** | **404** (probed) | **DEAD** (web `/issues` calls 404) |
| `people` | `modules/people/` | 3 | 123 | ❌ **never mounted** | **404** (probed) | **DEAD** |
| `recruiting` | `modules/recruiting/` | 4 | 422 | ❌ **never mounted** | **404** (probed) | **DEAD** (web `/recruiting` calls 404) |
| `work-items` | `modules/work-items/` | 3 | 261 | ❌ **never mounted** | **404** (probed) | **DEAD** (web `useWorkItems` is also dead) |
| `shared` (helpers) | `modules/shared/` | 2 | 83 | n/a — imported by mounted modules (`resolve-user`, `audit-log`) | — | LIVE |
| `data-integrity.test.ts` | `modules/` | 1 | — | n/a (test) | — | Test (false-confidence — CLASSIFICATION §4) |

> ¹ `productionRequestRoutes` (`index.ts:134`) and `creativeRequestRoutes` (`index.ts:136`) **are** registered, so their modules are LIVE; `GET /api/v1/production-requests` and `GET /api/v1/creative-requests` return 404 only because those collection paths expose no GET route (the handlers are POST/sub-path). The 9 modules marked DEAD have **no register line at all** — the 404 is definitive for them.

**Module total:** 25 module dirs + tests, 13,576 LOC across all `modules/**/*.ts`.

> **Critical liveness finding (VERIFIED):** **9 modules have code but no route registration** — `academy`, `comms`, `daily-activities`, `dashboard`, `issues`, `people`, `recruiting`, `work-items` (no `.register` call at all) **and `vendors`** (imported at `index.ts:13`, never registered). The live API returns **404** for their prefixes. **Five of them still have reachable frontend pages/hooks calling them** (`/issues`, `/recruiting`, `/people`, `/comms`, `/daily-activities`, `/dashboard`), so those pages render empty/error against production — prototype work committed on both sides of an unmounted boundary. `git log -S` shows no commit ever introduced these route imports into `index.ts` (INFERENCE: built ahead of mounting, never wired).

### 2.3 `apps/api/src/auth.ts` + tests

`auth.ts` (255 LOC) is the global `onRequest` hook (parses token; does **not** reject anonymous — authorization is per-route). Depends on `packages/auth` and `users`/`opportunities` services. `data-integrity.test.ts` is the known false-confidence test.

---

## 3. `packages/*`

| Package | Path | Files | LOC | Liveness | Evidence |
|---|---|---:|---:|---|---|
| `@tuf/shared` | `packages/shared/src/` | 6 | 358 | LIVE (web-heavy) | `types/organization.ts` 50 (`RevenueLane` four-lane enum at line 3), `opportunity.ts` 35, `order.ts` 52, `candidate.ts` 96, `user.ts` 76, `index.ts` 49 (barrel). **12 web files import it; only 2 API refs.** `main: src/index.ts`. |
| `@packages/auth` | `packages/auth/src/` | 4 (+2 tests) | 244 | LIVE | `roles.ts` 46, `permissions.ts` 89, `stages.ts` 67, `index.ts` 42. Imported by 10 API route files (`STAGES`, `normalizeStage`, `isValidTransition`, permissions). |
| `@packages/database` | `packages/database/src/db.ts` | 1 | 14 | LIVE | `pg.Pool`; imported as `pool` by ~28 API service files, incl. `index.ts`, `organizations`, `opportunities`, `orders`, `users`, `reporting`, `vendors`, `training`, `academy-v2`. `main: dist/db.js`. |
| `@packages/env` | `packages/env/src/` | 1 | 15 | LIVE (thin) | referenced by `apps/api/tsconfig.json` project refs |
| `@packages/logger` | `packages/logger/src/` | 1 | 15 | LIVE (thin) | referenced by `apps/api/tsconfig.json` project refs |

> **Key correction (VERIFIED):** there is **no Prisma anywhere in the live stack**. `grep -rl prisma apps/api/src apps/web/src packages` → empty; no `prisma/schema.prisma` exists outside `node_modules` except the dead `apps/frontend/prisma/schema.prisma`. Persistence = **`pg` + `node-pg-migrate`**. (Matches CLASSIFICATION's top-of-doc finding; the plan's "Prisma client" KEEP line is factually wrong.)

### 3.1 `packages/database` (migrations, seeds, helpers)

| Item | Path | LOC / count | Liveness | Evidence |
|---|---|---:|---|---|
| Migration dir | `packages/database/migrations/` | **65 `.js` on disk** | LIVE | `pgmigrations` table = **70 applied** (live) → **5-migration mismatch**; cause UNKNOWN (deleted/renamed/re-run). Live DB authoritative. |
| Lead-CSV seed | `packages/database/seed_leads_from_csv.js` | 569 | LIVE | produced `organizations` 288 + `organization_sports` 1,088 + `contacts` 259 |
| Training seed | `packages/database/seed_test_training_accounts.js` | 171 | LIVE (test) | wired as `pnpm db:seed:test-accounts` |
| Seed safety | `packages/database/seed_safety.js` | 15 | LIVE | guard |
| Migration runner | `packages/database/run_migrations.js` | 43 | LIVE | — |
| Test reset | `packages/database/reset_db.ts` | 44 | LIVE | wired as `pnpm db:reset` |
| `drop_migrations_table.ts` | `packages/database/drop_migrations_table.ts` | 7 | **DEAD footgun** | destructive one-shot |

---

## 4. Scripts, tools, dead frontend, deprecated config

### 4.1 `scripts/` — 46 files, 3,973 LOC — MIXED

- **Wired into `package.json` (LIVE):** 12 `validate-*.js` (`validate-api-route-registration`, `validate-seed-safety`, `validate-touched-counts`, and 9 `validate-v090-*`), plus `pre-deploy-gate.sh`, `verify-deploy.sh`, `backup-db.sh`, `pgbackrest-archive-local.sh`. Largest live validator: `validate-v090-launch-assignments.js` (300 LOC).
- **Fabricated-data generator (LIVE at generation time, REMOVE):** `scripts/generate_mock_data.py` (**1,291 LOC**, `random.seed(42)`) — the source of `mockSalesData.ts`/`territoryMock.ts` (plan §0).
- **One-shot DB-surgery `.cjs` (DEAD after use, dangerous):** `check_*`, `fix_*`, `split_william_orgs`, `cleanup_*`, `harden_crm_db`, `migrate_issues`, `run_classification_migration`, `seed-brandon`, `org_distribution`, `deep_check_denzer`, `debug_denzer_login`, `check_pin`, `_academy_audit{,2,3}`, `_cohort_audit`, `reset_admin_pin.js` (untracked). ~25 files; superseded by migrations.
- **Python test harnesses (DEFER):** `e2e_hardening_test.py` (269), `regression_test.py` (148), `crm_smoke_test.py` (117), plus root `audit_api.py`, `verify_refs.py`, `audit_stages.sh`, `test_roles.sh`.

### 4.2 `tools/` — **does not exist in the repo**

There is **no `tools/` directory inside the git repo** (VERIFIED — not in `git ls-tree HEAD`, not on disk under the repo). The `tools/` the plan lists is the **untracked sibling** `/Users/bradshaw/Repos/TUF-Ops/tools/teds/` (7 files: `generate-document.js`, `.css`, `.html`, `.md`, `README.md`). It duplicates `apps/web/src/lib/documentGenerator.ts`. **Liveness: outside git / UNKNOWN deployment** — cannot be referenced by any tracked build; INFERENCE: standalone dev tool.

### 4.3 `apps/frontend/` — dead second frontend — VERIFIED DEAD

- 56 source files, **2,980 LOC** of `src/`, plus its **own Prisma schema** (`apps/frontend/prisma/schema.prisma`, **294 LOC**, `@prisma/client` 5.7.1, NextAuth) — a **second source of truth** (Book/User/Organization/Team/Contact/Opportunity + invoices/uniform-orders/team-stores).
- **Explicitly excluded** in root `tsconfig.json` (`"exclude": [..., "apps/frontend", ...]`).
- **Not referenced by any build/deploy**: `vercel.json` builds `apps/web`; `railway.json` runs `apps/api`; no `pnpm --filter frontend`; its own `vercel.json.deprecated` remains; no `Dockerfile`.
- Last commit touching it: `73bd1340` (2026-07-29), vs `apps/web`/`apps/api` through 2026-09-21 — 2 months stale.
- **UNKNOWN:** whether any external Railway/Vercel service still points root at `apps/frontend`. *Settling evidence:* enumerate Railway/Vercel projects; the live checks (`/health`=`apps/api`, `ops.tufsports.us`=`apps/web`) plus config already indicate no.

### 4.4 Deprecated deploy configs (DEAD)

| File | Superseded by |
|---|---|
| `render.yaml.deprecated` (Render manifest, `rootDir: apps/api`) | `railway.json` + Railway project `TUF Ops` |
| `vercel.json.deprecated` (root) | live `vercel.json` |
| `apps/web/vercel.json.deprecated` | root `vercel.json` |
| `apps/frontend/vercel.json.deprecated` | (dead app) |
| `db/schema.sql` | **STALE** — legacy ecwid `orders`, a `team_stores` table absent live, no `deal_type`. Live DB authoritative. |

---

## 5. FK leak analysis — which FKs would pull universe rows into operational queries (R2 / T0.2 add)

R2 rules the 288-row `organizations` dataset is a **Market Intelligence Universe**, not operational `Markets`. R2's decision hinges on whether "`organizations` carries live operational FKs that would leak universe rows into operational queries." Answer, from live `pg_constraint`:

### 5.1 Every FK whose referenced table is `organizations` (VERIFIED — live query)

Query: `SELECT conrelid::regclass, conname, confdeltype FROM pg_constraint WHERE confrelid='organizations'::regclass AND contype='f'`.

| # | Child table | Column | ON DELETE | Rows live | Distinct orgs touched | Kind | Leak? |
|---|---|---|---|---|---|---|---|
| 1 | `opportunities` | `organization_id` | **CASCADE** | 6 | **4** | operational (revenue) | Low — child-driven only |
| 2 | `orders` | `organization_id` | **CASCADE** | 1 | **1** | operational (revenue) | Low |
| 3 | `activities` | `organization_id` | **CASCADE** | 0 | 0 | operational (touch log) | None today |
| 4 | `creative_requests` | `organization_id` | **SET NULL** | 0 | 0 | operational (asset) | None today |
| 5 | `executive_intake` | `related_organization_id` | **NO ACTION** | 0 | 0 | operational-ish (leadership) | None today |
| 6 | `contacts` | `organization_id` | **CASCADE** | **259** | **259** | ***breadth intelligence*** | **HIGH** |
| 7 | `activity_audit_history` | `organization_id` | **CASCADE** | 0 | 0 | audit | None today |
| 8 | `organization_sports` | `organization_id` | **CASCADE** | **1,088** | **272** | universe dimension (sport penetration) | **intended universe** |

**Outbound FKs from `organizations`: NONE.** `assigned_rep_id`, `assigned_director_id`, `territory_id` are bare integers with **no FK constraint** (VERIFIED via `pg_constraint` on `organizations`). So there is no DB-level edge *from* the universe out; the risk is entirely inbound.

### 5.2 The leak, stated precisely

The leak is **direction-dependent**:

- **Child → universe (does NOT leak today):** an operational list query (`SELECT … FROM opportunities`) returns only rows that exist. Only **4 orgs** have opportunities, **1** has an order. No operational query today surfaces extra universe rows through inbound FKs 1–5, because those tables are ~empty. This is not a guarantee — the **FK is `CASCADE` and unconstrained**, so *any* future import or activation that inserts an `opportunities`/`orders`/`activities` row for a universe org makes that org operationally visible. The FK does **not** prevent it.
- **Universe → operational surface (DOES leak today):** two inbound FKs carry **bulk universe data into tables an operational UI would naturally read**:
  - **`contacts.organization_id` — 259 rows, 259 distinct orgs (90% of the 288).** Contacts are the seed of the canonical **`Relationship`** entity. Any "People" / "Relationship" surface that lists `contacts` (or joins it to `organizations`) exposes **259 universe schools**. This is the single largest leak.
  - **`organization_sports.organization_id` — 1,088 rows, 272 distinct orgs.** This *is* the universe's sport-penetration dimension — correctly universe-scoped, but must never be promoted to a Market surface.

### 5.3 Consequence for R2 Option 1 vs Option 2

If `organizations` is reused as the universe **and** the operational list reads `organizations` directly, then **`getOrganizations()` returns 288 rows** and contacts join to 259 — R2's "hard domain separation, not a UI filter" fails, because the FK-addressable universe is the same table operational queries join to. This is the evidence motivating `UNIVERSE_VS_MARKETS.md`'s Option-2 direction (a **separate `markets` activation table** with `universe_organization_id` UNIQUE FK → `organizations`, while `organizations` keeps only the **breadth/intelligence** FKs `contacts` + `organization_sports`).

**Assertable invariant for the rebuild:** after cutover, *every* FK whose referenced table is `organizations` must originate from `{contacts, organization_sports}` (intelligence dimensions) — any other child table (opportunities/orders/activities/creative_requests/executive_intake/activity_audit_history) is a leak and must be re-pointed at `markets`. `UNIVERSE_VS_MARKETS.md` §6 already encodes this as a SQL assertion.

**Confidence:** FK inventory + `confdeltype` + row/distinct counts = **VERIFIED** (live `pg_constraint`, `information_schema`, exact `COUNT(*)`). "Option 1 fails / Option 2 required" = **INFERENCE** from that inventory (design belongs to W01/W06).

### 5.4 Related schema facts (VERIFIED, live)

- **All seven FKs referencing `opportunities(id)` are `ON DELETE CASCADE`:** `opportunity_stage_history`, `activities`, `commissions`, `production_requests`, `orders`, `creative_requests`, `activity_audit_history`. Deleting an opportunity silently destroys orders/commissions/history → destructive SQL is banned during the rebuild (R1).
- `commissions` and `production_requests` have **no direct FK to `organizations`** (they reach org only via `opportunity_id`).
- Live row truth (exact): `organizations` **288**, `organization_sports` **1,088**, `contacts` **259**, `opportunities` **6**, `orders` **1**, `commissions` **1**, `activities` **0**, `users` **6**, `pgmigrations` **70**, tables in `public` **66**.
- Org concentration: **org 430 (Big Lake HS) holds 3 of 6 opportunities**; orgs 174, 209, 526 hold 1 each.
- `db/schema.sql` is stale vs this live state (see §4.4).

---

## 6. Fabricated / prototype residue (liveness, for the quarantine plan)

| Artifact | Path | Size | Evidence | Tag |
|---|---|---:|---|---|
| Fabricated sales objects | `apps/web/src/data/mockSalesData.ts` | 10,312 LOC | imported by 32 web files (27 type-only, 5 value) | VERIFIED |
| Fabricated territory coverage | `apps/web/src/data/territoryMock.ts` | 78 LOC | value-imports `mockSalesData` | VERIFIED |
| Mock generator | `scripts/generate_mock_data.py` | 1,291 LOC | `random.seed(42)`; "Generate ultra-realistic 60-day mock data" | VERIFIED |
| Bootstrap cross-product | live `organization_sports` | 1,088 rows | 1,036 share one `created_at` (`tuf_leads_final_enriched.csv`, plan §0) | VERIFIED (plan) |
| Stale backup tests | `__tests__bak/` | 2 files | orphaned pre-refactor page tests | VERIFIED |
| Un-authoritative training copy | sibling `docs/training/` | 24 files | differs from tracked `apps/web/public/training/` (16 files) | VERIFIED (plan) |

---

## 7. What could not be determined (UNKNOWN — not guessed)

1. **Cause of the 65-on-disk vs 70-applied migration mismatch.** *Settles via:* diffing `pgmigrations` names against the files on disk.
2. **Whether any external service still deploys `apps/frontend`.** *Settles via:* enumerating Railway/Vercel projects for a root = `apps/frontend`. Current config/docs indicate no.
3. **Whether the 9 unmounted API modules were ever mounted in an untracked/deployed build.** `git log -S` finds no index.ts import for them in tracked history → *INFERENCE:* never mounted. A production access-log check for e.g. `/issues` 200s would settle it (current live probe returns 404).
4. **Deployment status of the sibling `tools/teds` generator.** Outside git; no tracked reference.
5. **`rep_activities.opportunity_id` has no FK (plan open-Q8).** Table is live (`rep_activities`, 0 rows); whether 2.0 adds the constraint or retires the table is a design decision.

---

## 8. Audit method (reproducible, read-only)

```bash
# LOC / file counts
find <dir> -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' \) -exec cat {} + | wc -l
# import / call-site counts
grep -rl --include='*.ts' --include='*.tsx' "<basename>" apps packages e2e | grep -v node_modules | grep -v dist
# route mounts (the only registration point)
grep -n "server.register" apps/api/src/index.ts
# live FK inventory
railway run --service Postgres -- bash -c "PGOPTIONS='-c default_transaction_read_only=on' psql \"\$DATABASE_PUBLIC_URL\" -tAc \"SELECT conrelid::regclass, conname, confdeltype FROM pg_constraint WHERE confrelid='organizations'::regclass AND contype='f'\""
# live liveness probe
for ep in /api/v1/issues /api/v1/recruiting/dashboard /api/v1/people /api/v1/organizations; do curl -s -o /dev/null -w "%{http_code} $ep\n" "https://terrific-patience-production-bc32.up.railway.app$ep"; done
```

All commands are read-only; DB access is wrapped in `default_transaction_read_only=on`. No source, schema, migration, or config file was modified; no commit/branch/deploy performed.

---

## 9. Bottom line for the rebuild

- The **live stack is `apps/api` (Fastify + `pg`) + `apps/web` (Vite SPA) + `packages/{shared,auth,database}`** — not Prisma, not Next.js.
- **The frontend has a second, parallel dead future** (`apps/frontend` + its Prisma schema) and a **duplicated data layer inside the live app** (`api/*` vs `services/*`).
- **9 API modules are built but unreachable (404 live)** — 8 with no `.register` call plus `vendors` (imported, never registered) — 5 of them still called by live pages; a broken surface to remove or wire.
- **~10,687 LOC of the frontend's data layer is fabricated**, with `mockSalesData.ts` doing double duty as the web type source — the top coupling to unwind.
- **The R2 leak is real and localized:** 8 FKs reference `organizations`; `contacts` (259/288 orgs) and `organization_sports` (272 orgs) are the bulk-leak vectors; the six operational FKs are CASCADE and unconstrained, so they don't leak today only because those tables are near-empty. Hard separation (Option 2) is the evidence-supported path.
