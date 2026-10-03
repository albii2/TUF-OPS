# TUF Ops 2.0 — Subsystem Classification (Phase 0 / T0.4)

**Status:** Draft for Gate 0 exit · **Task:** T0.4 · **Author:** Phase 0 audit subagent
**Repo:** `TUF-OPS Repo` @ `feat/opportunity-lifecycle` (`59372e12`) · **Live DB:** PostgreSQL 18.6, revision per plan
**Mandate:** read-only for code/git; this file is the only write.

---

## How to read this document

Each meaningful subsystem is classified into exactly one of **KEEP / MODIFY / REBUILD / REMOVE / DEFER**.

**Confidence tags** (required by plan §1, step 3):

| Tag | Meaning |
|---|---|
| **VERIFIED** | Directly observed in the repo at the audited commit, in CI/deploy config, or established with live evidence in the plan's 2026-09-24 audit (§0). |
| **INFERENCE** | Reasoned from code shape / adjacent evidence; not directly proven. |
| **UNKNOWN** | Liveness or ownership cannot be determined from available evidence. What would settle it is stated inline. |

**Governing test for every REMOVE / DEFER call** (plan §R7, applied verbatim):
> *"Does this help TUF penetrate a market, generate revenue, fulfil the work, or expand the account?"*
> If no, it is not MVP and must not consume 48h budget. **DEFER ≠ delete** — real content is preserved.

**Founder rulings applied (binding, 2026-09-30):**
- **R1** — the legacy transaction (order id 2 / commission id 1, $1,750 GP) is **not migrated**; no `Order/RevenueReference` backfill. The CASCADE finding survives as a schema fact only.
- **R2** — the 288-org MN dataset is a **Market Intelligence Universe**, never promoted wholesale to `Market`; hard domain separation, not a UI filter.
- **R3** — the legacy "active 18" concept is **never migrated**; launch begins with exactly three deliberately commissioned markets (Pillager, Pequot Lakes, Brainerd).

---

## Audit finding that overrides a plan assumption (read first)

The plan's Tech Stack line and §5 list **"Prisma client + migrations"** as `KEEP` infrastructure. **This is factually wrong for the live stack.**

- The live API (`apps/api`, Fastify — `apps/api/src/index.ts:1,24`) talks to Postgres via a raw **`pg.Pool`** (`packages/database/src/db.ts:12`) and **`node-pg-migrate`** (root `package.json` `db:migrate` scripts).
- **No Prisma import exists anywhere in `apps/api/src`, `apps/web/src`, or `packages/database/src`** (`grep -rl prisma` → empty). The only `schema.prisma` outside `node_modules` is **`apps/frontend/prisma/schema.prisma`** — the dead Next.js second frontend.

**Consequence:** the persistence infrastructure to KEEP is **`pg` + `node-pg-migrate`**, not Prisma. Prisma belongs to the REMOVE-classed `apps/frontend`. The plan's §5 `KEEP` line should be corrected before Gate 0.

Two further verified discrepancies to fold into T0.5 / the risk register:
1. **Migration count mismatch:** `packages/database/migrations/` holds **65 `.js` files on disk**, while the plan reports **70 applied** live. Cause UNKNOWN (deleted/renamed migrations or re-run history). The **live DB is authoritative**; reconciliate during migration planning.
2. **Plan calls the frontend "Next.js App Router."** The live frontend is **`apps/web`, a Vite + React 18 + react-router-dom SPA** (`vercel.json` `"framework": "vite"`, `outputDirectory: apps/web/dist`). Next.js exists only in the dead `apps/frontend`. Target-architecture work should not assume an App Router that isn't there.

---

## 1. Persistence & data foundation

