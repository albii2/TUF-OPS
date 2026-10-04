# ADR-001 — Universe vs. Markets: why Option 2 over Option 1

**Status:** ACCEPTED (Gate 0 · T0.6) · **Date:** 2026-10-03 · **Decider:** founder R2, overridden by FK evidence
**Supersedes:** R2 option 1 (founder preference) · **Companions:** `UNIVERSE_VS_MARKETS.md`, `ACTIVATE_MARKET_SPEC.md`
**Governing principle:** *Knowing a school exists does not make it a Market. A Market represents an intentional allocation of TUF resources.*

## Context

R2 asked for the 288 MN schools to be the market **universe** behind a new activation layer, "if technically
clean." The criterion was exact: *no operational query can reach a universe row by joining through
`organizations`; activation is the only path; the universe is read-only intelligence.* Option 1 = keep
`organizations` as the universe and add a `markets` activation table beside it. Option 2 = the same hard
separation, but operational entities never key to `organizations` at all.

## Decision

**Option 1 is NOT technically clean. Chosen: Option 2.**

1. **What Option 2 is.** `organizations` is frozen as the read-only *MarketUniverseEntry* (288 rows). A new
   **`markets`** table is the single activation gate. Every 2.0 operational entity — `RevenueOpportunity`,
   `LetteredDeployment`, `Task`, `Activity`, `Asset`, `Order/RevenueReference`, `ProductionReference`,
   `MarketMetric` — keys to **`markets.id`, never `organizations.id`**. The only inbound FKs `organizations`
   may keep are the intelligence dimensions `contacts` and `organization_sports`.

2. **Why the FK topology made Option 1 unsafe (VERIFIED, live `information_schema`, re-run 2026-10-03).**
   `organizations` is the direct FK target of **six live operational child tables**, not just intelligence:

   | child | column | constraint | ON DELETE |
   |---|---|---|---|
   | `opportunities` | `organization_id` | `opportunities_organization_id_fkey` | CASCADE |
   | `orders` | `organization_id` | `orders_organization_id_fkey` | CASCADE |
   | `activities` | `organization_id` | `activities_organization_id_fkey` | CASCADE |
   | `activity_audit_history` | `organization_id` | `activity_audit_history_organization_id_fkey` | CASCADE |
   | `creative_requests` | `organization_id` | `creative_requests_organization_id_fkey` | SET NULL |
   | `executive_intake` | `related_organization_id` | `executive_intake_related_organization_id_fkey` | NO ACTION |

   Plus four **transitive** operational paths (`commissions`, `production_requests`, `opportunity_stage_history`,
   `order_items`), all reaching `organizations` through `opportunities.organization_id` / `orders.organization_id`
   with every link CASCADE. Under Option 1 the existence of an `organizations` row is itself sufficient for an
   operational record to attach to it — activation would not be the only path, and the universe would be nothing
   like read-only. This is what "unclean" means concretely, and it is why the phrase "Option 2" is not a
   preference call: making Option 1 clean requires re-pointing exactly these FKs onto `markets` — i.e. Option 2.

3. **What Option 1 would have contaminated.** Any operational read that joins through `organizations` reaches a
   universe row with no activation gate, e.g. `opportunities JOIN organizations ON organization_id` (4 orgs
   already carry all 6 live opportunities; 1 org carries the live order), and the current MARKETS list
   (`SELECT * FROM organizations`, no filter) returns all 288. Declaring `markets` "the only source" would then
   be false: the operational graph would still be keyed to the universe. The frontend already fakes the missing
   operational fields on those 288 rows — precisely the "hide it in the UI" anti-pattern R2 forbids.

4. **Authoritative tables under Option 2.** *Operational Markets:* `markets` only. *Intelligence universe:*
   `organizations` (+ `organization_sports`, `contacts`) — reference/lookup, never the operational list.
   *Activation:* the `markets` row itself, created solely by `activateMarket(...)`; no bulk path.

5. **Intelligence → activated Market.** One `organizations` row + one deliberate `activateMarket(input, actor)`
   call produces exactly one `markets` row, in the same transaction: `market_number` (`integer NOT NULL UNIQUE`,
   allocated from a PG sequence via `nextval`), `universe_organization_id` (`integer NOT NULL UNIQUE REFERENCES
   organizations(id)` — one activation per school), `owner_id` (`NOT NULL REFERENCES users(id)`), `priority`
   (enumerated), `objective` (`NOT NULL`), `next_action` (`text NOT NULL`), `next_action_due`
   (`timestamptz NOT NULL`), `state = IDENTIFIED`, `activated_at` (`timestamptz NOT NULL DEFAULT now()`).
   All six required fields are therefore set at activation, not inherited from the universe; `activated_at` is
   the immutable provenance of operational attention. Activation also materialises the initial `Task` from
   `next_action`/`next_action_due` and an append-only activation `Activity`.

6. **The 288 organizations.** They **survive intact as the universe** (288 rows; `organization_sports` 1,088;
   `contacts` 259 — all re-verified live). **Nothing is promoted, and no universe row migrates into `markets`.**
   Importing a school creates only an inert `organizations` row. The UNIQUE `universe_organization_id` guarantees
   a school becomes at most one Market, via activation. Launch holds exactly **three** markets (001 PILLAGER,
   002 PEQUOT LAKES, 003 BRAINERD); the remaining 285 never populate operational Markets. `organizations.status`
   and `tuf_priority` are universe metadata and are **not** reused as activation.

## Consequences

- **Justification (honest):** Option 2 is grounded in VERIFIED live FK evidence, independently re-run for this
  ADR — the override of the founder's preference is legitimate, not a phrase. Separating invariant is CI-able:
  every FK referencing `organizations` must have its child in `{contacts, organization_sports}`.
- **Cost — an extra join.** Every Market read that needs school name/location joins `markets → organizations`.
  Acceptable (one indexed FK hop, 3 markets at launch), but it is real and permanent.
- **Cost — duplication risk.** School attributes must live on `organizations`; market-specific fields on
  `markets`. Discipline is required so activation data is not copied back onto the universe row.
- **Cost — legacy-FK retirement.** The six operational FKs and four transitive paths on `organizations` are
  1.0-only and must be retired at cutover (seed/cutover decision, no destructive SQL). This is maintenance debt
  the Option-1 world would have deferred, not removed.
- **Cost — conceptual load.** Two similar-looking concepts (school vs market) that new contributors will
  conflate; mitigated only by keeping `markets` the sole operational key and the invariant test in CI.
- **UNKNOWN / TO-BE-DESIGNED:** the exact 2.0 FK set on `markets` and the legacy-FK retirement mechanics
  (W01 schema + W06 cutover, Commander-gated); the 65-on-disk / 70-applied migration-ledger mismatch must be
  reconciled before the first forward migration.

**VERIFIED here:** the 8 inbound FKs and their ON DELETE rules; zero outbound FKs from `organizations`; counts
288 / 1,088 / 259; 4 orgs→6 opportunities, 1 org→1 order; no `markets` table exists.
**INFERENCE:** Option 1 unclean / Option 2 required — reasoned from that FK inventory (the leak is structural,
not a matter of current row counts).
