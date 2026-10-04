# HARVEST AUDIT — `origin/v1/vite-fastify-rebuild`

**Type:** read-only archaeological harvest audit (NO merges, NO cherry-picks, NO git mutations)
**Auditor:** subagent (harvest workstream)
**Date:** 2026-10-03
**Target branch:** `origin/v1/vite-fastify-rebuild` @ `bf1d68b2`
**Reference branch:** `rebuild/2.0` @ `763369e0` (working tree also carries uncommitted W01 canonical types)
**Governing authority:** `.hermes/plans/2026-09-30_2030-tuf-ops-2.0-rebuild.md` (§"FOUNDER RULINGS APPLIED"), `docs/2.0/GATE0_CLOSEOUT.md`, `docs/2.0/CLASSIFICATION.md`

> **Read-only attestation:** this audit issued only `git show`, `git diff`, `git log`, `git ls-tree`,
> `git rev-parse`, `git grep`, `git merge-base` and file reads. No checkout, merge, cherry-pick,
> rebase, commit, push, stash, reset, or working-tree mutation was performed. The only file written
> is this document.

---

## 0. THE STANDARD APPLIED

For each artifact, one question:

> **Would reproducing this in 2.0 take longer than adapting it, WITHOUT importing its obsolete
> architecture or mock-data assumptions?**
> If adapting drags in obsolete architecture (four-lane model, four-role model, lane-based
> Opportunity/`laneStatuses`, 4-zone `metro/north/west/south` territory) or mock/fabricated runtime
> assumptions → **IGNORE**, no matter how polished.

Verdicts: **REUSE** (take as-is) · **ADAPT** (port with named changes) · **IGNORE** (do not port).

---

## 1. EXECUTIVE VERDICT

**REUSE: 0 items. ADAPT: 0 items (2 marginal candidates examined and rejected, §3). IGNORE: all 180 changed paths and all 28 commits.**

The branch is a **mock-backed V1 lineage** whose entire frontend is built on `apps/web/src/data/mockSalesData.ts`
— a four-lane (`UNIFORM | TRAVEL_GEAR | TEAM_STORE | LETTERMAN`) fabricated dataset — plus a four-role
(`OWNER | DIRECTOR | REP | OPS`) model and a 4-zone territory map. That is precisely the obsolete
architecture and the fabricated-reporting residue the 2.0 plan REMOVES.

**The stronger, decisive finding (VERIFIED, §2):** `rebuild/2.0` **already contains an equal-or-superior
version of every meaningful artifact on this branch.** The two branches did **not** evolve as
ancestor/descendant; they **diverged** at `f3168d59` ("feat: merge owner dashboard frontend") and grew
*parallel* `apps/web` and `apps/api` implementations. Because 2.0's copies are supersets, there is
nothing on the branch whose reproduction cost would be reduced by porting it.

**Nothing to cherry-pick. Nothing to resurrect. The branch is correctly classified as archaeological.**

---

## 2. STRUCTURAL CORRECTION — VERIFIED FACTS AHEAD OF ANY CLASSIFICATION

| Claim | Verified result | Evidence |
|---|---|---|
| "28 commits ahead of `rebuild/2.0`" | **28 commits reachable from v1 but not 2.0** — but this is **divergence, not descent**. | `git rev-list --count rebuild/2.0..origin/v1/vite-fastify-rebuild` = 28 |
| Merge base | **`f3168d59`** — an ancestor of 2.0's `59372e12`, but **neither branch is an ancestor of the other.** | `git merge-base` = `f3168d590…`; `merge-base --is-ancestor` both directions = false |
| Is v1 an ancestor of 2.0? | **No.** | `git merge-base --is-ancestor origin/v1/… rebuild/2.0` → false |
| Does 2.0 already have the branch's files? | **Yes, in divergent/superset form.** e.g. 2.0 `data/mockSalesData.ts` = 10,312 L vs branch = 211 L; 2.0 `pages/SettingsPage.tsx` = 516 L vs branch = 101 L; 2.0 `utils/leadImport.ts` = 183 L vs branch = 110 L. | `git rev-parse` hash compare + line counts across refs |
| Files on v1 but **not** in 2.0 | Only **2 source files** (`apps/web/src/data/mock.ts`, `apps/web/src/services/dataMode.ts`), tooling configs, root V1 docs, compiled `dist/**`, 2 PNGs, `.vercel/project.json`. | `comm` of `git ls-tree -r` |
| 2.0 `apps/api` orders module | **Superset** of the branch's: already has `createOrderFromOpportunity`, `ensureOrderFromClosedWonOpportunity` (idempotent), `FOR UPDATE` locking, `23505` unique-violation handling, auth-guarded routes. | `git show HEAD:apps/api/src/modules/orders/orders.service.ts` |