| Subsystem | Path | Class | Justification | Depends on | Blocks | Conf |
|---|---|---|---|---|---|---|
| Live DB access layer (`pg.Pool`) | `packages/database/src/db.ts` | **KEEP** | The actual production persistence client used by every API module; no Prisma in the live stack. | `DATABASE_URL` | everything | VERIFIED |
| Migration system (`node-pg-migrate`, 65 on disk) | `packages/database/migrations/` | **KEEP** | Working, live-applied schema history; 2.0 appends forward migrations only, never edits applied ones. | db layer | all schema work | VERIFIED |
| `db/schema.sql` | `db/schema.sql` | **REMOVE** (regenerate) | **STALE vs live DB**: legacy ecwid `orders`, a `team_stores` table absent live, no `deal_type`; misleads anyone trusting repo files. Delete or regenerate from live. | live DB | docs/onboarding trust | VERIFIED |
| DB reset / seed-safety helpers | `packages/database/{reset_db.ts,.js,seed_safety.js,run_migrations.js}` | **MODIFY** | `reset_db` + `seed_safety` are useful test/dev guards; keep but fence from prod. | db layer | QA, seeding | INFERENCE |
| `drop_migrations_table` | `packages/database/drop_migrations_table.ts` | **REMOVE** | Destructive one-shot that drops migration bookkeeping; retained only as a footgun. | — | — | VERIFIED |
| Lead-CSV seed | `packages/database/seed_leads_from_csv.js` | **MODIFY** | Seeds the 288 orgs / 1,088 `organization_sports`; becomes the **Market Universe** seed (R2), not `Market`. | R2 model | universe separation | VERIFIED |
| Test / training seeds | `packages/database/seed_test_training_accounts.js` | **DEFER** | Academy/training fixtures — no MVP value (R7); keep, do not wire into 2.0 prod seed. | R7 | Academy | VERIFIED |

---

## 2. Shared domain model & types (`packages/shared`)

| Subsystem | Path | Class | Justification | Depends on | Blocks | Conf |
|---|---|---|---|---|---|---|
| `RevenueLane` enum + `Organization`/`LaneStatus` types | `packages/shared/src/types/organization.ts` | **REBUILD** | Four-lane `UNIFORM\|TRAVEL_GEAR\|TEAM_STORE\|LETTERMAN` (line 3) is obsolete; replaced by three engines (TEAM_UNIFORMS / LETTERED / ISSUE) + `Market`/`Relationship`/`LetteredDeployment`. | R1–R3 | all revenue engines | VERIFIED |
| Opportunity shared types | `packages/shared/src/types/opportunity.ts` | **REBUILD** | Stage model + lane coupling rebuilt into typed `RevenueOpportunity` (TEAM_UNIFORMS\|ISSUE) with state machine. | new schema | SELL engine | INFERENCE |
| Order / Activity shared types | `packages/shared/src/types/order.ts` | **MODIFY** | Order/production lifecycle is reusable; strip lane-specific free-text `deal_type`. | new schema | OPERATE | INFERENCE |
| User / Role shared types | `packages/shared/src/types/user.ts` | **MODIFY** | Identity + role renames for R6 taxonomy; mechanism survives. | R6 | ADMIN, PEOPLE | VERIFIED |
| Candidate types | `packages/shared/src/types/candidate.ts` | **KEEP** | Recruiting types are lane-independent and sound; carry forward. | — | Recruiting | VERIFIED |
| Barrel export | `packages/shared/src/index.ts` | **MODIFY** | Re-export surface must follow the rebuilt type set; Commander-gated shared file. | shared types | all consumers | VERIFIED |

---

## 3. Auth & authorization

| Subsystem | Path | Class | Justification | Depends on | Blocks | Conf |
|---|---|---|---|---|---|---|
| Phone/PIN auth mechanism + session | `apps/api/src/auth.ts`, `packages/auth` | **KEEP** | Working infrastructure backing the live API; R6 says keep the mechanism. | `users` | all protected routes | VERIFIED |
| Role / permissions model | `packages/auth/src/{roles,permissions}.ts`, `apps/web/src/config/roles.ts` | **MODIFY** (R6) | Role taxonomy (ADMIN/REGIONAL_DIRECTOR/DIRECTOR/TAE/OPERATIONS) is product; rebuild the matrix to 2.0 surfaces. | R6 | ADMIN nav, QA perms | VERIFIED |
| Stage-guard helpers | `packages/auth/src/stages.ts` | **MODIFY** | Ad-hoc stage strings move into typed state machines + transition guard table (§2.3). | state machines | engines | VERIFIED |
| Credential version / PIN-change flow | migrations `1900000034000`, `apps/web/src/pages/ChangeCredentialPage.tsx` | **MODIFY** | Works, but coupled to the old user model; keep behaviour, re-home the model. | R6 | auth UX | INFERENCE |

