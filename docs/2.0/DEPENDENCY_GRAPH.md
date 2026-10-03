# TUF Ops 2.0 — Canonical-Entity Dependency Graph (Phase 0 / T0.3)

**Status:** Draft for Gate 0 exit · **Task:** T0.3 · **Author:** Phase 0 audit subagent
**Repo:** `TUF-OPS Repo` @ `feat/opportunity-lifecycle` (`59372e12`) · **Live DB:** PostgreSQL 18.6 (66 tables, 70 migrations)
**Mandate:** read-only for code and git. This file is one of the two writes permitted to this subagent (T0.3); the other is `docs/2.0/AUDIT_SUBSYSTEMS.md` (T0.2).
**Companions:** `CLASSIFICATION.md` (T0.4), `UNIVERSE_VS_MARKETS.md` (T0.6), `ACTIVATE_MARKET_SPEC.md` (T0.7). Entity definitions are the plan §2.1 spine; this document maps *what each entity depends on* and *where workstreams will collide*.

---

## 0. Dependency-direction convention

`A → B` reads **"A depends on B"** (B must exist/land first; B is upstream of A). The graph is drawn so arrows point **toward the dependency**. Read it top-to-bottom as the build order.

Three dependency kinds are distinguished:

- **hard** — compile/run failure if the upstream is absent (e.g. a migration table, an imported type).
- **data** — a live-data or FK relationship (e.g. `orders.opportunity_id`).
- **soft** — a design/workflow coupling only (e.g. a state machine that *emits* a Task).

**Confidence** uses the standard tags (VERIFIED / INFERENCE / UNKNOWN). Existing tables/modules and FKs are **VERIFIED** from the live DB and repo; the *canonical* entities are **planned** (plan §2.1), so their edge directions are **INFERENCE** grounded in the existing infrastructure they will reuse.

---

## 1. The entity inventory and where each lands

| Canonical entity (plan §2.1) | Backing today (VERIFIED) | New/changed in 2.0 | Owner workstream |
|---|---|---|---|
| **MarketUniverseEntry** | `organizations` (288), `organization_sports` (1,088), `contacts` (259), `seed_leads_from_csv.js` (569 LOC) | read-only intelligence; never renamed to Market | W06 (data), W02 (read API) |
| **Market** | *(none — does not exist)* | **new `markets` table** + ACTIVATE MARKET gateway; `next_action`/`next_action_due` NOT NULL | W01 (schema), W02/W03 |
| **Relationship** | `contacts` (259) inside `organizations` module | promoted person↔market/institution link | W01, W02 |
| **Organization/Contact** | `organizations` + `contacts` tables; `organizations` module (542 LOC) | institution + people; split from universe identity | W01, W02 |
| **RevenueOpportunity** (TEAM_UNIFORMS·ISSUE) | `opportunities` (6), `opportunity_stage_history` (4); `opportunities` module (1,339 LOC); `packages/auth` STAGES | REBUILD: engine discriminator replaces 4-lane `channel_type` | W04, W01 |
| **LetteredDeployment** | *(none — does not exist)* | **new**; own lifecycle; replaces LETTERED/TEAM_STORE as an opportunity | W04, W05 |
| **Task** | `work_items` (0); `work-items` module (261 LOC, **unmounted/404**) | promoted deterministic next-action queue | W02/W04 |
| **Activity** | `activities` (0), `activity_audit_history` (0), `rep_activities` (0); `activities` module (636 LOC) | append-only touch log; carry forward | W02 |
| **Asset** | `creative_requests` (0); `creative-requests` module (93 LOC) | references to creative/marketing assets | W02 |
| **Order/RevenueReference** | `orders` (1), `order_items` (0); `orders` module (322 LOC) | keep; strip free-text `deal_type`; no legacy backfill (R1) | W02/W04 |
| **ProductionReference** | `production_requests` (0); `production-requests` module (279 LOC) | manufacturing handoff | W02 |
| **MarketMetric** | *(none — does not exist)* | **new**; cached Drops snapshot (R8), no line items | W05 |

---

## 2. Per-entity dependency directions

