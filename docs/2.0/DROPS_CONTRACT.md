# DROPS OS INTEGRATION CONTRACT — narrow, authenticated, READ-ONLY

**Workstream:** W05 · **Task:** T5.1 · **Status:** SPEC (implementation Commander-gated)
**Repo:** `TUF-OPS Repo` @ `rebuild/2.0` (created from `feat/opportunity-lifecycle` `59372e12`)
**Authority:** founder ruling **R8 (FINAL, 2026-10-03)** — plan §"FOUNDER RULINGS APPLIED — R4–R8 FINAL"
**Choke point:** **S9** (`DEPENDENCY_GRAPH.md` §5) — `LetteredDeployment` (2.6) and `MarketMetric` (2.12)
both depend on the exact fields crossing here. **This document freezes that field set; freeze before either entity is coded.**
**Companions:** `DEPENDENCY_GRAPH.md` §2.6/§2.12/§5 (S9), `CLASSIFICATION.md` §9, `GATE0_CLOSEOUT.md` §5,
plan §2.1/§2.3/R8, `SCHEDULE.md` Gate 2 risk.

> **Confidence tags are load-bearing.** Every claim below is tagged **VERIFIED** (observed in the live DB,
> the repo, or the founder ruling), **INFERENCE** (a designed decision not yet proven against Drops), or
> **UNKNOWN** (TUF Ops cannot currently verify it). **No Drops endpoint is asserted as fact.** Drops OS is
> itself mid-change (plan §7.6; a parallel session carried 16 modified files; the Asset Studio fix shipped
> as `ea85b341`), so this contract is pinned to **behaviour, not to a commit or a URL**.

---

## 1. Purpose

TUF Ops 2.0 operates a Market across three engines (TEAM UNIFORMS, LETTERED, ISSUE). LETTERED's commerce
engine is **Drops OS**: Drops owns the school storefront, products, checkout, consumer payments and
fulfillment. TUF Ops does **not** rebuild any of that. It needs exactly one thing from Drops — the
**summarized operational/commerce/attribution picture** required to run a Market — delivered through a
**narrow, authenticated, read-only** integration so that LETTERED COMMAND and a Market's War-Board row can
show real commerce instead of a fabricated number.

**Governing principle for this contract (quote in the spec and the code comments):**

> **Drops OS is the system of record for consumer commerce. TUF Ops is a reader, never a writer. If TUF Ops
> cannot read Drops, it shows what it last knew and says so — it never invents a number and never blanks
> the screen.**

This document is the **frozen S9 boundary**. It specifies (a) the authority boundary, (b) the
endpoint/method shape TUF Ops calls, (c) the service-to-service auth approach, (d) the exact fields that
cross with types/nullability/availability, (e) the `MarketMetric` cache and its staleness policy, (f) the
failure behaviour, and (g) the explicit non-goals. It contains **no application code** and mandates none.

---

## 2. Authority boundary

### 2.1 Who owns what

| Concern | System of record | TUF Ops role | Conf |
|---|---|---|---|
| LETTERED collections / drops | **Drops OS** | stores the **identifier only** (`drops_collection_id` / `drop_id`) | VERIFIED (R8) |
| Products / catalog | **Drops OS** | **stores nothing**; reads no line items | VERIFIED (R8) |
| Storefronts / public store URL | **Drops OS** | stores `store_url` as a reference string | VERIFIED (R8) |
| Checkout / consumer payments | **Drops OS** | **stores nothing** | VERIFIED (R8) |
| Consumer orders | **Drops OS** | stores **no order rows**; reads an **aggregate count/value only** | VERIFIED (R8) |
| Fulfillment / production (consumer side) | **Drops OS** | reads a **summary** where operationally useful | VERIFIED (R8) |
| Academic institution, people, relationships | TUF Ops (`markets`, universe) | authoritative on the TUF side | VERIFIED (R2/R3) |
| Market lifecycle, owner, next action | TUF Ops (`markets`) | authoritative | VERIFIED (R2/R3) |
| Institutional (b2b) orders, revenue, production | TUF Ops (`Order/RevenueReference`, `ProductionReference`) | authoritative | VERIFIED (plan §2.1) |

### 2.2 The two identifiers that cross the boundary

TUF Ops stores, on a `LetteredDeployment` row, **Drops identifiers/references and nothing more**:

