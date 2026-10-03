# TUF Ops 2.0 — Re-baselined Schedule (T0.5)

**Rebuild Commander (W00)** · 2026-10-03 · branch `rebuild/2.0` @ `59372e12`
**Supersedes:** the plan §3 "48h gates" block (which was pre-audit and pre-R4-R8).
**Rule applied:** state the revised number, do not assume. A wrong estimate found at hour 30 is worse
than one corrected at hour 3.

---

## 1. What changed the estimate vs the original 48h

| Change | Direction | Note |
|---|---|---|
| R1 — legacy transaction dropped from migration scope | **saves** | No backfill, no settlement flow, no preservation design. |
| R5 — clean seed on a NEW service | **saves + adds** | Saves migration complexity (no 1.0 data migration); adds service provisioning + a second deploy pipeline. Roughly neutral on code, +1 ops step. |
| R2/R3 — Option 2 (`markets` table) + ACTIVATE MARKET | **adds, small** | New table + one endpoint + one UI form + seed of 3 markets. Bounded. |
| R7 — Academy deferred (not deleted) | **saves** | But requires **unwiring Academy from primary nav** (a small edit to `config/roles.ts` + route table). |
| REMOVE `apps/frontend` (dead) | **saves** | Halves frontend maintenance surface. |
| **65 vs 70 migration reconcile** | **adds, blocking** | Must resolve before the first forward migration. |
| **`mockSalesData` type repoint before removal** | **adds, medium** | ~27 importers re-pointed to `@tuf/shared`; mechanical but wide. |
| **Shared-file serialization** (S1/S2/S3/S5/S6) | **the real constraint** | The 48h figure implied ~7 fully parallel agents. In reality `packages/shared`, the migration stream, `apps/api/src/index.ts`, and the nav config are single files — work touching them **serializes** through the Commander. |

**Net:** the *feature* scope is smaller than pre-audit (R1/R7 removals offset R2/R3 additions), but the
**integration is more serialized** than the original 48h assumed. Net ≈ **neutral on scope, worse on
parallelism** → the honest revision is longer and, more importantly, **gate-based rather than clock-based**.

---

## 2. Critical path (the thing that actually determines the date)

```
W01 canonical types + state machines          (packages/shared)     <- root, Commander-gated
   |
   +--> reconcile 65/70 migrations
   |
   +--> W01 forward migration (markets + entities)
   |        |
   |        +--> W06 seed: 3 markets (Pillager/Pequot/Brainerd) + universe separation
   |        |
   |        +--> W02 API entity modules  (mounted in apps/api/src/index.ts -- single file)
   |                 |
   |                 +--> W04 engines: RevenueOpportunity(TEAM_UNIFORMS|ISSUE) + LetteredDeployment
   |                 |
   |                 +--> W05 Drops read contract + MarketMetric cache   (contract spec can start NOW)
   |                 |
   |                 +--> W03 web IA + COMMAND + MARKETS   (nav config -- single file)
   |                          |
   +--------------------------+--> W07 QA: state-machine property tests, perms matrix, acceptance walk
```

**Longest chain:** W01 types -> migration -> W02 API -> W03 UI -> W07 QA. W05 (Drops) can begin
immediately (doc + contract) and only needs the schema for its cache table.

---

## 3. Re-baselined gates (each gate = a WORKING deploy on the 2.0 staging service, not a slide)

```
GATE 0   Phase 0 audit + reconciliation + this schedule                     [DONE 2026-10-03]
GATE 1   Foundation:  canonical types + migrations + 3-market seed + auth boundary
                      + COMMAND shell + MARKETS reads `markets` only        [Wave 1-2]
GATE 2   Revenue engines: RevenueOpportunity (TEAM_UNIFORMS|ISSUE) + LetteredDeployment
                      + ACTIVATE MARKET end-to-end + 3 markets at their real stages   [Wave 3]
GATE 3   Operate + integration: Orders/Production rewire, deterministic Task emission,
                      Drops read contract + MarketMetric, real COMMAND numbers   [Wave 4]
GATE 4   Acceptance: state-machine + permissions + fabricated-data-negative tests,
                      mockSalesData REMOVED, apps/frontend REMOVED, acceptance walk, prod cutover plan   [Wave 5]
```

## 4. Re-baselined estimate

- **Honest figure:** the original **48h** assumed ~7 collision-free parallel agents. With the shared-file
  choke points that assumption does not hold, so the re-baselined target is **~5 focused working blocks**
  (Waves 1-5) of Commander-serialized integration, **not** 48 wall-clock hours.
- **First external milestone:** a **Gate 2 candidate** — the three markets visible and operable on the
  2.0 staging service — is the earliest point worth showing the founder. Everything before it is internal.
- **Confidence:** MEDIUM. This is grounded in the audit (scope is known, blockers are named), but the
  true throughput number only exists once **Wave 1 lands** — so the Commander will tighten this figure
  after Wave 1, exactly as the plan's risk §3 requires.

## 5. Blocking dependencies to clear before their gate

| Before | Dependency | Owner |
|---|---|---|
| Gate 1 deploy | **second Railway service provisioned** (R5) — new service + Postgres in project `TUF Ops`, deploys from `rebuild/2.0` | Ops (founder access) |
| first new migration | **65 vs 70 migration ledger reconciled** | W01/W06 |
| `mockSalesData` removal | **type repoint to `@tuf/shared`** | W03/W06 |
| Gate 2 Drops metrics | **Drops OS exposes the R8 read fields** (where available) | W05 |

## 6. What is explicitly NOT in the MVP (deferred, per rulings — preserved, not deleted)

Academy/training content and UI (R7); territory map; earnings UI; recruiting/people/issues/comms/intake/
announcements modules; vendor module; `apps/frontend` is REMOVED not deferred. Drops two-way sync is
forbidden (R8, read-only).