---

## 4. API backend (`apps/api/src/modules/*`)

| Subsystem | Path | Class | Justification | Depends on | Blocks | Conf |
|---|---|---|---|---|---|---|
| API entrypoint & route registration | `apps/api/src/index.ts` | **MODIFY** | Fastify app + route table is working infra; new modules register here. **Commander-gated.** | auth, db | all API work | VERIFIED |
| `opportunities` module | `apps/api/src/modules/opportunities/` | **REBUILD** | Embeds 4-lane `channel_type` + `UNIQUE(org,sport,season,year,channel_type)` that collides when lanes collapse (org 430 case); replaced by `RevenueOpportunity` + `LetteredDeployment`. | new schema | SELL engine, migration | VERIFIED |
| `orders` module | `apps/api/src/modules/orders/` | **MODIFY** | CLOSED_WON→order conversion works; remove free-text `deal_type`, tighten integrity (no CHECK exists today). | new schema | OPERATE, R1 cut | VERIFIED |
| `commissions` module | `apps/api/src/modules/commissions/` | **MODIFY** | 18% rep / 5% director math is real and correct; R1 discards only the legacy **row**, not the logic. | orders | earnings | VERIFIED |
| `organizations` module | `apps/api/src/modules/organizations/` | **MODIFY** | Becomes Universe (read-only intelligence) + **ACTIVATE MARKET** gateway (R2/R3); add activation endpoints. | R2 model | MARKETS surface | VERIFIED |
| `contacts` (within organizations) | `apps/api/src/modules/organizations/` | **MODIFY** | Becomes `Relationship` (person↔market/institution). | new schema | MARKETS, SELL | INFERENCE |
| `activities` module + audit history | `apps/api/src/modules/activities/` | **KEEP** | Append-only touch log is exactly canonical `Activity`; FK + `activity_audit_history` are sound. | db | COMMAND, Activity | VERIFIED |
| `production-requests` module | `apps/api/src/modules/production-requests/` | **MODIFY** | Becomes canonical `Production Reference`; strip lane coupling. | orders | OPERATE | VERIFIED |
| `creative-requests` module | `apps/api/src/modules/creative-requests/` | **KEEP** | Creative/marketing asset requests map to canonical `Asset`; no MVP blocker. | db | OPERATE | INFERENCE |
| `reporting` module + owner dashboard | `apps/api/src/modules/reporting/` | **REBUILD** | Feeds vanity dashboards and lane metrics; COMMAND must be an action queue, not a report (§2.4). | new schema | COMMAND | VERIFIED |
| `dashboard` module | `apps/api/src/modules/dashboard/` | **REBUILD** | Same vanity-metric problem; superseded by COMMAND's five questions. | new schema | COMMAND | INFERENCE |
| `work-items` module | `apps/api/src/modules/work-items/` | **MODIFY** | Already carries `suggested_action` / `due_at` / `linked_entity` — the deterministic next-action crude form of canonical `Task`. | new schema | COMMAND, automation | VERIFIED |
| `daily-activities` module | `apps/api/src/modules/daily-activities/` | **MODIFY** | Feeds daily Activity/Task queues; reusable with new contracts. | activities | COMMAND | INFERENCE |
| `users` module | `apps/api/src/modules/users/` | **KEEP** | Identity CRUD backing auth; carry forward. | R6 | auth | VERIFIED |
| `vendors` module + vendor docs | `apps/api/src/modules/vendors/`, `apps/api/docs/VENDOR_*` | **DEFER** | Vendor ordering supports fulfilment but is not on the 48h acceptance walk; no MVP value yet. | orders | — | INFERENCE |
| `recruiting` module | `apps/api/src/modules/recruiting/` | **DEFER** | Real pipeline, but recruiting reps does not penetrate a market / generate revenue inside 48h. | — | PEOPLE | INFERENCE |
| `people` module | `apps/api/src/modules/people/` | **DEFER** | HR/people-ops surface; no MVP value. | — | PEOPLE | INFERENCE |
| `issues` module (employee issues) | `apps/api/src/modules/issues/` | **DEFER** | Internal HR issue tracking; no MVP value. | — | PEOPLE | INFERENCE |
| `intake` (executive intake) | `apps/api/src/modules/intake/` | **DEFER** | Leadership intake workflow; no MVP value. | — | PEOPLE | INFERENCE |
| `comms` (leadership comms) | `apps/api/src/modules/comms/` | **DEFER** | Leadership broadcast; no MVP value. | — | PEOPLE | INFERENCE |
| `announcements` module | `apps/api/src/modules/announcements/` | **DEFER** | Internal announcements; no MVP value. | — | PEOPLE | INFERENCE |
| Academy/training modules (`academy`, `academy-command`, `academy-resources`, `academy-v2`, `training`) | `apps/api/src/modules/academy*`, `.../training` | **DEFER** (R7) | Substantial real content, zero MVP value per governing test; **do not delete**. | R7 | PEOPLE nav | VERIFIED |
| `data-integrity.test.ts` | `apps/api/src/modules/data-integrity.test.ts` | **REMOVE** (or fix) | **False-confidence test** — line 103 asserts a `23514` orders CHECK that does not exist; it passes only because `orders_closed_won_opportunity_trigger` fires. Delete or replace with a test for the real trigger. | — | QA trust | VERIFIED |
| Module test suites (`*/__tests__`, `modules/shared/*`) | `apps/api/src/modules/**/__tests__` | **MODIFY** | Keep as the regression base; rewrite expectations for the new state machines. | new schema | QA | VERIFIED |