### 2.1 MarketUniverseEntry (intelligence)
```
MarketUniverseEntry → organizations table (288)            hard+data  VERIFIED
                    → organization_sports (1,088)           hard+data  VERIFIED
                    → contacts (259)                        hard+data  VERIFIED
                    → seed_leads_from_csv.js                data       VERIFIED
                    → packages/database (pg.Pool)           hard       VERIFIED
                    → (read-only) organizations module      hard       INFERENCE
```
**Depended on by:** `Market` (activation references a universe row), `Relationship` (people attach to universe institutions). **Never depended on by** `RevenueOpportunity` / `Order` / `LetteredDeployment` directly — that would re-leak (see T0.2 §5.3).

### 2.2 Market (activation)
```
Market → MarketUniverseEntry (universe_organization_id FK, UNIQUE)   hard  INFERENCE
       → users (owner: accountable person, existing table)           hard  VERIFIED (users live)
       → packages/shared/src/types/market.ts (new)                   hard  INFERENCE
       → new forward migration in packages/database/migrations/      hard  INFERENCE
       → apps/api/src/index.ts (route mount)                        hard  VERIFIED (pattern)
       → apps/web MARKETS surface + config/roles.ts (nav)            hard  INFERENCE
```
**Depended on by:** `RevenueOpportunity`, `LetteredDeployment`, `Relationship`, `Task`, `Activity`, `Asset`, `Order/RevenueReference`, `MarketMetric` — **Market is the root of the operational graph**. No Market exists without `owner` + `next_action` + `next_action_due` (plan §R3, ACTIVATE MARKET spec). **Market is never a rename of `organizations`.**

### 2.3 Relationship
```
Relationship → Organization/Contact (institution + people)   hard+data  INFERENCE
             → Market (the market/institution it attaches to) hard      INFERENCE
             → contacts table (existing seed of the entity)   data       VERIFIED
```
**Depended on by:** `Market` (owner/relationship surface), SELL surfaces. **Leak note:** `contacts.organization_id` → `organizations` is a **CASCADE** FK touching **259/288** universe orgs (T0.2 §5.1) — the Relationship surface is the highest-risk leak path; it must key off `Market`, not `organizations`.

### 2.4 Organization/Contact
```
Organization/Contact → organizations table + contacts table  hard+data  VERIFIED
                     → organizations module (542 LOC)         hard       VERIFIED
                     → packages/database (pg.Pool)            hard       VERIFIED
                     → packages/auth (roles/owner)            hard       VERIFIED
```
**Depended on by:** MarketUniverseEntry, Relationship. **Does not depend on** any operational entity (it must remain the universe/intelligence plane; operational FKs off `organizations` are to be retired at cutover — T0.2 §5.3).

### 2.5 RevenueOpportunity (TEAM_UNIFORMS | ISSUE)
```
RevenueOpportunity → Market (org/market it sells into)            hard+data  INFERENCE
                   → opportunities table (6) + opportunity_stage_history (4)  hard  VERIFIED
                   → opportunities module (1,339 LOC)              hard       VERIFIED
                   → packages/auth STAGES/normalizeStage           hard       VERIFIED
                   → packages/shared/src/types/opportunity.ts       hard      INFERENCE (rebuild)
                   → new state machine (team-uniforms, issue)       hard      INFERENCE
```
**Depended on by:** `Order/RevenueReference` (`orders.opportunity_id`, UNIQUE), `ProductionReference`, `Activity`, `Asset`, `Task`. **Blocks:** SELL engine, migration (R2/R3). **Must not** absorb LETTERED — the `UNIQUE(org,sport,season,year,channel_type)` collision (org 430, opps 1305+1306) is exactly what putting the discriminator in the key fixes.

### 2.6 LetteredDeployment
```
LetteredDeployment → Market                                  hard      INFERENCE
                   → Drops OS read contract (R8, does not exist)  hard    INFERENCE
                   → MarketMetric (its metrics)                 soft      INFERENCE
                   → packages/shared/src/types/lettered-deployment.ts (new) hard INFERENCE
```
**Depended on by:** `MarketMetric`. **Depends on NOTHING in the existing lane model** — it is a separate lifecycle and does **not** use `opportunities` channel_type. It stores `dropsOrganizationId` + `dropsCollectionId` + `storefrontUrl` and pushes nothing back.