**Consequence:** the branch is a *sibling* that never integrated into 2.0's lineage. Treating it as
"ahead" would be a factual error. The plan's framing ("archaeological source code") is correct.

---

## 3. THE ONLY TWO MARGINAL `ADAPT` CANDIDATES — BOTH REJECTED

| Candidate | Source | Destination | Verdict & why it fails the test |
|---|---|---|---|
| **Settings UI** | `origin/v1/…:apps/web/src/pages/SettingsPage.tsx` (101 L) | — | **IGNORE.** 2.0 already ships `apps/web/src/pages/SettingsPage.tsx` (**516 L**, superset). Branch version is a localStorage-only mock (`PREF_KEY = 'tuf_ops_settings_v1'`), couples to the obsolete four-role model via `updateRole`/`Role`, and has no 2.0 settings API. Adapting drags in the dead role model; reproducing a prefs form is trivial and out of MVP scope. |
| **Brand logo** | `origin/v1/…:apps/web/src/components/ui.tsx` `TufLogo` | — | **IGNORE.** 2.0 already has `apps/web/src/assets/tuf-logo.svg` + `components/ui.tsx` (29 L) rendering it. Branch replaces the SVG with an inline text logo — a *regression*, not an improvement. |
| **(examined) lead-import CSV logic** | `origin/v1/…:apps/web/src/utils/leadImport.ts` (110 L) | — | **IGNORE.** 2.0 already has `apps/web/src/utils/leadImport.ts` (**183 L**, superset). The branch version is a strict subset and carries the obsolete `metro/north/west/south` `TerritoryId` model. |
| **(examined) territory-map SVG polygons** | `origin/v1/…:apps/web/src/pages/TerritoryMapPage.tsx` | — | **IGNORE.** Mock-backed, hardcoded polygon geometry, 4 fabricated zones; INTELLIGENCE ▸ Territory is explicitly post-MVP; plan §2.4 "map must not delay MVP". |

No candidate survives "adapt without importing obsolete architecture". **REUSE/ADAPT = 0.**

---

## 4. CLASSIFICATION — `apps/web` (frontend)

### 4.1 Components
| Source (on `origin/v1/vite-fastify-rebuild`) | Class | Justification | 2.0 already has |
|---|---|---|---|
| `apps/web/src/components/primitives.tsx` (22 L) | **IGNORE** | Imports `RevenueLane`/`LaneStatus`/`OpportunityStage` from `../../data/mockSalesData`; ships `LaneBadge`/`LaneStatusBadge` hardwired to the four-lane model. Adapting = importing the obsolete lane architecture. | `components/primitives.tsx` (34 L) |
| `apps/web/src/components/ui.tsx` (32 L) | **IGNORE** | `TufLogo`/`GlassCard`/`StatCard`; 2.0 renders a real SVG logo (see §3). | `components/ui.tsx` (29 L) |
| `apps/web/src/components/AppShell.tsx` (50 L) | **IGNORE** | Sidebar driven by `roleConfig` four-role + obsolete IA (Dashboard/My Opportunities/Territory/…). 2.0 nav is COMMAND·MARKETS·SELL·OPERATE·PEOPLE·INTELLIGENCE·ADMIN. | `components/AppShell.tsx` |
| `apps/web/src/components/OrganizationImportPanel.tsx` (44 L) | **IGNORE** | Titled "Owner Lead Import (Mock)"; preview-only, no persistence; gated on four-role `OWNER`; hardcoded default rep/director. Mock. | `components/OrganizationImportPanel.tsx` |