---

## 5. Frontend (`apps/web` — the live Vite SPA)

| Subsystem | Path | Class | Justification | Depends on | Blocks | Conf |
|---|---|---|---|---|---|---|
| App shell & router | `apps/web/src/App.tsx`, `components/AppShell.tsx` | **REBUILD** | IA is the old lane-era product; rebuilt around COMMAND/MARKETS/SELL/OPERATE/PEOPLE/INTELLIGENCE/ADMIN (§2.4). | new nav | all UI | VERIFIED |
| Nav / role-visibility config | `apps/web/src/config/roles.ts`, `roleSmokeContract.ts` | **MODIFY** | `visiblePages` re-derived from the new nav + R6 roles. | R6 | UI perms | VERIFIED |
| Role home / COMMAND candidates | `pages/{CEOHome,DirectorHome,TAEHome,ExecutiveCommandCenter,ExecutiveDashboard}.tsx` | **REBUILD** | Role vanity dashboards, not the "what requires action today" queue COMMAND must be. | new schema | COMMAND | VERIFIED |
| Markets / Organizations surface | `pages/{OrganizationsPage,OrganizationDetailPage}.tsx` | **REBUILD** | Must render `Market` (activation) only, with Universe as reference — the R2 hard separation. | R2 model | MARKETS | VERIFIED |
| Pipeline / Opportunity surfaces | `pages/{OpportunitiesPage,OpportunityDetailPage,MyOpportunitiesPage,TeamOpportunitiesPage,EcosystemPipelinePage}.tsx` | **REBUILD** | Built on 4-lane model; replaced by three-engine views. | new schema | SELL | VERIFIED |
| Orders / Production operate surface | `pages/{OrdersPage,OrderDetailPage,RepOrdersPage,ProductionTrackerPage}.tsx` | **MODIFY** | Operate flows are broadly reusable; strip lane `deal_type`, rewire contracts. | orders API | OPERATE | INFERENCE |
| Territory map (Leaflet) | `pages/{TerritoryMapPage,TerritoryPage}.tsx`, `components/TerritoryMap*.tsx` | **DEFER** | Plan §2.4 explicitly: "map must not delay MVP"; returns post-launch. | — | — | VERIFIED |
| Earnings components | `components/{RepEarnings,DirectorEarnings,OwnerEarnings}.tsx` | **DEFER** | Read fabricated `mockSalesData`; cannot ship as-is, and real earnings are not on the MVP walk. | commissions | — | VERIFIED |
| API client + real API services | `services/apiClient.ts`, `opportunitiesService.ts`, `ordersService.ts`, `organizationsService.ts`, `usersService.ts`, `workItemsService.ts`, `activitiesService.ts`, `creativeRequestsService.ts`, `recruitingService.ts` | **MODIFY** | Genuine API-backed services; reusable pattern, contracts updated to canonical entities. | API | UI | VERIFIED |
| Mock-only / simulated services | `services/{reportsService,territoryService,lighthouseEngine,forgeEngine,businessSelectors,v085DataCleanup}.ts` | **REMOVE** | Return hard-coded fixtures or simulations (`reportsService.ts` returns `reportsSummary` from mock data) — the fabricated-reporting residue the brief bans. | — | INTELLIGENCE | VERIFIED |
| Query hooks (`hooks/*`) | `apps/web/src/hooks/` | **MODIFY** | TanStack Query hooks are reusable; types/keys updated to new contracts. | API | UI | VERIFIED |
| `lib/academy.ts` | `apps/web/src/lib/academy.ts` | **DEFER** (R7) | ~35 obsolete four-lane refs, no MVP value; **do NOT delete — real content** (R7). | R7 | PEOPLE nav | VERIFIED |
| `lib/achievements.ts` | `apps/web/src/lib/achievements.ts` | **DEFER** | Badge IDs (`lane-travel-gear`, `lane-team-store`, `lane-letterman`, `lane-four-lane-operator`) are persisted; labels are cosmetic — keep IDs for continuity, defer rewording. | R7 | Academy | VERIFIED |
| `lib/documentGenerator.ts` | `apps/web/src/lib/documentGenerator.ts` | **DEFER** | Document generation not on the MVP walk (duplicated by untracked `tools/teds`). | — | — | INFERENCE |
| Academy components | `components/academy/*`, `pages/{Academy*,LockerRoomSimulator*,AdminCertification*}` | **DEFER** (R7) | Real Academy content and simulator; no MVP value, preserve (R7). | R7 | PEOPLE nav | VERIFIED |
| Training library (tracked) | `apps/web/public/training/` (16 files) | **DEFER** (R7) | **Tracked copy is authoritative for the app**; ships today but not MVP-critical; preserve. | R7 | Academy | VERIFIED |
| Brand imagery / assets | `assets/`, `TUF Ops Theme/`, `components/SportsTicker.tsx` | **DEFER** | Branding, not functional; no MVP value. | — | — | INFERENCE |
| Real geo reference data | `apps/web/src/data/mnZipCoords.ts` | **KEEP** | Real MN zip/coordinate reference (not fabricated); needed when the map/war-board returns. | — | Territory (post-MVP) | INFERENCE |

