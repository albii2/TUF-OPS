# Gate 0 Close-out — Commander reconciliation (T0.5)

**Rebuild Commander (W00)** · 2026-10-03 · branch `rebuild/2.0` @ `59372e12`
**Status:** Phase 0 COMPLETE. Gate 0 exit artifacts = the five audit docs + this reconciliation + `SCHEDULE.md`.
**Authority:** founder rulings R1-R3 (2026-09-30) and R4-R8 FINAL (2026-10-03). Binding record: plan §"FOUNDER RULINGS APPLIED - R4-R8 FINAL".

---

## 1. What landed in Phase 0 (T0.1-T0.7)

| Task | Deliverable | State |
|---|---|---|
| T0.1 | `rebuild/2.0` branch created from `feat/opportunity-lifecycle` (`59372e12`) | DONE |
| T0.2 | `docs/2.0/AUDIT_SUBSYSTEMS.md` (338 lines) | DONE |
| T0.3 | `docs/2.0/DEPENDENCY_GRAPH.md` (254 lines) | DONE |
| T0.4 | `docs/2.0/CLASSIFICATION.md` (215 lines, 81 subsystems) | DONE |
| T0.6 | `docs/2.0/UNIVERSE_VS_MARKETS.md` (256 lines) — **DECIDED: Option 2** | DONE |
| T0.7 | `docs/2.0/ACTIVATE_MARKET_SPEC.md` (267 lines) | DONE |
| T0.5 | this reconciliation + `docs/2.0/SCHEDULE.md` | DONE |

All audit work was read-only against code/git and against the live DB (PostgreSQL 18.6, Railway project `TUF Ops` WITH a space, env `production`, service `Postgres`), SELECT-only.

---

## 2. Reconciled findings (Commander)

The five audit docs are consistent with each other. Five findings **change the plan** and are now folded in:

1. **The stack is NOT what the plan assumed.**
   - Persistence = raw `pg` (node-postgres) `Pool` (`packages/database/src/db.ts`) + `node-pg-migrate`. **There is NO Prisma in the live stack** (`grep -rl prisma` in api/web/packages = empty).
   - The only `schema.prisma` is `apps/frontend/prisma/schema.prisma` — inside the **dead** Next.js second frontend.
   - Frontend = **Vite + React SPA** (`vercel.json framework=vite`, output `apps/web/dist`), **not** Next.js App Router.
   - **Effect:** all plan references to `prisma/schema.prisma` / `prisma migrate dev` are corrected to `packages/database/migrations/*.js` + `node-pg-migrate`.

2. **Migration ledger disagreement.** `packages/database/migrations/` holds **65 `.js` on disk**; the live DB reports **70 applied**. Cause UNKNOWN. **Reconcile before the first new migration** — a ledger that disagrees with the repo is how duplicate/skipped schema changes happen.

3. **`mockSalesData.ts` is the de-facto WEB TYPE SOURCE** (10,312 LOC; **27 type-only importers**), not just fixture data. Removing it directly breaks ~30 files. **Sequence:** repoint imports to `@tuf/shared` (T6.2) FIRST, then quarantine to `__fixtures__/`.

4. **A false-confidence test exists.** `apps/api/src/modules/data-integrity.test.ts:103` asserts an `orders` CHECK constraint that **does not exist**; it passes only because trigger `orders_closed_won_opportunity_trigger` fires. Fix or delete early — a 2.0 that adds real integrity will flip it.

5. **`apps/frontend/*` is dead** — absent from `vercel.json` and `railway.json`; `vercel.json.deprecated` present. Halves the maintenance surface; REMOVE.

Two carried-forward facts (already in the plan §0 and re-verified): the **seven `ON DELETE CASCADE` FKs on `opportunities`**, and **`db/schema.sql` is stale vs the live DB**.

---

## 3. FINAL classification (KEEP / MODIFY / REBUILD / REMOVE / DEFER)

`CLASSIFICATION.md` classified **81 subsystems**: KEEP 13 · MODIFY 24 · REBUILD 10 · REMOVE 14 · DEFER 20.
The Commander **accepts** that table, with these R4-R8 rulings applied as binding deltas:

| Ruling | Delta to the classification |
|---|---|
| **R4** in-place / same repo | Confirms the whole table's premise. `rebuild/2.0` branch is the build surface; `main` stays rollback. |
| **R5** second Railway service | **OVERRIDES** CLASSIFICATION §9 "Railway service ... 2.0 deploys from `rebuild/2.0` on the same service". 2.0 gets its **own** service + **clean seed**. The `railway.json` config is KEEP; the *deployment target* is a NEW service. |
| **R6** keep phone/PIN, rebuild authz | Confirms: auth mechanism KEEP; **role/permissions model MODIFY**; adds a **clean auth boundary** requirement (no auth coupling into Markets/LETTERED/ISSUE/tasks/revenue). |
| **R7** Academy DEFER not delete | Confirms §5/§6 rows: `academy.ts`, `achievements.ts`, `components/academy/*`, `public/training/`, `academy*`/`training` API modules = **DEFER** (preserved, unwired from main nav). |
| **R8** read-only Drops contract | Confirms §9 "Drops OS integration = REBUILD (new)". **Closes** DEPENDENCY_GRAPH §7.3: the field set is now fixed (plan §R8 FINAL). |

