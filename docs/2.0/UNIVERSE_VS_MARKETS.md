# Universe vs. Markets — the hard domain separation

**Phase 0 · T0.6 · Status: DECIDED (Option 2)**
**Repo:** `TUF-OPS Repo` @ `feat/opportunity-lifecycle` (HEAD `59372e12`)
**Evidence:** live Railway project `TUF Ops` (with a space), env `production`, service `Postgres`,
PostgreSQL **18.6**, read-only session `2026-10-03 22:06:47+00`.
**Authority:** founder ruling **R2** (`2026-09-30`), verbatim:

> The Minnesota organization/school dataset (`organizations` 288, `organization_sports` 1,088,
> `contacts` 259) is **Market Intelligence Universe** — schools TUF *could* pursue. It is **not** the
> operational `Markets` table.
>
> **Hard domain separation — and NOT a frontend filter.** Explicitly: do not simply hide 285
> organizations in the UI. The distinction must exist **in the domain model** so that a future import
> cannot pollute active operations. A school being imported must be structurally incapable of appearing
> as a Market.

Governing principle (enforced here and in `ACTIVATE_MARKET_SPEC.md`):

> **Knowing a school exists does not make it a Market. A Market represents an intentional allocation of
> TUF resources.**

---

## 1. The two concepts

```
MARKET UNIVERSE / INTELLIGENCE   Known schools TUF could potentially pursue. Read-only reference
                                 data. An imported school row is, by itself, operationally inert.
MARKETS                          Schools where TUF has DELIBERATELY COMMITTED operational
                                 attention via an explicit ACTIVATE MARKET operation. This is the
                                 ONLY source the MARKETS interface reads.
```

The universe is *intelligence*. A Market is a *commitment*. The separation is a schema property, not a
`WHERE` clause, a `status` flag, or a UI filter.

---

## 2. Live evidence — the universe dataset (VERIFIED)

```sql
SELECT 'organizations' t, count(*) n FROM organizations
UNION ALL SELECT 'organization_sports', count(*) FROM organization_sports
UNION ALL SELECT 'contacts', count(*) FROM contacts;
```

| table | rows | note |
|---|---|---|
| `organizations` | **288** | school universe rows |
| `organization_sports` | **1,088** | org × sport cross-product bootstrap |
| `contacts` | **259** | people attached to universe schools |

`organizations.status` distribution (VERIFIED):

| status | count |
|---|---|
| active | **287** |
| inactive | 1 |

`organizations.tuf_priority` distribution (VERIFIED): `TIER_3` 124 · `TIER_2` 105 · `TIER_1` 43 · NULL/blank 16.

> **This is the trap.** `organizations.status` is `varchar NOT NULL DEFAULT 'active'` and defaults to
> `'active'` on insert; 287 of 288 imported rows are already `'active'`. It is a legacy/universe
> data-quality field, **not** an activation flag. See `ACTIVATE_MARKET_SPEC.md §7` — it must be
> superseded, never reused.

---

## 3. THE FK INVENTORY — every foreign key that references `organizations`

**VERIFIED** from `information_schema` FKs whose referenced table is `organizations`. This is the
authoritative interchangeability-risk surface. Query: `/tmp/t06_fk.sql` (reproduced in §8).

| # | child table | child column | constraint name | ON DELETE | ON UPDATE |
|---|---|---|---|---|---|
| 1 | `activities` | `organization_id` | `activities_organization_id_fkey` | **CASCADE** | NO ACTION |
| 2 | `activity_audit_history` | `organization_id` | `activity_audit_history_organization_id_fkey` | **CASCADE** | NO ACTION |
| 3 | `contacts` | `organization_id` | `contacts_organization_id_fkey` | **CASCADE** | NO ACTION |
| 4 | `creative_requests` | `organization_id` | `creative_requests_organization_id_fkey` | **SET NULL** | NO ACTION |
| 5 | `executive_intake` | `related_organization_id` | `executive_intake_related_organization_id_fkey` | NO ACTION | NO ACTION |
| 6 | `opportunities` | `organization_id` | `opportunities_organization_id_fkey` | **CASCADE** | NO ACTION |
| 7 | `orders` | `organization_id` | `orders_organization_id_fkey` | **CASCADE** | NO ACTION |
| 8 | `organization_sports` | `organization_id` | `organization_sports_organization_id_fkey` | **CASCADE** | NO ACTION |

**Outbound FKs from `organizations`: NONE (0 rows).** `assigned_rep_id`, `assigned_director_id` and
`territory_id` are bare integers with **no FK constraint** — there is no DB-level link from the
universe to `users` or territories. `organizations` has **only a PRIMARY KEY (id)** — no UNIQUE
natural key (name+state), so duplicate school rows are structurally possible.

### 3.1 Transitive reach paths into `organizations` (VERIFIED)

Several operational tables reach a universe row only *through* an FK chain:

| table | path into `organizations` | all links CASCADE? |
|---|---|---|
| `commissions` | `commissions.opportunity_id → opportunities.organization_id → organizations` | yes |
| `production_requests` | `production_requests.opportunity_id → opportunities.organization_id → organizations` | yes |
| `opportunity_stage_history` | `.opportunity_id → opportunities → organizations` | yes |
| `order_items` | `order_items.order_id → orders.organization_id → organizations` | yes |

Also VERIFIED: **all seven FKs referencing `opportunities(id)` are `ON DELETE CASCADE`** (`activities`,
`activity_audit_history`, `commissions`, `creative_requests`, `opportunity_stage_history`, `orders`,
`production_requests`) — consistent with the audit seed and the reason destructive SQL is banned.
`commissions` and `production_requests` have **no direct FK to `organizations`**.

---

## 4. Reachability analysis — can an operational query surface a universe row "as a Market"?

FKs 1–8 above split into two kinds:

**Intelligence/breadth FKs (universe dimensions — acceptable on a universe table):**
- `contacts.organization_id` — 259 rows, 259 distinct orgs.
- `organization_sports.organization_id` — 1,088 rows, 272 distinct orgs.

**Operational FKs (carry business/work state — these are the leak):**
- `opportunities.organization_id` — **4 distinct orgs** hold the 6 live opportunities.
- `orders.organization_id` — **1 org** holds the 1 live order.
- `activities.organization_id`, `activity_audit_history.organization_id` — touch log (0 rows today).
- `creative_requests.organization_id` — SET NULL (0 rows today).
- `executive_intake.related_organization_id` — NO ACTION (2 rows today, but `related_organization_id`
  is NULL in both, so 0 distinct orgs).

**Current-state proof of the anti-pattern (VERIFIED in code):**
- `apps/api/src/modules/organizations/organizations.service.ts:71-74` —
  `getOrganizations()` runs `SELECT * FROM organizations` with **no filter**; the live `/organizations`
  endpoint therefore returns all **288** universe rows.
- `apps/web/src/services/organizationsService.ts:23-70` — the UI *fabricates* operational fields
  (`coverageStatus: 'UNTOUCHED'`, `pipelineValue: 0`, a hard-coded `nextAction`, derived
  `priority` from `tuf_priority`) over those 288 rows. This is precisely the "frontend filter / fake
  operational surface" the founder forbids.

**Conclusion of the analysis:** If `organizations` is declared to *be* the universe table (Option 1),
then because operational entities (`opportunities`, `orders`, `activities`, `activity_audit_history`,
`creative_requests`, `executive_intake`, and transitively `commissions` / `production_requests` /
`order_items`) are `organization_id`-keyed, **an operational query can reach any universe row with no
activation gate**. Creating (importing) an organization row is sufficient for an operational record to
attach to it. That is a structural leak, and it fails the founder's criterion:

> "no operational query can reach a universe row by joining through `organizations`."

---

## 5. DECISION — Option 1 is NOT technically clean → **Option 2**

The founder's preferred order is (1) existing `organizations` = universe + new activation table, and
only if (1) is unclean, (2) another normalized structure with the same hard separation.

**Option 1 is unclean, on live evidence.** `organizations` carries **six live operational FKs**
(`opportunities`, `orders`, `activities`, `activity_audit_history`, `creative_requests`,
`executive_intake`) plus four transitive operational paths (`commissions`, `production_requests`,
`opportunity_stage_history`, `order_items`). The universe table is therefore the direct FK target of
the operational domain — activation is *not* the only path to an operational row, and the universe is
*nothing like* read-only. Option 1 fails all three "technically clean" criteria:

| criterion | Option 1 result |
|---|---|
| no operational query can reach a universe row via `organizations` | **FAIL** — `opportunities JOIN organizations` reaches it directly |
| activation is the only path | **FAIL** — any import creates an FK-addressable row |
| the universe is read-only intelligence | **FAIL** — 4 orgs already bear opportunities, 1 bears an order |

Making Option 1 clean would require removing/re-pointing every operational FK off `organizations` and
Keying operational entities to a new Market table — which *is* Option 2. So:

### Option 2 — chosen design

1. **`organizations` stays as the read-only MarketUniverseEntry** (the preserved MN dataset, 288 rows).
   It keeps only universe/breadth FKs (`contacts`, `organization_sports`). It is **never** renamed to
   `Market`, never promoted wholesale, and takes **no operational FK** from the 2.0 domain.
2. **New `markets` table — the single activation gate.** A `markets` row is created **only** by the
   ACTIVATE MARKET operation (see `ACTIVATE_MARKET_SPEC.md`). Columns include `market_number` (UNIQUE),
   `universe_organization_id` (FK → `organizations.id`, UNIQUE — a universe row may be activated at
   most once), `owner_id`, `priority`, `objective`, `next_action` **NOT NULL**, `next_action_due`
   **NOT NULL**, `state`, `activated_at` **NOT NULL**, plus the §2.2 common fields.
3. **All 2.0 operational entities key to `markets.id`, never `organizations.id`:**
   `RevenueOpportunity`, `LetteredDeployment`, `Task`, `Activity` (2.0), `Asset`, `Order/RevenueReference`
   (2.0), `MarketMetric`, `ProductionReference`. Operational rows descend from a deliberate Market.