---

## 6. Fabricated data & prototype residue (REMOVE per brief)

| Subsystem | Path | Class | Justification | Depends on | Blocks | Conf |
|---|---|---|---|---|---|---|
| `mockSalesData.ts` | `apps/web/src/data/mockSalesData.ts` | **REMOVE** | Fabricated 4-lane sales/reporting objects; banned as reporting source. | — | INTELLIGENCE | VERIFIED |
| `territoryMock.ts` | `apps/web/src/data/territoryMock.ts` | **REMOVE** | Fabricated territory coverage; feeds `territoryService` mock. | — | INTELLIGENCE | VERIFIED |
| Mock-data generator | `scripts/generate_mock_data.py` | **REMOVE** | Produces the fabricated seed behind the two files above. | — | — | VERIFIED |
| Stale backup tests | `__tests__bak/` | **REMOVE** | Orphaned pre-refactor page tests; dead weight. | — | — | VERIFIED |

> Note: `mockSalesData` is imported by ~30 app modules (pages, hooks, services, components) — mostly for **type re-exports**. The removal will break imports, so T6.2 must move fixtures behind `__fixtures__` and re-point types at `@tuf/shared` **before** deletion (plan §5 MOVE line). Classification is REMOVE; sequencing is a migration task.

---

## 7. Dead second frontend & deprecated config (REMOVE)