**Net class counts unchanged (81).** The only class-level movement is R5 turning the deploy *target* from "same service" to "new service" (a config/ops task, not a code class change).

### The three highest-leverage REMOVE/REBUILD calls (Commander priority)

1. **REMOVE `mockSalesData.ts` + `territoryMock.ts` + `generate_mock_data.py`** — but only after the type repoint. Single largest source of type errors (91 of 94 pre-existing) AND the fabricated-reporting residue the brief bans.
2. **REBUILD `packages/shared/src/types/organization.ts` `RevenueLane`** — the four-lane enum is the root of the obsolete model; replacing it turns into the three engines + `Markets`.
3. **REMOVE `apps/frontend/*`** (dead Next.js + its Prisma schema) — removes the second source of truth and the false Prisma signal.

---

## 4. FINAL architecture — Universe -> Activate Market -> Market

`UNIVERSE_VS_MARKETS.md` decided **Option 2** on live FK evidence, per the founder's ordered preference
(Option 1 only if technically clean):

```
MARKET UNIVERSE / INTELLIGENCE      organizations(288) + organization_sports(1088) + contacts(259)
   read-only. Importing a school creates ONLY an inert universe row.
   Inbound FKs allowed: contacts, organization_sports (intelligence only).
                 |
                 |  ACTIVATE MARKET    (the SOLE gateway)
                 |  requires: universe ref + owner + priority + objective
                 |            + next_action + next_action_due   (both NOT NULL)
                 |            + activated_at (provenance)
                 v
MARKETS                             NEW `markets` table  (market_number UNIQUE via PG sequence)
   Every 2.0 operational entity keys to markets.id -- NEVER organizations.id:
   RevenueOpportunity(TEAM_UNIFORMS|ISSUE) | LetteredDeployment | Task | Activity | Asset
   | Order/RevenueReference | ProductionReference | MarketMetric
```

- **Why Option 1 failed:** `organizations` carries **six live operational FKs** (`opportunities`, `orders`, `activities`, `activity_audit_history`, `creative_requests`, `executive_intake`) plus four transitive paths (`commissions`, `production_requests`, `opportunity_stage_history`, `order_items`). So an operational query *can* reach any universe row with no activation gate — a structural leak.
- **Separating invariant (CI-able):** every FK referencing `organizations` must have its child in `{contacts, organization_sports}`. Any other child = failure (query in `UNIVERSE_VS_MARKETS.md §6`).
- **Seed = three markets, three different stages:**
  `001 PILLAGER` (LETTERED LIVE) · `002 PEQUOT LAKES` (launch prep) · `003 BRAINERD` (front-of-funnel).
- **MN dataset is NOT promoted.** No bulk activation path in the MVP. A Market exists iff an activation row exists.
- **Governing principle (in spec + code comments):** *Knowing a school exists does not make it a Market. A Market represents an intentional allocation of TUF resources.*

The dependency graph (§3 of `DEPENDENCY_GRAPH.md`) and its six assertable invariants stand as the
build order: `canonical types -> migrations + seed -> api modules -> web IA/COMMAND/MARKETS -> Drops -> QA`.

---

## 5. Founder-level blockers

**None material.** R1-R8 are all settled and the architecture is decided; the remaining UNKNOWNs are
engineering (migration-ledger reconcile, `mockSalesData` repoint sequencing), not decisions only the
founder can make.

One **ops dependency** (not a founder decision, but it needs access that may be the founder's):
- **Provision the second Railway service** (R5) — a new service + its Postgres in the `TUF Ops` project,
  deploying from `rebuild/2.0`. This must exist before the Gate-1 candidate deploy. Everything else can
  be built before it lands.

One **cross-product dependency** (already handled by the ruling's wording):
- Drops OS must actually expose the R8 read fields "where available". Where an endpoint is absent, the
  `MarketMetric` cache stays empty and marked stale (T5.3) — it must never fabricate.

**Conclusion:** the condition in the founder directive — *"if no material founder-level blocker exists,
proceed directly into implementation"* — is **met**. Proceeding.

---

## 6. Next — implementation dispatch

Per the dependency graph, Wave 1 (no upstream code dependencies) is:

```
W01  Canonical types + state machines      packages/shared/src/{types,state-machines}/*   (root; Commander-gated)
W05  Drops contract spec (T5.1)            docs/2.0/DROPS_CONTRACT.md                    (doc-only; R8 field set fixed)
W07  False-confidence test fix (T7-pre)    apps/api/src/modules/data-integrity.test.ts   (isolated)
```

W01 blocks everything downstream (schema, seed, API, UI). Its outputs are Commander-gated shared files,
so W01 runs **alone** against `packages/shared` in Wave 1. W05 and W07 write disjoint paths and may run
concurrently with it.

Every implementation task ships with: **spec-compliance review, then code-quality review, before
Commander merge.**