4. **Legacy operational FKs on `organizations` are retired at cutover** — per ruling R1 the single
   legacy order+commission is *not* migrated, and 2.0's seed begins from a defined dataset; legacy
   operational rows are simply outside it. The `opportunities`/`orders`/`activities`/`creative_requests`/
   `executive_intake` FKs on `organizations` belong to the **obsolete 1.0 domain** and are not carried
   into the 2.0 operational model. No destructive SQL is used: exclusion is a seed/cutover decision.
5. **MARKETS reads `markets` only.** The universe is reachable as intelligence/reference (a lookup on
   `organizations`), never as the operational list. No bulk-activation path exists in the MVP.

### Why Option 2 is technically clean

- The only inbound FKs on `organizations` after cutover are intelligence dimensions (`contacts`,
  `organization_sports`) — no operational entity references it. Therefore **no operational query can
  reach a universe row**, because there is no operational FK edge into `organizations` at all.
- A Market exists if and only if an activation row exists. `markets` is the sole gateway.
- Universe rows are read-only: importing a school creates an inert `organizations` row and nothing else.

---

## 6. Acceptance test — "no operational query can reach a universe row as a Market"

Executable, schema-level, and CI-able (Gate-0→1 contract for W07 QA):

1. **No operational FK edge into the universe.** Assert that every FK whose referenced table is
   `organizations` has its child table in the intelligence allow-list
   (`{contacts, organization_sports}`). Any other child table is a failure. This is a direct assertion
   over `information_schema.referential_constraints` — the same inventory re-run as a test.
   ```sql
   -- Must return ZERO rows post-cutover:
   SELECT tc.table_name, kcu.column_name
   FROM information_schema.table_constraints tc
   JOIN information_schema.key_column_usage kcu
     ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
   JOIN information_schema.constraint_column_usage ccu
     ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
   WHERE tc.constraint_type='FOREIGN KEY' AND ccu.table_name='organizations'
     AND tc.table_name NOT IN ('contacts','organization_sports');
   ```
2. **MARKETS reads one table.** Assert the MARKETS list service issues no query touching
   `organizations` (static import/query test). The operational list is produced by `SELECT ... FROM markets`.
3. **Activation is the only creation path.** Assert no application code path inserts into `markets`
   except `activateMarket(...)` (grep/symbol test), and there is no bulk-activation endpoint.
4. **Universe inertness.** Create a universe-only `organizations` row (no activation) and assert it
   appears **nowhere** in any operational read model (MARKETS, SELL, COMMAND, OPERATE) — because no
   operational table can reference it.
5. **Launch count.** `SELECT count(*) FROM markets` returns exactly **3** after seed (MARKET 001
   PILLAGER, 002 PEQUOT LAKES, 003 BRAINERD); MAPS/KILLED semantics per plan §6 do not change this.

---

## 7. Evidence ledger

| Claim | Tag | Source |
|---|---|---|
| 8 FKs reference `organizations`; ON DELETE rules as tabled | **VERIFIED** | live `information_schema`, `/tmp/t06_fk.sql` |
| `organizations` has zero outbound FKs; only PK, no natural-key UNIQUE | **VERIFIED** | live `pg_constraint` on `organizations` |
| `organizations` 288 / `organization_sports` 1,088 / `contacts` 259 | **VERIFIED** | live counts, `/tmp/t06_counts.sql` |
| `status` = 287 `active` / 1 `inactive`; `tuf_priority` TIER distribution | **VERIFIED** | live counts |
| opportunities→4 orgs, orders→1 org, contacts→259, org_sports→272 | **VERIFIED** | live distinct counts |
| No `markets` table, no `market_number` column anywhere | **VERIFIED** | `information_schema.tables/columns` |
| 7 FKs on `opportunities` are CASCADE | **VERIFIED** | live `information_schema` |
| `/organizations` returns all 288 unfiltered; UI fabricates operational fields | **VERIFIED** | `apps/api/src/modules/organizations/organizations.service.ts:71-74`, `apps/web/src/services/organizationsService.ts:23-70` |
| Option 1 unclean / Option 2 required | **INFERENCE** | reasoned from the VERIFIED FK inventory above |
| Exact 2.0 FK set on `markets` and legacy-FK retirement mechanics | **UNKNOWN / TO-BE-DESIGNED** | W01 (schema) + W06 (cutover), Commander-gated |

---

## 8. Reproduction

```bash
cd ~/.gemini/antigravity/scratch/TUF-OPS
railway run --service Postgres -- bash -c \
  'PGOPTIONS="-c default_transaction_read_only=on" ON_ERROR_STOP=1 \
   psql "$DATABASE_PUBLIC_URL" -f /tmp/t06_fk.sql'
```

Cross-references: `docs/2.0/ACTIVATE_MARKET_SPEC.md` (T0.7), plan file
`.hermes/plans/2026-09-30_2030-tuf-ops-2.0-rebuild.md` §R2 / "Architecture deltas" (1, 2, 3, 6),
and the Gate-0 task change listed under T0.2/T0.6.