| Subsystem | Path | Class | Justification | Depends on | Blocks | Conf |
|---|---|---|---|---|---|---|
| `apps/frontend` (Next.js + NextAuth) | `apps/frontend/` | **REMOVE** | Dead second frontend: not in `vercel.json` (framework=vite → `apps/web`) or `railway.json` (→ `apps/api`); `vercel.json.deprecated` present; docs call it "non-authoritative legacy". Halves maintenance surface. | — | — | VERIFIED |
| `apps/frontend/prisma/schema.prisma` | `apps/frontend/prisma/schema.prisma` | **REMOVE** | Second source of truth with **no live consumer** (no Prisma import in api/web/packages). Removing `apps/frontend` removes it. | apps/frontend | schema truth | VERIFIED |
| Legacy frontend docs | `apps/frontend/{DEPLOYMENT,USER_GUIDE,TESTING}.md`, `readiness_report_final_update.md` | **REMOVE/ARCHIVE** | Document a dead app; archive outside `docs/2.0`. | — | — | VERIFIED |
| Render deploy config | `render.yaml.deprecated` | **REMOVE** | Explicitly deprecated Render manifest. | — | — | VERIFIED |
| Vercel legacy manifest | `vercel.json.deprecated` | **REMOVE** | Deprecated duplicate of live `vercel.json`. | — | — | VERIFIED |

---

## 8. Scripts, tooling & CI

| Subsystem | Path | Class | Justification | Depends on | Blocks | Conf |
|---|---|---|---|---|---|---|
| One-shot remediation scripts | `scripts/{check_*,fix_*,split_*,cleanup_*,harden_crm_db,migrate_issues,run_classification_migration,seed-brandon,org_distribution,deep_check_denzer,debug_denzer_login,check_pin}.cjs` | **REMOVE** (archive first) | Ad-hoc DB surgery superseded by migrations/seed; dangerous if re-run against prod. | — | — | VERIFIED |
| Deploy-safety validators | `scripts/{validate-api-route-registration,validate-seed-safety,validate-touched-counts}.js`, `pre-deploy-gate.sh`, `verify-deploy.sh` | **KEEP** | Guard route registration + non-destructive seeding + deploy health; still relevant. | CI | deploys | INFERENCE |
| v0.9.0-era validators | `scripts/validate-v090-*.js` | **DEFER** | Launch-gate scripts for the superseded release; retire after 2.0 replaces the gates. | — | — | INFERENCE |
| Backup / PITR scripts | `scripts/{backup-db.sh,pgbackrest-archive-local.sh}` | **KEEP** | Operational safety net; retained per founder "no destructive SQL" stance. | Railway | ops | VERIFIED |
| Ad-hoc audit scripts | `scripts/{audit_api.py,audit_stages.sh,verify_refs.py,test_roles.sh}`, `scratch/check_users.js` | **DEFER** | Useful during the audit; not production. | — | — | INFERENCE |
| CI + migration gate | `.github/workflows/{ci.yml,migrate-railway.yml}` | **KEEP** | Working CI and Railway migration workflow. | repo | merges, deploys | VERIFIED |
| E2E harness | `e2e/*` (Playwright) | **MODIFY** | Harness + auth setup reusable; lane-specific specs rewritten for 2.0 routes. | UI | QA | VERIFIED |

---

## 9. Deploy, dataset & data-scope (ruling-driven)