### 2.7 Task
```
Task → the *state machines* of Market / RevenueOpportunity / LetteredDeployment  soft  INFERENCE
     → work_items table (0) + work-items module (261 LOC)  hard       VERIFIED
     → packages/database (pg.Pool)                          hard       VERIFIED
     → packages/shared/src/types/task.ts (new)              hard       INFERENCE
```
**Depended on by:** COMMAND. **Soft cycle (by design):** a state transition *emits* a Task, and a Task *references* the entity it acts on. Realize the entity reference as a **soft/polymorphic reference** (`linked_entity_type` + `linked_entity_id`, as `work_items` already does) — **not** a hard FK, or the schema gains a cycle (see §4).

### 2.8 Activity
```
Activity → opportunities (opportunity_id, CASCADE) + organizations (organization_id, CASCADE)  data VERIFIED
         → activity_audit_history, rep_activities      data      VERIFIED
         → activities module (636 LOC)                 hard      VERIFIED
```
**Depended on by:** COMMAND, Market/opportunity timelines. **FK caution:** both inbound FKs are `ON DELETE CASCADE` — deleting an opportunity deletes its Activity silently (R1 destructive-SQL ban).

### 2.9 Asset
```
Asset → creative_requests table (0) + creative-requests module (93 LOC)  hard  VERIFIED
      → RevenueOpportunity / Order (the work it serves)                  soft   INFERENCE
```

### 2.10 Order/RevenueReference
```
Order/RevenueReference → RevenueOpportunity (opportunity_id, UNIQUE, CASCADE)  hard+data  VERIFIED
                       → orders (1) + order_items (0) + orders_raw          hard       VERIFIED
                       → orders module (322 LOC)                            hard       VERIFIED
                       → trigger orders_closed_won_opportunity_trigger      hard       VERIFIED
```
**Depended on by:** `ProductionReference`, `Activity`. **R1:** the legacy row (order id 2 / commission id 1, $1,750 GP) is **not migrated**; no backfill. `deal_type` has no CHECK/FK/UNIQUE (free text) — tighten in 2.0.

### 2.11 ProductionReference
```
ProductionReference → Order/RevenueReference + RevenueOpportunity   hard+data  VERIFIED
                    → production_requests table (0)                 hard       VERIFIED
                    → production-requests module (279 LOC)           hard       VERIFIED
```

### 2.12 MarketMetric
```
MarketMetric → LetteredDeployment (keyed by dropsOrganizationId/dropsCollectionId)  hard  INFERENCE
             → Drops read contract (R8)                               hard       INFERENCE
             → (nothing else) — stores NO line items                  —          INFERENCE
```
**Depended on by:** LETTERED COMMAND numbers only. Never a source of consumer order/product duplication.

---

## 3. Whole-graph view (arrow = "depends on")

```
                          ┌──────────────────────────┐
                          │  MarketUniverseEntry     │  (organizations 288,
                          │  (read-only intelligence)│   organization_sports 1088,
                          └────────────┬─────────────┘   contacts 259)
                                       │ activation (universe_organization_id, UNIQUE)
                                       ▼
   ┌──────────────────────────────►  Market  ◄───────────────────────────────┐
   │                                (new table, root)                          │
   │                                    │         │                            │
   │            ┌───────────────────────┤         └───────────────┐            │
   │            ▼                       ▼                         ▼            │
   │   Organization/Contact      RevenueOpportunity        LetteredDeployment   │
   │        ▲                    (TEAM_UNIFORMS│ISSUE)      (own lifecycle)     │
   │        │                            │                        │            │
   │   Relationship                      ├──► Order/RevenueReference ──► ProductionReference
   │        ▲                            │           │
   │        └──────────── Market ────────┘           ▼
   │                                             Activity ──► Asset
   │                                                 ▲
   │                                                 │ soft (emits / references)
   └──────────────────────────────► Task ◄───────────┘
                                       ▲
                          (all state machines emit Tasks)

   MarketMetric ◄── LetteredDeployment ◄── Drops read contract (R8)
```

