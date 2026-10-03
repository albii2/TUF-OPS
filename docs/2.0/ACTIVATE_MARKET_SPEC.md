# ACTIVATE MARKET — product & operation specification

**Phase 0 · T0.7 · Status: SPEC (implementation Commander-gated)**
**Repo:** `TUF-OPS Repo` @ `feat/opportunity-lifecycle` (HEAD `59372e12`)
**Evidence:** live Railway project `TUF Ops` (with a space), env `production`, service `Postgres`,
PostgreSQL **18.6**, read-only session `2026-10-03 22:06:47+00`.
**Authority:** founder ruling **R3** (`2026-09-30`). Companion doc: `docs/2.0/UNIVERSE_VS_MARKETS.md` (T0.6).

> **Governing principle — quote this in the spec and in the code comments:**
> **Knowing a school exists does not make it a Market. A Market represents an intentional allocation of
> TUF resources.**

---

## 1. Purpose

Additional schools enter **MARKETS only through an explicit ACTIVATE MARKET operation.** Activation is
the single gateway. It is what makes **"NO MARKET SITS WAITING"** enforceable, because a Market cannot
exist without an owner and a next action. There is **no bulk-activation path in the MVP** (plan
§"Architecture deltas" #2).

---

## 2. The operation contract

`activateMarket(input, actor)` creates exactly one `markets` row and its immediate obligations.

### 2.1 Required fields (all required; none may be null)

| field | type | source | notes |
|---|---|---|---|
| `market_number` | `integer` (UNIQUE) | **assigned by the system** | `001, 002, 003 …`; zero-padded for display only. See §5. |
| `universe_organization_id` | `integer` FK → `organizations.id` | caller | the school/universe row this market was activated from. UNIQUE — one activation per school. |
| `owner_id` | `integer` FK → `users.id` | caller | the accountable person. |
| `priority` | ordinal / tier | caller | activation priority (e.g. `TIER_1 \| TIER_2 \| TIER_3` or an integer rank). Enumerated — no free text. |
| `objective` | `text` | caller | what TUF intends to achieve with this market. |
| `next_action` | `text` — **NOT NULL at schema level** | caller | the immediate next move. |
| `next_action_due` | `timestamptz` — **NOT NULL at schema level** | caller | when the next action is due. |
| `activated_at` | `timestamptz` **NOT NULL**, server-assigned | ledger | timestamp of deliberate commitment. Provenance of operational attention. |

System-assigned on create (not caller-supplied): `id`, `created_by` (= actor), `updated_by`,
`created_at`, `updated_at`, `state` (§6).

### 2.2 Signature (illustrative typed contract)

```ts
type ActivateMarketInput = {
  universeOrganizationId: number;   // required, must exist in organizations
  ownerId: number;                  // required, must exist in users
  priority: MarketPriority;         // required enum
  objective: string;                // required, non-empty
  nextAction: string;               // required, non-empty  -> NOT NULL at schema
  nextActionDue: string;            // required ISO timestamp -> NOT NULL at schema
  // marketNumber is NOT accepted from the caller — the system allocates it
};
// returns the created Market (state = IDENTIFIED)
```

---

## 3. Validation rules

All checks run before the insert, inside the activation transaction. Each failure returns a stable,
machine-readable reason (not a raw Postgres error).

| # | rule | trigger example | rejection reason |
|---|---|---|---|
| V1 | `owner` present and resolves to a live `users` row | missing / unknown owner | `MISSING_OWNER` |
| V2 | `objective` present, non-empty after trim | blank objective | `MISSING_OBJECTIVE` |
| V3 | `next_action` present, non-empty | blank / omitted | `MISSING_NEXT_ACTION` |
| V4 | `next_action_due` present, valid timestamp | blank / omitted / malformed | `MISSING_NEXT_ACTION_DUE` |
| V5 | `next_action_due` not contradicted (see §3.1) | due before activation by > tolerance | `NEXT_ACTION_DUE_IN_PAST` (soft — see below) |
| V6 | `priority` within the enumerated set | unknown tier | `INVALID_PRIORITY` |
| V7 | `universe_organization_id` exists in `organizations` | bad id | `UNKNOWN_UNIVERSE_REFERENCE` |
| V8 | `market_number` unique | sequence collision / manual clobber | `DUPLICATE_MARKET_NUMBER` |
| V9 | school not already activated | `universe_organization_id` already in `markets` | `SCHOOL_ALREADY_ACTIVATED` |
| V10 | actor is authorised to activate | rep attempting activation without rights | `NOT_AUTHORISED` (R6 role model, Commander-gated) |

### 3.1 On `next_action_due` in the past

`next_action_due` is **NOT NULL** but may legitimately be *now* or slightly past at the moment of a
back-dated seed (e.g. MARKET 001 PILLAGER, already `LETTERED LIVE`). Therefore V5 is **soft** (warn)
and is **not** a hard block for seeded/commissioned markets. It is a hard block only for the interactive
UI form. This keeps the "NO MARKET SITS WAITING" invariant (a value is always present) without making a
past-due next action unrepresentable.

### 3.2 Database-level enforcement (defence in depth)

The app validations are backstopped by schema constraints so no code path can bypass them:

- `markets.next_action text NOT NULL`
- `markets.next_action_due timestamptz NOT NULL`
- `markets.owner_id integer NOT NULL REFERENCES users(id)`
- `markets.objective text NOT NULL`
- `markets.activated_at timestamptz NOT NULL DEFAULT now()`
- `markets.market_number integer NOT NULL UNIQUE`
- `markets.universe_organization_id integer NOT NULL UNIQUE REFERENCES organizations(id)`
- `markets.priority` constrained (CHECK or enum type) to the allowed set
- `markets.state` constrained to the Market Lifecycle enum

The two `UNIQUE` constraints make V8 and V9 impossible to violate even under a race, and the two
`NOT NULL`s make "a market without a next move" unrepresentable.

---

## 4. Duplicate `market_number` — precise semantics

Two distinct failure modes share the `DUPLICATE_MARKET_NUMBER` reason:

1. **Allocation race** — two activations compute the same next number. Prevented structurally (§5). If
   it still occurs, the `UNIQUE (market_number)` constraint raises SQLSTATE `23505`; the service maps it
   to `DUPLICATE_MARKET_NUMBER` and the losing transaction retries allocation once.
2. **Manual reuse** — any attempt to set a previously-used number is rejected by the same UNIQUE
   constraint. **Numbers are never reused, even after a market is KILLED** (a KILLED market remains
   queryable, per plan §6). Gaps are acceptable; duplicates are not.

---

## 5. `market_number` allocation — safe under concurrency

`market_number` is sequence-like: `001, 002, 003, …`, monotonic, never reused. Three options, ordered
by preference:

### Option A (RECOMMENDED) — a dedicated PostgreSQL SEQUENCE

```sql
CREATE SEQUENCE market_number_seq START WITH 1 INCREMENT BY 1 NO MAXVALUE;
-- markets.market_number integer NOT NULL DEFAULT nextval('market_number_seq') UNIQUE
```

- Postgres sequences are **concurrency-safe by construction** — two concurrent activations can never
  receive the same value; no table lock, no application-level coordination.
- Values are drawn **outside** transaction rollback semantics: a rolled-back activation consumes its
  number, leaving a **gap**. This is the correct trade-off — gaps are harmless, duplicates are fatal —
  and matches "never reuse."
- Display layer zero-pads (`to_char(market_number, 'FM000')` → `001`); storage stays `integer` so
  ordering is numeric, not lexical.
- Seed alignment: MARKET 001/002/003 (PILLAGER/PEQUOT LAKES/BRAINERD) are inserted explicitly with
  `1/2/3` and the sequence advanced past them (`SELECT setval('market_number_seq', 3, true)`).

### Option B (fallback) — `MAX()+1` under lock

```sql
BEGIN;
SELECT COALESCE(MAX(market_number),0)+1 FROM markets FOR UPDATE;  -- lock the table/serializes
INSERT INTO markets (market_number, ...) VALUES (<next>, ...);
COMMIT;
```

- Correct but **serialises activations** and requires taking a lock on `markets` each time. Acceptable
  at MVP volume (three markets), inferior to a sequence. Use only if a sequence is unacceptable.

### Option C (rejected) — read-then-write without a lock

`SELECT MAX(market_number)+1` then `INSERT` in separate statements is a **race**: two concurrent
activations read the same `MAX`. Rejected. The `UNIQUE` constraint would catch it, but only as a
retry-after-failure, never as the primary mechanism.

Regardless of option, **allocation and insert are one atomic step** (same transaction) and the
`UNIQUE (market_number)` constraint is the backstop.

---

## 6. State the Market enters on activation

Activation creates the Market in the **entry state of the Market Lifecycle**:

```
Market Lifecycle (plan §2.3):
  IDENTIFIED → QUALIFIED → DEVELOPMENT → LAUNCH_READY → PENETRATION → ACTIVE
             → EXPANSION → MATURE            (+ BLOCKED, PAUSED, KILLED)
```

- `state = IDENTIFIED` on activation (the lifecycle entry state). Activation is the deliberate
  commitment that *creates* the object; subsequent `next_action`s drive it forward.
- `activated_at = now()` (server time) is the immutable provenance of that commitment; every Market
  traces to a deliberate activation (plan delta #2).
- The seeded three launch markets are inserted directly at their assigned stages (PILLAGER
  `LETTERED LIVE` → its LETTERED deployment lives post-launch; PEQUOT LAKES launch-prep; BRAINERD
  front-of-funnel) — the **Market-level `state`** is set consistently with that per W06 seed, but the
  *activation operation itself* always produces `IDENTIFIED` unless a Commander-gated seed path sets a
  specific stage. No user-facing bulk or stage-skipping path exists in the MVP.

---

## 7. What activation creates — and what it deliberately does NOT

### 7.1 Created / required alongside the `markets` row (same transaction)

1. **The `markets` row** with all §2.1 fields; `state = IDENTIFIED`, `activated_at = now()`.
2. **A provenance link** to the universe: `universe_organization_id` → the exact `organizations` row
   the market was activated from. This is the auditable "activated from" pointer and the UNIQUE guard
   against double activation (V9).
3. **The initial Task** — deterministic automation (plan §2.5): the `next_action` / `next_action_due`
   are materialised as a Task so the commitment is actionable, not just recorded. State transitions
   create the queue; activation is a transition.
4. **An append-only Activity / audit entry** recording the activation event (`source = 'ACTIVATION'`,
   actor, `activated_at`) so the deliberate commitment is logged. (`audit_logs` / `activities` pattern.)

### 7.2 NOT created by activation

- **No `LetteredDeployment`, no `RevenueOpportunity`, no TEAM UNIFORMS / ISSUE rows.** Once activated, a
  Market **may** *contain* LETTERED deployments and/or TEAM UNIFORMS and ISSUE revenue opportunities —
  they are created by their own lifecycles afterward, nested under the Market. Activation is the
  gateway, not a bulk-content generator. (R3: "Once activated, a Market may contain…")
- No import, no bulk rows, no backfill — activation is one school, deliberately.

---

## 8. Existing activation-like artifacts — reuse or supersede?

Checked live (`information_schema`) and in code. **Nothing can be reused as activation; all candidates
must be superseded.**

| candidate | live evidence | verdict |
|---|---|---|
| `organizations.status` (`varchar NOT NULL DEFAULT 'active'`) | 287 `active` / 1 `inactive` — set on import for the whole dataset | **SUPERSEDE.** It is a universe data-quality field, not an activation flag. Reusing it would mark all 287 imported rows as "activated," exactly the failure R2 forbids. Keep it only as a universe record active/inactive marker. |
| `organizations.tuf_priority` (`varchar`, `TIER_1/2/3`, null in 16) | 43/105/124 across tiers | **SUPERSEDE (as Market priority).** It is *lead-tier intelligence* about a universe school; it MAY inform a human's choice of `markets.priority`, but it is NOT an activation and NOT authoritative for a Market. Do not alias it to `markets.priority`. |
| `organizations.state_market` (`varchar`, `MN` ×272) | geography attribute | **NOT an activation concept** — a data attribute. Irrelevant to activation. |
| `organizations.launch_cluster` (`text`) | present in schema, no activation semantics found | **NOT an activation concept** (UNKNOWN whether populated; treat as intelligence metadata). |
| `opportunities.next_action` (`text`, nullable) | 6 rows, all pre-2.0 | **SUPERSEDE.** Legacy opportunity field; the 2.0 invariant is NOT NULL on Market/RevenueOpportunity, and legacy opps are not migrated (R1). |
| `executive_intake.owner` / `executive_intake.next_action` (`text`, nullable) | 2 rows, `related_organization_id` NULL in both | **NOT reusable** — intake staging only, no live org link. |
| `markets` table / `market_number` column | **do not exist anywhere** (verified: `information_schema`) | **CREATE NEW.** |
| `is_active` flags on academy/email tables | academy + email only | **NOT relevant** to markets. |

**Conclusion:** there is **no existing org flag, status, or priority column that constitutes
activation.** `organizations.status` and `tuf_priority` are universe metadata and must be addressed by
the explicit `markets` columns; `markets.activated_at` is the sole provenance of operational attention.
Implementation must not "reuse a flag" — it must create the activation table (Option 2, per
`UNIVERSE_VS_MARKETS.md §5`).

---

## 9. Acceptance tests

1. **Required-field invariant** — activating with any of missing owner / objective / next_action /
   next_action_due is rejected with the matching reason (V1–V4), and a direct `INSERT` omitting
   `next_action` or `next_action_due` fails at the DB with `23502` (NOT NULL proof, plan T1.6).
2. **Duplicate number** — forcing a repeated `market_number` (or racing two allocations) yields
   `DUPLICATE_MARKET_NUMBER`; `UNIQUE` is the backstop.
3. **Already activated** — activating the same `universe_organization_id` twice yields
   `SCHOOL_ALREADY_ACTIVATED` (UNIQUE on the universe ref).
4. **Concurrency** — N parallel activations produce N distinct `market_number`s with no duplicates
   (sequence proof).
5. **Gateway** — no code path inserts into `markets` except `activateMarket` (symbol/grep test); no
   bulk endpoint exists.
6. **State** — a freshly activated Market is `IDENTIFIED` with `activated_at` set and exactly one
   initial Task materialised from `next_action`/`next_action_due`.
7. **Launch integrity** — after W06 seed, `SELECT count(*) FROM markets` = 3; numbers `001/002/003`
   map to PILLAGER / PEQUOT LAKES / BRAINERD and no universe row beyond those three is a Market.

---

## 10. Evidence ledger

| Claim | Tag | Source |
|---|---|---|
| `organizations.status` = 287 active / 1 inactive; `tuf_priority` TIER distribution | **VERIFIED** | live counts, `/tmp/t06_counts.sql` |
| No `markets` table; no `market_number` column in any public table | **VERIFIED** | live `information_schema.tables/columns` |
| `organizations` has only PK, no UNIQUE natural key; zero outbound FKs | **VERIFIED** | live `pg_constraint` |
| 8 inbound FKs on `organizations` (operational set) | **VERIFIED** | live `information_schema`, `/tmp/t06_fk.sql` |
| `executive_intake.related_organization_id` NULL in both live rows | **VERIFIED** | live distinct count = 0 |
| Next-action fields existed before but nullable (`opportunities.next_action`) | **VERIFIED** | live `information_schema.columns` |
| NOT NULL / UNIQUE / sequence design, reason codes, state = IDENTIFIED | **INFERENCE / TO-BE-DESIGNED** | this spec; schema owned by W01 (Commander-gated), seed by W06 |
| Launch seed = 3 markets at 3 LETTERED stages | **INFERENCE** | R3 + plan §T6.1 |

Reproduction: see `UNIVERSE_VS_MARKETS.md §8`.