### 4.2 Config / types / auth
| Source | Class | Justification |
|---|---|---|
| `apps/web/src/config/business.ts` (10 L) | **IGNORE** | `REVENUE_LANES = ['UNIFORM','TRAVEL_GEAR','TEAM_STORE','LETTERMAN']`, `OPPORTUNITY_STAGES` mock list, typed from `mockSalesData`. |
| `apps/web/src/config/roles.ts` (48 L) | **IGNORE** | Obsolete four-role sidebar/dashboard config. |
| `apps/web/src/types.ts` (18 L) | **IGNORE** | `Role = 'OWNER'\|'DIRECTOR'\|'REP'\|'OPS'`; obsolete `SidebarKey`. |
| `apps/web/src/auth.ts` (54 L) | **IGNORE** | Mock auth: `loginWithPin` accepts only literal `'0000'`; hardcoded fake users; `localStorage`. 2.0 keeps real phone/PIN behind a clean boundary (R6). |
| `apps/web/src/vite-env.d.ts` | **IGNORE** | deleted on branch; 2.0 has `env.d.ts`. |

### 4.3 Services — mock-backed business logic (the founder's REMOVE class)
Every one returns fabricated in-memory data behind `DATA_MODE === 'mock'`:

| Source | Class | Obsolete assumption |
|---|---|---|
| `services/dataMode.ts` (2 L) | **IGNORE** | `DATA_MODE = 'mock'` — the mock switch itself; **ONLY unique source file on branch**, and it is the thing 2.0 deletes. |
| `services/opportunitiesService.ts` (41 L) | **IGNORE** | Filters over `opportunities` mock; four-lane `lane` param. |
| `services/ordersService.ts` (36 L) | **IGNORE** | Filters over `orders`/`opsWorkspaceQueue` mock. |
| `services/organizationsService.ts` (64 L) | **IGNORE** | Role-scoping over mock `organizations`; `TerritoryId` metro/north/west/south; hardcoded `now = 2026-05-01`. |
| `services/reportsService.ts` (14 L) | **IGNORE** | Returns `reportsSummary` mock (lane performance). |
| `services/territoryService.ts` (37 L) | **IGNORE** | `territories`/`repCoverage`/`untouchedAccountsQueue` from `territoryMock`. |
| `services/activitiesService.ts` (20 L) | **IGNORE** | Filters mock `activities`. |
| `services/businessSelectors.ts` (72 L) | **IGNORE** | `getLanePenetration` returns `Record<RevenueLane, number>` over `org.laneStatuses`; **the four-lane model encoded as selectors.** |
| `services/apiClient.ts` (27 L) | **IGNORE** | Generic fetch wrapper — but 2.0 already uses `axios` + `@tanstack/react-query` (`apps/web/src/api/*`). Redundant; trivial to reproduce. |

### 4.4 Hooks — thin `useMemo` wrappers over the mock services
`useOpportunities.ts`, `useOrders.ts`, `useOrganizations.ts`, `useReports.ts`, `useTerritory.ts` → **IGNORE** (all). Superseded by 2.0's react-query hooks (`apps/web/src/hooks/`).