| Subsystem | Path | Class | Justification | Depends on | Blocks | Conf |
|---|---|---|---|---|---|---|
| Railway backend config / service | `railway.json`, Railway project `TUF Ops` / `terrific-patience` | **KEEP** (R5) | Live, healthy, correct branch target; 2.0 deploys from `rebuild/2.0` on the same service (R5). | R5 | deploy | VERIFIED |
| Vercel frontend config | `vercel.json` (`ops.tufsports.us`) | **KEEP** (R5) | Live Vite frontend deploy; reuse. | R5 | deploy | VERIFIED |
| **MN dataset** — 288 `organizations`, 1,088 `organization_sports`, 259 `contacts` | live DB (seeded via `seed_leads_from_csv.js`) | **MODIFY** (R2) | Becomes the **Market Intelligence Universe**, structurally incapable of appearing as a `Market`; **never promoted wholesale** (R2). | R2 model | MARKETS, seeding | VERIFIED |
| Legacy transaction (order id 2, commission id 1, $1,750 GP) | live DB rows | **REMOVE from migration scope** (R1) | R1: not important enough to constrain architecture; no backfill, no settlement flow. Legacy rows simply fall outside the 2.0 seed. | R1 | migration | VERIFIED |
| Legacy "active 18" concept | plan/`LAUNCH_90_DAY_PLAN.md:1181` | **REMOVE** (R3) | R3: no operational significance; only literal source is "Remaining 18 **orgs**". Launch = 3 commissioned markets only. | R3 | Phase-2 cleanup | VERIFIED |
| Seven `ON DELETE CASCADE` FKs on `opportunities` | live schema | **MODIFY** (schema finding) | Survives R1 as an audit fact only, but informs 2.0 FK design; destructive SQL banned during development. | new schema | migration safety | VERIFIED |
| Drops OS integration | *(does not exist yet)* | **REBUILD** (new, R8) | Must be built as the narrow authenticated **read-only** contract; consumer commerce never duplicated. | R8 | LETTERED metrics | VERIFIED |
| Untracked sibling trees `~/Repos/TUF-Ops/{docs,src,tools,Orders}` | outside git | **DEFER** | Hold obsolete-lane docs + the 24-file training copy (differs from tracked); plan open-Q9 — fold into git or archive, **do not delete**. | — | docs | VERIFIED |

> **UNKNOWN (explicitly not guessed):** the liveness of `apps/frontend/prisma/schema.prisma` as a *deployed* source of truth is judged dead from config + docs (VERIFIED non-deployed), but if any external Railway/Vercel service still points at `apps/frontend`, that would change the picture. **What settles it:** enumerate Railway/Vercel projects and confirm no service root = `apps/frontend`; the plan's live check (`/health` = `apps/api`, `ops.tufsports.us` = `apps/web`) plus `vercel.json` framework already indicates no. Also **UNKNOWN**: exact cause of 65-on-disk vs 70-applied migrations (see top-of-doc finding).

---

## 10. Classification summary

| Class | Count (data rows) | Representative items |
|---|---|---|
| **KEEP** | 13 | pg Pool, migrations, auth, activities, users, contacts data, backup scripts, CI, Railway/Vercel, MN geo coords |
| **MODIFY** | 24 | orders, commissions, organizations→markets, role model, work-items→Task, hooks, API client, validators, dataset |
| **REBUILD** | 10 | `RevenueLane`, opportunities module, reporting/dashboard, App shell/IA, COMMAND, MARKETS, SELL pages, Drops contract |
| **REMOVE** | 14 | `db/schema.sql`, mock/territory data + generator, one-shot scripts, `apps/frontend`+Prisma, deprecated configs, legacy transaction, active-18, false-confidence test |
| **DEFER** | 20 | Academy/training + `academy.ts` + badges, territory map, earnings UI, recruiting/people/issues/comms, brand assets, untracked trees |
| **TOTAL** | **81** | classified subsystems |

**Gate 0 dependency spine (what must land in order):**
`R1/R2/R3 schema decision` → `packages/shared canonical types` → `prisma/schema… (i.e. new migrations)` + `packages/database seed_markets_2_0` → `apps/api entity modules` → `apps/web IA + COMMAND/MARKETS` → `Drops read contract` → `QA`.

**Blockers surfaced for T0.5 (schedule re-baseline):**
1. Correct the plan's Prisma assumption — persistence work is `pg` + `node-pg-migrate`.
2. Reconcile 65 vs 70 migrations before writing forward migrations.
3. Sequence the `mockSalesData` removal behind a type-repoint (T6.2) or ~30 modules break.
4. R4–R8 remain open and still gate their dependents; Phase 0 is unblocked except T0.1 (needs R4).