```
drops_organization_id   the Drops Organization this deployment maps to   (R8 field #1)
drops_collection_id     the Drops collection / drop                      (R8 field #2)
store_url               the public school-scoped storefront URL          (R8 field #3)
```

- **VERIFIED** (R8): Drops models include `Organization`, `Drop`, `Order`, `publicOrderId`.
- **INFERENCE**: the stored identifier pair `(drops_organization_id, drops_collection_id)` is the join key
  from a `LetteredDeployment` to its `MarketMetric` cache row (§5) and to the Drops read call (§3).
- **VERIFIED** (known context): earlier Drops work established **school-scoped public URLs of the form
  `/schools/<school>/<collection>`**. `store_url` is expected to be that shape, **INFERENCE** for the exact
  host/path when Drops owns it — TUF Ops stores the string Drops returns and does not construct it.
- **UNKNOWN**: whether Drops exposes a stable, TUF-readable `publicOrderId`-style reference TUF Ops should
  store. The R8 field set does **not** require it, so TUF Ops stores **no order-level identifier** in MVP
  (this is a non-goal, §7).

### 2.3 Direction and shape

- **TUF Ops → Drops: reads only.** One direction. No mutation, no webhook registration that implies
  mutation, no product/order push. **VERIFIED** (R8: "Do not implement TUF Ops -> Drops commerce mutations
  in MVP. Read-only.").
- **Drops → TUF Ops: nothing push-based in MVP.** TUF Ops **pulls** on a schedule (§5.3). No inbound Drops
  webhook is in scope; if Drops later offers one it may *trigger* a pull, but it must not become a second
  write path. **INFERENCE**.

---

## 3. Endpoints / methods TUF Ops calls

> **Every concrete Drops URL below is UNKNOWN.** TUF Ops cannot currently verify Drops' REST surface. What
> is specified is the **abstract shape** TUF Ops will code against, behind a thin adapter
> (`apps/api/src/modules/integration/drops.*`, the S9 file, VERIFIED as the planned path). When Drops
> confirms its real routes, only the adapter's URL/parsing layer changes — the TUF-side types in §4 do not.

### 3.1 Abstract operations (the contract TUF Ops depends on)

TUF Ops requires **at most three read operations**. The adapter MUST be able to satisfy each from a Drops
response; if Drops exposes them combined, the adapter still presents them separately.

| Op | Abstract method + shape | Purpose | Drops route | Conf |
|---|---|---|---|---|
| **A. Read collection summary** | `GET {DROPS_BASE_URL}/<collection-resource>/{drops_collection_id}` (org-scoped) → one JSON object carrying the §4 commerce/attribution fields | the primary poll; drives `MarketMetric` | **UNKNOWN** | INFERENCE (shape), UNKNOWN (route) |
| **B. Read collection status** | `GET` the same resource, projecting only `lifecycle/status`, `published_at`, `store_url` | cheap liveness/status poll when full summary is not needed | **UNKNOWN** | INFERENCE / UNKNOWN |
| **C. Read fulfillment/production summary** (optional) | `GET {DROPS_BASE_URL}/<collection-resource>/{id}/<fulfillment-summary>` | only if operationally useful and only if Drops exposes an aggregate (never line items) | **UNKNOWN** | UNKNOWN |

- Anything an operation returns beyond the §4 field set **must be discarded by the adapter**, not persisted.
  Storing extra Drops objects is how consumer-commerce duplication creeps in. **INFERENCE (design rule).**
- **List/"all collections for an organization"**: TUF Ops does **not** need a bulk crawl in MVP — it polls
  the specific `(drops_organization_id, drops_collection_id)` pairs it has stored. **INFERENCE.**
- **Pagination**: not required for an aggregate summary; **UNKNOWN** whether the summary endpoint paginates.
  The adapter treats a paginated response as a contract violation (log, do not partially cache).

### 3.2 Transport expectations (adapter contract)

| Expectation | Spec | Conf |
|---|---|---|
| Protocol | HTTPS only | INFERENCE |
| Method | `GET` (no other verb is ever issued) | INFERENCE |
| Content type | JSON | INFERENCE |
| Request timeout | bounded (default **10 s**), configurable via env placeholder | INFERENCE |
| Retries | max **3** with backoff, on 5xx / timeout only; never on 4xx | INFERENCE |
| Idempotency | read-only, so all calls are naturally idempotent | INFERENCE |
| Error envelope | any non-2xx ⇒ operation returns a typed failure, never partial data | INFERENCE |

> **UNKNOWN**: Drops' exact status codes, rate limits, or whether it distinguishes 401 (bad auth) from 403
> (no access) from 404 (collection missing). The adapter maps **all** of these to the failure path in §6.

---

## 4. Contract field set (frozen by R8)

Types below are the **TUF-side** types (what the adapter yields and what `MarketMetric` may persist).
DB column names are snake_case; TS type names are camelCase, matching repo convention. "Availability" is
TUF Ops' current ability to verify Drops actually exposes the field.

### 4.1 Identity / reference fields (stored on `LetteredDeployment`)

| # | Field | Type | Nullable | Availability | Conf / note |
|---|---|---|---|---|---|
| 1 | `drops_organization_id` | `string` \| `integer` | **NOT NULL** (once linked) | R8 required; **Drops type UNKNOWN** | The Drops `Organization` id. Type is intentionally unioned: **UNKNOWN** whether Drops uses numeric ids, UUIDs, or slugs. Store as opaque text in TUF Ops. |
| 2 | `drops_collection_id` / `drop_id` | `string` \| `integer` | **NOT NULL** (once linked) | R8 required; **Drops type UNKNOWN** | The Drops collection/drop id. Same opaque-text treatment as #1. `drop_id` is an alias name from R8; the contract canonicalises on `drops_collection_id`. |
| 3 | `store_url` | `string` (URL) | NULL until Drops returns it | **UNKNOWN** (expected, shape INFERENCE) | Public school-scoped URL `/schools/<school>/<collection>` (VERIFIED form from earlier Drops work); exact host/path from Drops is UNKNOWN. TUF Ops stores the returned string verbatim; it does not build it. |

> These three are the **only** Drops identifiers/references TUF Ops stores. No product id, no order id,
> no customer id, no payment id. (Non-goals, §7.)

### 4.2 Operational / lifecycle fields (cached on `MarketMetric`)

| # | Field | Type | Nullable | Availability | Conf / note |
|---|---|---|---|---|---|
| 4 | `store_status` | enum-ish `string` (e.g. draft/published/live/closed) | NULL | **UNKNOWN** | Drops' own store lifecycle. TUF Ops stores the raw string, does **not** map it into the 2.0 LETTERED state machine (plan §2.3) — that is TUF-owned state and must never be driven by a Drops string. |
| 4b | `lifecycle_status` | `string` | NULL | **UNKNOWN** | R8 lists "store / lifecycle_status" as one line; split here because they may be distinct Drops fields. If Drops exposes only one, `lifecycle_status` is NULL and `store_status` carries it. |
| 5 | `published_at` | `timestamptz` | NULL | **UNKNOWN** | When the collection/store went public. Store as ISO-8601 parsed to timestamptz; NULL if never published. |

### 4.3 Commerce fields (cached on `MarketMetric`)

| # | Field | Type | Nullable | Availability | Conf / note |
|---|---|---|---|---|---|
| 6 | `order_count` | `integer >= 0` | NULL when unknown | **UNKNOWN** | Aggregate count of consumer orders for the collection. **Aggregate only** — never a list of orders. |
| 7 | `revenue` | `numeric(14,2)` (minor units avoided; currency implied) | NULL when unknown | **UNKNOWN** | Total consumer revenue. **UNKNOWN**: Drops' currency and whether `revenue` is gross/net of refunds — TUF Ops stores what Drops returns and labels it "revenue (as reported by Drops)"; it does not recompute. |
| 8 | `aov` | `numeric(14,2)` | NULL when unknown | **UNKNOWN** | Average order value. **Derivable** as `revenue / order_count`; TUF Ops prefers the value Drops returns, falls back to computed only if Drops omits it, and marks the provenance (§5.4). Order_count = 0 ⇒ AOV is NULL, **never 0 as-if-real** (matches GATE0 §"zero rows ⇒ zero numbers"). |
| 9 | `first_order_at` | `timestamptz` | NULL | **UNKNOWN** | Timestamp of the first consumer order. NULL if no orders. |

### 4.4 Attribution fields (cached on `MarketMetric`)

| # | Field | Type | Nullable | Availability | Conf / note |
|---|---|---|---|---|---|
| 10 | `utm_summary` | `jsonb` (bounded key set) | NULL | **UNKNOWN** | UTM/referral summary. Shape is **UNKNOWN** (possibly a map of source/medium/campaign → count, or a top-N list). TUF Ops persists a **bounded** summary — top sources only, hard key cap — never raw per-order UTM rows. |
| 10b | `referral_summary` | `jsonb` (bounded key set) | NULL | **UNKNOWN** | Companion to `utm_summary` from R8's "UTM / referral summary". Same bounded-persistence rule. |

### 4.5 Fulfillment / production summary (cached on `MarketMetric`)

| # | Field | Type | Nullable | Availability | Conf / note |
|---|---|---|---|---|---|
| 11 | `fulfillment_summary` | `jsonb` (bounded key set) | NULL | **UNKNOWN** | Aggregate production/fulfillment status counts "where operationally useful". **Never** line items, **never** per-order status. If Drops exposes nothing aggregate, this stays NULL and LETTERED COMMAND simply omits that block — it does not fabricate a status. |

### 4.6 Sync bookkeeping (cached on `MarketMetric`)

| # | Field | Type | Nullable | Availability | Conf / note |
|---|---|---|---|---|---|
| 12 | `last_sync_at` | `timestamptz` | **NOT NULL** (once a row exists) | TUF-owned | When TUF Ops last **successfully** read Drops for this key. Set by TUF Ops, not by Drops. Drives the staleness policy (§5.3). |

> **Frozen-ness:** this table is the whole boundary. Adding a field is a contract change requiring a new
> review of S9 (`DEPENDENCY_GRAPH.md` §5); it is not an adapter-local decision. **INFERENCE (governance).**

---

## 5. The `MarketMetric` cache

### 5.1 Purpose

`MarketMetric` is a **cache**, not a system of record. Its ONLY consumer is the LETTERED COMMAND numbers and
the Market War-Board commerce column. It may be dropped and rebuilt from Drops at any time without loss of
recorded truth. **VERIFIED** (`DEPENDENCY_GRAPH.md` §2.12: "Depended on by: LETTERED COMMAND numbers only.
Never a source of consumer order/product duplication.").

### 5.2 Keying and shape

- **Keyed by `(drops_organization_id, drops_collection_id)`** — **VERIFIED** (R8 FINAL; §2.12). One row per
  key. The `MarketMetric` row also carries a soft reference to the `LetteredDeployment` (and thence Market)
  it serves, but the Drops key is the identity that Drops responses are matched against.
- **Stores NO line items** — **VERIFIED** (R8 FINAL; plan §R8). No products, no orders, no order items, no
  customers, no payments. The column set is exactly §4.2–§4.6 (identifiers in §4.1 live on
  `LetteredDeployment`). A test asserts the absence of any line-item table/column on the Drops path
  (plan T5.2/T7 "assert no consumer order/product duplication exists in TUF Ops schema").
- **One snapshot per key** in MVP (latest wins). History is **out of scope** (non-goal §7); if trend charts
  are wanted later that is a deliberate schema change, not an implicit one.

### 5.3 Staleness policy (`last_sync_at`)

| Aspect | Policy | Conf |
|---|---|---|
| Freshness window | a snapshot is **FRESH** while `now() - last_sync_at <= DROPS_STALE_AFTER` (placeholder default **60 min**, env-configurable) | INFERENCE |
| Poll cadence | the fetcher polls each stored `(org, collection)` pair on a bounded interval (default **15 min**, env placeholder); poll cadence MUST be `< ` freshness window | INFERENCE |
| On poll success | overwrite the snapshot fields, set `last_sync_at = now()` | INFERENCE |
| On poll failure | **keep the existing snapshot unchanged**; do **not** clear fields, do **not** advance `last_sync_at` | INFERENCE (directly implied by §6 / R8 "never fabricate, never blank") |
| Stale rendering | a rendered value is **STALE** iff `now() - last_sync_at > DROPS_STALE_AFTER` | INFERENCE |
| Never-synced key | `last_sync_at` is NULL / row absent ⇒ report **"no data yet"**, never `0` | INFERENCE (GATE0: zero rows ⇒ zero numbers) |
| Clock | `now()` is the **TUF Ops** clock (server), not Drops' | INFERENCE |

### 5.4 Provenance

Each cached commerce value records whether it was **as-reported** by Drops or **derived** by TUF Ops (only
the AOV fallback in §4.3 #8 is ever derived). This lets the UI distinguish a real figure from a computed
one and keeps the "no fabricated reporting" rule honest. **INFERENCE.**

---

## 6. Failure behaviour (Drops unreachable)

This is a first-class requirement, not an error-handling afterthought. Tested by plan **T5.3**.

**When Drops is unreachable, times out, 5xx's, or returns an unexpected shape:**

1. **COMMAND renders the cached values** from `MarketMetric`. **VERIFIED** (R8 FINAL; plan T5.3).
2. **Every rendered Drops-sourced value is marked STALE** (visually and in the API payload — e.g.
   `stale: true` + `last_sync_at`). **VERIFIED** (plan T5.3).
3. **MUST NOT fabricate.** No `0`, no placeholder, no interpolated trend, no model-estimated figure. A
   never-synced key renders an explicit **"no data yet"** empty state. **VERIFIED** (plan T5.3; GATE0).
4. **MUST NOT blank the screen.** The rest of the Market view (TUF Ops-owned: lifecycle, owner,
   next action, institutional revenue) still renders. Only the Drops-sourced block degrades to
   cached+stale. **VERIFIED** (plan T5.3).
5. **Must not block the request path.** A Drops hiccup must not fail the COMMAND/Market response. The read
   is served from the cache; the fetcher fails in the background and logs. **INFERENCE (design).**
6. **Must not leak as a 500.** A failed Drops call surfaces as cached+stale with a logged warning and (at
   most) a typed warning field — never an unhandled exception reaching the user. **INFERENCE.**
7. **Recovery is automatic.** The next successful poll overwrites the snapshot and clears the stale mark
   without operator action. **INFERENCE.**

**Forbidden outcomes (assert in tests):** a fabricated number; `0`/`$0.00`/`N/A` presented as if real; a
blank commerce block with no explanation; a request failure caused by Drops being down. **VERIFIED** (R8 +
plan T5.3/GATE0 §5).

---

## 7. Explicit NON-GOALS (MVP)

These are out of scope by founder ruling; implementing any of them is a contract violation, not an
enhancement.

| # | Non-goal | Conf |
|---|---|---|
| 1 | **No consumer order duplication.** TUF Ops stores no consumer order rows, ever. It caches `order_count`/`revenue`/`AOV`/`first_order_at` aggregates only. | VERIFIED (R8 FINAL) |
| 2 | **No product / catalog duplication.** No product rows, variants, prices, images, inventory. | VERIFIED (R8) |
| 3 | **No write / mutation calls to Drops.** No create/update/delete of collections, drops, products, prices, storefronts, or orders. `GET` only. | VERIFIED (R8 FINAL) |
| 4 | **No payment / checkout / customer data.** No customer identities, no payment tokens, no PII from Drops. | VERIFIED (R8) |
| 5 | **No order-level identifiers stored.** No `publicOrderId`, no order id list, no per-order attribution. | INFERENCE (implied by #1 + R8 field set) |
| 6 | **No real-time / webhook-driven streaming.** Scheduled pull only in MVP. | INFERENCE (R8 "poll/cache" framing) |
| 7 | **No metric history / time series.** Latest snapshot per key only. | INFERENCE |
| 8 | **No mapping Drops status strings into TUF lifecycle states.** Drops status is displayed, never drives a TUF state transition. | VERIFIED (plan §2.3: TUF state machines are TUF-owned) |
| 9 | **No consumer-facing surface.** The Drops integration feeds internal operations only; the public storefront stays wholly on Drops. | VERIFIED (R8) |

---

## 8. Authentication (service-to-service)

The Drops read is a **server-to-server** call from the TUF Ops API (the S9 module); it never happens from
the browser. **INFERENCE (design).**

| Aspect | Spec | Conf |
|---|---|---|
| Pattern | service-to-service; TUF Ops presents a **machine credential** to Drops on every read | INFERENCE |
| Credential placement | header (e.g. `Authorization: Bearer <placeholder>` or a Drops-specific API-key header) — **exact scheme UNKNOWN** until Drops confirms | UNKNOWN |
| Storage | env vars on the TUF Ops API service **only**, never in the web bundle | INFERENCE |
| Placeholders (do **not** invent real values) | `DROPS_BASE_URL`, `DROPS_API_KEY`, optional `DROPS_AUTH_SCHEME`, `DROPS_STALE_AFTER`, `DROPS_POLL_INTERVAL` | INFERENCE |
| Secret handling | no secret is written into this repo, logs, client code, or `MarketMetric`; credentials are injected at deploy (Railway env), consistent with existing services | VERIFIED (repo reads config from `process.env`, e.g. `index.ts`) / INFERENCE (Drops specifics) |
| Rotation | the credential is replaceable without a code change (adapter reads it at call time from env) | INFERENCE |
| Failure on bad auth | 401/403 ⇒ typed failure ⇒ §6 (cached + stale); never surfaces credentials in errors | INFERENCE |
| Drops-side setup | **UNKNOWN** — whether Drops already issues a machine credential, how it is scoped/rotated, and whether it is per-organization | UNKNOWN |

> **Auth is an ops dependency, not a code invention.** Per `GATE0_CLOSEOUT.md` §5, where Drops does not
> expose a required read, the cache stays empty and marked stale; TUF Ops must not fabricate a credential
> or a workaround. **VERIFIED (governance).**

---

## 9. Open items (UNKNOWN) — must be confirmed against Drops before Gate 2

| # | Unknown | Blocks | Owner |
|---|---|---|---|
| 1 | Concrete Drops route(s) for operations A/B/C (§3.1) | adapter URL layer | W05 + Drops |
| 2 | Drops' id type for organization/collection (numeric vs UUID vs slug) | `LetteredDeployment` column type | W05 |
| 3 | Which of the §4 fields Drops actually exposes ("where available") | which COMMAND numbers are real vs "no data yet" | W05 + Drops |
| 4 | Auth scheme/header/credential issuance | §8 | W05 + ops |
| 5 | `revenue` semantics (gross vs net of refunds) and currency | COMMAND label accuracy | W05 |
| 6 | Shape of `utm_summary` / `referral_summary` / `fulfillment_summary` | bounded-persistence codec | W05 |
| 7 | Rate limits / pagination of the summary endpoint | poll cadence tuning | W05 |

`SCHEDULE.md` Gate 2 already lists the cross-product risk: **"Drops OS exposes the R8 read fields (where
available)"** — where absent, `MarketMetric` stays empty and stale (T5.3). **VERIFIED.**

---

## 10. Contract invariants (assertable in tests)

1. The Drops integration issues **`GET` only** — a test asserts no other HTTP method reaches the adapter.
   *(§7 #3)*
2. `MarketMetric` contains **no line-item table/column**; a schema test asserts no consumer order/product
   duplication exists on the Drops path. *(R8; plan T7)*
3. A `MarketMetric` row is uniquely keyed by **(drops_organization_id, drops_collection_id)**. *(§5.2)*
4. With the Drops call failing, COMMAND returns **cached values marked stale**, `stale === true`, and a
   non-null `last_sync_at` for previously-synced keys. *(§6; plan T5.3)*
5. A never-synced key renders **"no data yet"** — never `0`. *(§6 #3; GATE0)*
6. `order_count = 0` ⇒ `aov` is NULL/absent, never `0`. *(§4.3 #8)*
7. No Drops status string can trigger a **TUF lifecycle transition**. *(§7 #8; plan §2.3)*
8. The adapter discards any Drops field outside §4 before persistence. *(§3.1)*

---

## 11. Method & provenance

- Field set, authority boundary, read-only direction, and non-goals are **VERIFIED** against founder ruling
  **R8 (FINAL, 2026-10-03)** (plan §"FOUNDER RULINGS APPLIED — R4–R8 FINAL") and plan **§2.1/§2.3/T5.1–T5.3**.
- S9 status, `LetteredDeployment`/`MarketMetric` edges, and the "no line items" invariant are **VERIFIED**
  against `DEPENDENCY_GRAPH.md` §2.6/§2.12/§5.
- The planned adapter path `apps/api/src/modules/integration/drops.*` is **VERIFIED** as a planned (not yet
  existing) file — `grep` found **no** Drops integration code in `apps/` today; `CLASSIFICATION.md` §9
  classes it **REBUILD (new, R8)**.
- Drops' concrete endpoints, id types, auth scheme, and per-field availability are **UNKNOWN** — TUF Ops
  cannot verify Drops' surface from this repository, and Drops is mid-change. **Nothing above presents an
  unverified Drops endpoint as fact.**
- This document is **documentation only**. No application code, schema, migration, or config was created or
  modified. No commit/push/branch/deploy was performed.