Dependency spine (build order, matches CLASSIFICATION §10):
`R1/R2/R3 schema decision → packages/shared canonical types → new migrations + seed_markets_2_0 → apps/api entity modules (mounted in index.ts) → apps/web IA + COMMAND/MARKETS → Drops read contract → QA`.

---

## 4. Cycles (explicit)

There is **no cycle in the persistence layer today** (the FK graph is a tree: `organizations` is a leaf-target hub; `opportunities` is the operational hub). Two **semantic** cycles are introduced by the 2.0 entity set and must be broken at design time:

| # | Cycle | Why it appears | Break it how | Conf |
|---|---|---|---|---|
| C1 | **RevenueOpportunity ⇄ Order/RevenueReference** | `orders.opportunity_id` → `opportunities` (FK, CASCADE) *and* the win transition on an opportunity creates an order; the DB trigger reads the opportunity's status back. Bidirectional semantic coupling around the WON state. | Keep the **FK direction** one-way (`orders → opportunities`); drive order creation from the state-machine guard, not a second FK. Do **not** add `opportunities.order_id`. | VERIFIED (existing FK + trigger) |
| C2 | **Every entity ⇄ Task** | Each state transition *creates* a Task; a Task *references* the entity that spawned it. A hard FK both ways is a schema cycle. | Model the Task→entity link as a **soft polymorphic reference** (`linked_entity_type`/`linked_entity_id`), exactly as the existing `work_items` table does. No FK from `tasks` into every entity table. | INFERENCE (design) |
| C3 | **Activity ⇄ its parents (star, not a true cycle)** | `activities` has FKs to **both** `opportunities` and `organizations` (both CASCADE). An opportunity already belongs to an organization, so Activity sits at a diamond. | Not a cycle, but a **deletion amplifier**: dropping a market/opportunity cascades through the diamond. Enforce the no-destructive-SQL rule; consider `SET NULL`/restrict in 2.0 for audit-preserving children. | VERIFIED (live FKs) |

---

## 5. Shared-file choke points (where workstreams will collide)

These are the files every entity workstream must touch or read. The plan (W00 rule) makes them **Commander-gated**: no two agents modify one concurrently.

| # | Choke point | Path | Who collides | Why | Conf |
|---|---|---|---|---|---|
| S1 | **Shared type barrel** | `packages/shared/src/index.ts` + `packages/shared/src/types/*` | W01 (author), W03/W04 (consumers) | Every canonical type is re-exported through one barrel; `organization.ts` holds the obsolete `RevenueLane` enum (line 3) that W01 rebuilds. | VERIFIED (12 web files import it) |
| S2 | **Migration stream** | `packages/database/migrations/*.js` (65 on disk / 70 applied) | W01 (schema), W06 (seed) | One ordered forward-only stream; two branches adding migrations collide on ordering and on `pgmigrations`. Must reconcile the 65/70 mismatch before the first new migration. | VERIFIED |
| S3 | **API entrypoint** | `apps/api/src/index.ts` (287 LOC) | W02, W04, W05 | The **only** `server.register` point; every new entity module must be mounted here. Also hosts the boot DDL + admin-PIN reset to refactor. | VERIFIED |
| S4 | **DB client** | `packages/database/src/db.ts` (14 LOC, `pg.Pool`) | W01, W02, W04, W05, W06 | Imported by ~28 service files; a connection-string/type change ripples everywhere. | VERIFIED |
| S5 | **Nav + role visibility** | `apps/web/src/config/roles.ts` (`roleConfig.visiblePages`), `apps/web/src/App.tsx` (route table), `components/AppShell.tsx` | W03, W04, W06 | The whole nav IA lives in one `roleConfig` object + one route table; COMMAND/MARKETS/SELL all edit them. | VERIFIED |
| S6 | **Web type source (duplicated)** | `apps/web/src/data/mockSalesData.ts` (10,312 LOC; 27 type-only importers) | W03, W04, W06 | Currently the de-facto web type source; must be re-pointed at `@tuf/shared` (T6.2) before quarantine or ~30 files break. | VERIFIED |
| S7 | **Web data layer (duplicated)** | `apps/web/src/api/*` (TanStack) **and** `apps/web/src/services/*` (direct) | W02, W03 | Two parallel client layers hit the same REST API; new entity fetchers must pick one or the collision is silent. | VERIFIED |
| S8 | **False-confidence test** | `apps/api/src/modules/data-integrity.test.ts:103` | W07 | Asserts a CHECK that does not exist; a rebuild that adds real integrity will flip it. Fix/delete early. | VERIFIED |
| S9 | **Drops contract boundary** | *(new)* `docs/2.0/DROPS_CONTRACT.md` + `apps/api/src/modules/integration/drops.*` | W05, W04 | `LetteredDeployment` and `MarketMetric` both depend on the exact fields crossing; contract must be frozen before either. | INFERENCE |