### 4.5 Data — fabricated runtime data (the REMOVE class, explicitly)
| Source | Class | Justification |
|---|---|---|
| `apps/web/src/data/mockSalesData.ts` (211 L) | **IGNORE** | `RevenueLane` four-lane type; procedurally generates 112 orgs / 186 opps / 96 orders / 160 activities. Fabricated reporting. (2.0's 10,312 L copy is *also* REMOVE per GATE0.) |
| `apps/web/src/data/territoryMock.ts` (56 L) | **IGNORE** | Fabricated 4-zone territory/lane-penetration objects. |
| `apps/web/src/data/mock.ts` (v1-only) | **IGNORE** | 3 fake "next actions". |

### 4.6 Pages — all mock-backed / obsolete-IA
**IGNORE all:** `LoginPage.tsx` (mock PIN), `DashboardPage.tsx` (hardcoded "+12% this month", "68% AVG. PENETRATION", four-lane penetration), `SettingsPage.tsx` (§3), `TerritoryMapPage.tsx` (4-zone interactive map, non-MVP), `TerritoryPage.tsx` (4-zone lane-by-sport), `OrganizationsPage.tsx`, `OrganizationDetailPage.tsx`, `OpportunitiesPage.tsx`, `OpportunityDetailPage.tsx` (mock 9-stage `stageCtas` + `lane`), `OrdersPage.tsx`, `OrderDetailPage.tsx`, `OpsWorkspacePage.tsx`, `ReportsPage.tsx`, `TeamOpportunitiesPage.tsx`, `TeamPerformancePage.tsx`, `MyOpportunitiesPage.tsx`, `EarningsPage.tsx` (8%/2% mock commission), `NewPages.tsx` (`REVENUE_LANES` select), `CrudPages.tsx` (barrel of the above).

> **Only idea worth noting as a design reference (not a port):** the per-stage "what needs to happen
> next" CTA mapping (`OpportunityDetailPage.tsx stageCtas`, `owner_dashboard.logic.ts
> STAGE_STUCK_THRESHOLDS`). 2.0 already owns this concept via its typed state machines +
> deterministic next-action lookup (plan §2.5). Reproduce, do not port.

### 4.7 Utils
| Source | Class | Justification |
|---|---|---|
| `apps/web/src/utils/naming.ts` (36 L) | **IGNORE** | 2.0's version (37 L) is *more* advanced (multi-lane `lanes: RevenueLane[]`); branch is single-lane. `getLaneLabel`/`buildOpportunityDisplayName` are four-lane. |
| `apps/web/src/utils/format.ts` (9 L) | **IGNORE** | 2.0's version (14 L) is superior (proper `Intl` USD currency). Branch is a regression. |
| `apps/web/src/utils/leadImport.ts` (110 L) | **IGNORE** | Superset exists at 2.0 (183 L); branch carries `metro/north/west/south` `TerritoryId`. |

### 4.8 Shell / config / assets
`App.tsx` (four-role router), `main.tsx`, `styles.css` (design tokens — 2.0 already has `styles.css`), `tailwind.config.js`, `vite.config.ts`, `index.html`, `public/tuf-mark.svg` (2.0 has `src/assets/tuf-mark.svg` + `public/icons/tuf-mark.svg`), `postcss.config.js` (2.0 has `postcss.config.cjs`) → **IGNORE all**.

---

## 5. CLASSIFICATION — `apps/api` (backend)

| Source | Class | Justification |
|---|---|---|
| `apps/api/src/index.ts` (added `/health`, `orderRoutes`, `PORT`) | **IGNORE** | 2.0 already has a far richer entrypoint: `/health`, `/api/health`, `/api/v1/health`, `/health/data`, SPA static serving, CORS, auth hooks, `orderRoutes` mounted. |
| `apps/api/src/index.js` (deleted) | **IGNORE** | Dead JS twin removed on branch; 2.0 has no such file. |
| `apps/api/src/modules/orders/orders.routes.ts` (new) | **IGNORE** | 2.0's version adds `requireCertification()` guards; branch has none. |
| `apps/api/src/modules/orders/orders.{controller,service}.ts` | **IGNORE** | 2.0 is a superset (§2 table): adds `FOR UPDATE` locking, `23505` handling, `getOrdersByVendor/Status`, stage guard. Branch couples to old `channel_type`/`organization_id` schema. |
| `apps/api/src/modules/opportunities/opportunities.interface.ts` (new 9-stage enum + legacy aliases) | **IGNORE** | Replaced by 2.0's engine-specific state machines (`TEAM_UNIFORMS`/`ISSUE`/`LetteredDeployment`). |
| `apps/api/src/modules/opportunities/{controller,routes,service}.ts` | **IGNORE** | Old four-channel/lane opportunity API; 2.0 rebuilds around `RevenueOpportunity` + `Markets`. |
| `apps/api/src/modules/organizations/organizations.service.ts` | **IGNORE** | Hardcodes `'FOOTBALL','FALL',2026` and creates four `channel_type` opportunities per org (four-lane); includes a debug `console.log('Inserting opportunity with params:'…)`. |
| `apps/api/src/modules/reporting/*` (stage rename, route rename, `owner_dashboard.logic`) | **IGNORE** | Lane/stage-threshold logic keyed to obsolete stage names; no MVP value beyond the conceptual idea (§4.6). |
| `apps/api/src/modules/{commissions,production-requests}/*` | **IGNORE** | Test/route churn on the obsolete lane model. |
| `apps/api/src/test-db-override.ts`, `apps/api/jest.setup.cjs` | **IGNORE** | **Already byte-identical in 2.0** (`git rev-parse` hashes equal). Nothing to port. |
| `apps/api/jest.config.js` (setupFiles/moduleNameMapper) | **IGNORE** | 2.0's `jest.config.js` is identical in substance. |
| `apps/api/dist/**` (compiled JS + maps) | **IGNORE** | Build artifacts; junk. |

---

## 6. CLASSIFICATION — `packages/database`

| Source | Class | Justification |
|---|---|---|
| `packages/database/migrations/1900000002000_opportunities_program_uniqueness.js` (new) | **IGNORE** | Widens uniqueness to `(organization_id, sport, season, year, channel_type)` — still `channel_type`-based on the old `opportunities` table. The *insight* is already captured in the 2.0 plan §0 (discriminator must be in the key); 2.0 keys to the new `markets` table. |
| `…/1776804365915_-name-add-channel-type-to-opportunities.js` (modified) | **IGNORE** | Four-lane `channel_type` idempotency fix. |
| `…/1900000000000_consolidated_ops_workspace_schema.js` (modified) | **IGNORE** | Old-lineage schema churn. |
| `packages/database/src/db.ts` (default TEST URL + debug `console.log('[TEST DB]')`) | **IGNORE** | Trivial; the debug log is cruft. |
| `packages/database/src/db.js`, `dist/db.js` | **IGNORE** | Compiled duplicates. |

---

## 7. CLASSIFICATION — docs, tooling, misc

**All IGNORE** (they document the obsolete mock/four-lane/Next.js lineage):

| Artifact | Note |
|---|---|
| `docs/DIRECTOR_COMMAND_MODE.md`, `docs/TERRITORY_ASSIGNMENT_AND_WORKLOAD.md`, `docs/TUF_OPS_NAMING_CONVENTIONS.md`, `docs/V1_CANONICALIZATION_STATUS.md`, `docs/WEB_API_CONTRACT_PLAN.md`, `docs/WEB_BETA_*.md`, `docs/WEB_BUSINESS_LOGIC_COVERAGE_AUDIT.md`, `docs/WEB_DATA_ADAPTER_PLAN.md`, `docs/WEB_UX_AUDIT_AND_REBUILD_BLUEPRINT.md` | V1 docs describing four-lane roles/routes and the mock→API contract. `TUF_LEAD_IMPORT_SCHEMA.md` **already exists in 2.0**. |
| `REBUILD_BLUEPRINT.md`, `TESTING_GUIDELINES.md`, `readiness_report*.md`, `docs/v1.1_tickets.md`, `docs/RELEASE_READINESS_CHECKLIST.md` (v1-only) | Next.js-era V1 records; `TESTING_GUIDELINES.md` describes an e2e harness 2.0 does not share. |
| `eslint.config.js` (v1-only) | Superseded by 2.0 `eslint.config.mjs`. |
| `playwright.config.ts` (v1-only) | References the **dead** `apps/frontend` (`--filter frontend`, `NEXTAUTH_URL`). 2.0 already has `apps/web/playwright.config.ts` + `apps/web/e2e/golden-path/*`. |
| `apps/web/postcss.config.js` | 2.0 has `apps/web/postcss.config.cjs`. |
| `.vercel/project.json`, `packages/{auth,env,logger}/src/*.js` | Duplicated compiled JS / env noise. |
| `79526980-…(1).png`, `7B92D354-…(1).png` (repo root) | Untracked-style mockup screenshots dropped at repo root; not 2.0 assets. |
| `node_modules/**`, `pnpm-lock.yaml`, `package.json` | Branch root `package.json` still references `frontend`/`backend` filters and a Prisma `postinstall` for the dead `apps/frontend`; 2.0 root already corrects this (`dev:web`, `dev:api`). |

---

## 8. OBSOLETE-ARCHITECTURE RED FLAGS CONFIRMED ON THE BRANCH

- **Four-lane model:** `RevenueLane = 'UNIFORM' | 'TRAVEL_GEAR' | 'TEAM_STORE' | 'LETTERMAN'` at `data/mockSalesData.ts:1`, plus `laneStatuses` per org and a `lane` field on Opportunity/Order. Present in ≥22 branch files (grep: TRAVEL_GEAR 7, TEAM_STORE 6, LETTERMAN 9 outside the mock file).
- **Four-role model:** `OWNER | DIRECTOR | REP | OPS` (`types.ts`, `config/roles.ts`, `auth.ts`).
- **4-zone territory:** `TerritoryId = 'metro' | 'north' | 'west' | 'south'` (`mockSalesData.ts`, `territoryMock.ts`, `TerritoryMapPage.tsx`).
- **Mock/fabricated runtime data:** `DATA_MODE='mock'`; 112/186/96/160 procedurally generated rows; hardcoded KPI deltas on the dashboard.
- **No frontend tests on the branch** (`git ls-tree -r … apps/web | grep -Ei 'test|spec'` → none).

None of these may be ported.

---

## 9. WHAT TO PORT

**Nothing.** REUSE = 0, ADAPT = 0. Concretely:

- No file needs copying: every meaningful artifact already exists in `rebuild/2.0` in an equal-or-superior form, and the remainder is mock data, obsolete architecture, compiled junk, or V1 docs.
- The two ideas with residual value — **(a)** deterministic "stuck/stage CTA" mapping (`OpportunityDetailPage.tsx stageCtas`, `owner_dashboard.logic.ts STAGE_STUCK_THRESHOLDS`) and **(b)** the MN CSV field mapping — are **already represented** in the 2.0 plan (deterministic next-action lookup §2.5) and in 2.0's own `docs/TUF_LEAD_IMPORT_SCHEMA.md` / `utils/leadImport.ts`. Reproduce them natively; do not import the branch files.

---

## 10. CONFIDENCE LEDGER

**VERIFIED (git evidence):**
- 28 commits, merge-base `f3168d59`, branches diverged, neither is an ancestor of the other (§2).
- File-set difference between branch and 2.0 (`comm` of `git ls-tree -r`): only 2 unique source files on the branch (`data/mock.ts`, `services/dataMode.ts`).
- Sampled hash/line-count comparisons: `test-db-override.ts` and `jest.setup.cjs` byte-identical; `mockSalesData.ts` 10,312 vs 211; `SettingsPage.tsx` 516 vs 101; `leadImport.ts` 183 vs 110; `naming.ts` 37 vs 36; `format.ts` 14 vs 9; `ui.tsx` 29 vs 32; `primitives.tsx` 34 vs 22.
- 2.0 `orders.service.ts` is a superset of the branch's (idempotent create, locking, unique-violation handling).
- Four-lane / four-role / 4-zone strings at the exact paths cited in §8.
- No frontend test files on the branch.

**INFERENCE:**
- That 2.0's existing same-named web files are "equal or superior" is inferred from size, API surface (react-query/axios, real SVG logo, Intl currency, auth) and the fact they belong to 2.0's accepted lineage — not from reading all 147 of them line-by-line.
- That 2.0's `SettingsPage.tsx` (516 L) is a functional superset of the branch's prefs page — inferred from size and the branch page's localStorage-only coupling; not diffed field-by-field for every preference.

**UNKNOWN / COULD NOT ASSESS:**
- **Runtime behaviour of either branch** — I did not build, typecheck, or run tests (read-only mandate; the working tree also has unrelated dirty `node_modules`/`tsbuildinfo` state that would confound results).
- **Raw pixel content of the two root PNGs** — identified only as 691×461 PNGs; not opened (binary). Almost certainly mockup screenshots; classified IGNORE on placement alone.
- **The full text of every V1 doc** — skimmed headings/intros for the several listed; a complete sentence-level reading was not performed. Verdicts are based on their explicitly obsolete four-lane/Next.js scope.
- **Whether any branch code was later forward-ported into 2.0 by another workstream** — the audit compares the two branch *tips* only; it does not reconstruct port history.
- **`apps/api/dist/**` and other compiled output on the branch** — treated as junk; not inspected for embedded source differences.

---

*End of harvest audit. No git mutations performed; single file written: `docs/2.0/HARVEST_AUDIT.md`.*