### 5.1 Cross-workstream collision matrix

| | W01 Arch | W02 API | W03 UI | W04 Engines | W05 Drops | W06 Seed | W07 QA |
|---|---|---|---|---|---|---|---|
| **W01** | — | S2,S3,S4 | S1,S5 | S1 | S3 | S2,S4 | S8 |
| **W02** | S2,S3,S4 | — | S7 | S3 | S9 | S2,S4 | S8 |
| **W03** | S1,S5 | S7 | — | S5,S6 | S7 | S5,S6 | — |
| **W04** | S1 | S3 | S5,S6 | — | S9 | S2 | S8 |
| **W05** | S3 | S9 | S7 | S9 | — | — | — |
| **W06** | S2,S4 | S2,S4 | S5,S6 | S2 | — | — | S8 |
| **W07** | S8 | S8 | — | S8 | — | S8 | — |

*(Shared-file IDs as in §5. The densest collision zone is `S1 packages/shared` × `S2 migrations` × `S3 api entrypoint` — the three files the plan names Commander-gated.)*

---

## 6. Invariants the graph implies (assertable in tests)

1. **`packages/shared` has no runtime dependencies** (`dependencies: {}` today, VERIFIED) — it is pure types; every entity's type must stay importable by web *and* api without pulling DB/runtime code.
2. **`packages/database` (pg.Pool) is the single data edge** — no module imports a second client (there is no Prisma; VERIFIED).
3. **`apps/api/src/index.ts` is the single mount point** — a module that is not registered here is unreachable (8 such modules exist today; T0.2 §2.2).
4. **No operational FK may target `organizations`** after cutover except `{contacts, organization_sports}` (T0.2 §5.3, UNIVERSE_VS_MARKETS §6) — this is the R2 separation invariant expressed as a graph constraint.
5. **`Order/RevenueReference` depends one-way on `RevenueOpportunity`** — no reverse FK (breaks C1).
6. **`Task` links softly, never by FK, to every entity** (breaks C2).

---

## 7. What could not be determined (UNKNOWN)

1. **Exact 2.0 FK set on `markets`** and the legacy-FK retirement mechanics — design work for W01 (schema) + W06 (cutover); Commander-gated. `UNIVERSE_VS_MARKETS.md` fixes the *direction* (Option 2) but not the final columns.
2. **Whether `Market` and `Organization/Contact` stay one table or split** (a `markets` row pointing at a universe `organizations` row vs a promoted org record) — the graph above assumes the **Option-2 split** (separate `markets` table) per T0.6; if W01 chooses a third normalized shape, §2.2/§2.4 edges shift but directions hold.
3. **The Drops contract field list** (S9) is not yet written (W05 T5.1) — `LetteredDeployment`/`MarketMetric` edges to it are directionally certain, field-level unknown.
4. **Task's exact state-machine emission table** — plan §2.5 marks it deterministic/TBD; the entity→Task soft edges are directional only.

---

## 8. Method

Dependency directions were derived from: live FK inventory (`pg_constraint`, `information_schema`), route registration (`grep server.register apps/api/src/index.ts`), import graphs (`grep -rl` per package), and the plan §2.1 entity set. Planned entities' edges are marked INFERENCE; existing tables, FKs, modules and mounts are VERIFIED. Read-only throughout; no schema/migration/config modified.
