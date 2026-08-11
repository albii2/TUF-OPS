# Drops OS — Payment, Fraud Prevention, Inventory, and Security Audit

**Date:** 2026-07-26  
**Scope:** Payment system, fraud prevention, inventory management, and security gaps  
**Stack:** Next.js 15.5, Prisma, PostgreSQL, Stripe, Tailwind  
**Files Audited:** 10 core files (routes, libs, schema, webhook handler)

---

## PAYMENT SYSTEM

### PAY-01 [CRITICAL] No Idempotency Keys on Stripe PaymentIntent Creation

**Files:**
- `app/api/create-order/route.ts:72` — `stripe.paymentIntents.create(paymentIntentParams)`
- `app/api/pay-balance/route.ts:68` — `stripe.paymentIntents.create(paymentIntentParams)`

**Detail:** Neither endpoint passes an `idempotency_key` to Stripe. If the HTTP request to Stripe succeeds on Stripe's side but the response never reaches the server (network timeout, process crash), a client retry creates a **second PaymentIntent and a second charge**. Stripe's SDK does not auto-retry safely without an idempotency key — this leads to double-charging customers.

**Severity:** CRITICAL — Direct financial loss; double charges.

---

### PAY-02 [CRITICAL] Inventory Reserved BEFORE Stripe PaymentIntent — No Rollback on Failure

**Files:**
- `app/api/create-order/route.ts:31` — calls `createOrderWithDeposit()` which reserves inventory inside a transaction
- `app/api/create-order/route.ts:34-82` — payment record creation, Stripe PaymentIntent creation — OUTSIDE the transaction

**Detail:** The `createOrderWithDeposit` function in `lib/domain.ts:29-101` uses `prisma.$transaction` to atomically create the order + increment `reservedInventory`. But the route handler then tries to create a `Payment` record and a Stripe `PaymentIntent` OUTSIDE this transaction. If either step fails (Stripe down, DB error), the catch block at line 89 returns a 400 error — but the **order and reserved inventory persist** with no payment record. The order is in `pending_payment` status with no Stripe client secret, and inventory is permanently lost.

**Severity:** CRITICAL — Inventory leak on every Stripe/PaymentIntent failure; permanent stock drain.

---

### PAY-03 [HIGH] Duplicate Balance Payments Possible — No Check for Existing Successful Payment

**File:** `app/api/pay-balance/route.ts:17-68`

**Detail:** Every call to `POST /api/pay-balance` creates a new `Payment` record (line 32) and new `PaymentIntent` (line 68) regardless of whether a successful balance payment already exists for that order. The `payBalanceForOrder` in `lib/domain.ts:104-136` only checks `balance_owed > 0` and moves inventory from reserved → sold — but it doesn't check for existing successful payments. If the Stripe call times out and the client retries, two PaymentIntents are created for the same balance.

**Severity:** HIGH — Duplicate charges; no cross-request deduplication.

---

### PAY-04 [MEDIUM] Webhook Processing Is Non-Transactional

**File:** `app/api/stripe/webhook/route.ts:50-75`

**Detail:** When a `payment_intent.succeeded` event arrives, the handler updates the `Payment` record (line 50) and then separately updates the `Order` (line 61 or 67). These are **two separate Prisma calls** — if the process crashes between them, the payment is marked succeeded but the order status is stale (e.g., still `pending_payment`). There's no transaction boundary.

**Severity:** MEDIUM — Data inconsistency risk on crash/kill.

---

### PAY-05 [MEDIUM] Webhook Missing `payment_intent.processing` Handler

**File:** `app/api/stripe/webhook/route.ts:27-147`

**Detail:** The webhook switch handles `payment_intent.succeeded`, `.payment_failed`, and `.canceled`. It does **not** handle `payment_intent.processing` or `payment_intent.requires_action`. If a payment requires 3D Secure or other async authentication, the system has no way to track "processing" state — the order just sits in limbo.

**Severity:** MEDIUM — Stuck orders for async auth flows (3D Secure, bank redirects).

---

### PAY-06 [LOW] No Stripe Outage Resilience / Retry Path

**File:** `app/api/create-order/route.ts:88-90`

**Detail:** If Stripe is unreachable during order creation (line 72), the catch block at line 88 returns a generic error. The order is already created with reserved inventory (from step 1) but the client receives only an error message with no `publicOrderId` or `clientSecret`. There's **no retry endpoint** for the client to resume payment on an existing `pending_payment` order.

**Severity:** LOW — User must restart entire flow; reserved inventory sits until manual cleanup.

---

### PAY-07 [LOW] No `payment_intent.amount_capturable_updated` or Partial Capture Handling

**File:** `app/api/stripe/webhook/route.ts` (entire file)

**Detail:** Only the full `succeeded` event is handled. There's no support for partial captures or auth-then-capture payment flows. All PaymentIntents are created with implicit `capture_method: automatic` (default), but if this ever changes, the webhook can't handle `amount_capturable_updated`.

**Severity:** LOW — Not exploitable with current config; future risk.

---

## FRAUD PREVENTION

### FRD-01 [CRITICAL] `maxOrdersPerPhonePerDrop` Is NEVER Enforced

**Files:**
- `prisma/schema.prisma:246` — field defined on `SellerSetting`
- `app/api/seller/settings/route.ts:12` — validated in settings schema
- `app/api/create-order/route.ts:10-91` — NO enforcement

**Detail:** The `maxOrdersPerPhonePerDrop` setting exists in the DB, is configurable via the seller settings UI/API, but is **never checked anywhere in the order creation flow**. Not in `create-order/route.ts`, not in `lib/domain.ts`'s `createOrderWithDeposit`. A single phone number can place unlimited orders on any drop.

**Severity:** CRITICAL — Core fraud control is a dead setting with zero effect.

---

### FRD-02 [HIGH] Phone Number Format Bypass — No Normalization on Order Creation

**Files:**
- `lib/auth.ts:27-29` — `normalizePhone()` strips non-digit characters
- `app/api/create-order/route.ts:16` — `customerPhone` accepted as raw string
- `lib/domain.ts:58` — raw phone stored in Customer record

**Detail:** The `normalizePhone()` function exists and is used for login, but `createOrderWithDeposit` stores the **raw** phone from the request body. Even if `maxOrdersPerPhonePerDrop` were enforced, an attacker could bypass it with `(555) 123-4567`, `555-123-4567`, `5551234567`, `+1 555-123-4567`, etc. — each creating a different Customer record with a different phone string.

**Severity:** HIGH — Trivially bypassable even if FRD-01 were fixed.

---

### FRD-03 [HIGH] No Rate Limiting on Create-Order Endpoint

**File:** `app/api/create-order/route.ts:19-91`

**Detail:** There is zero rate limiting — no in-code throttling, no middleware rate limiter, no `X-RateLimit-*` headers. An attacker can flood the endpoint, exhausting inventory reservations via concurrent calls. While the `FOR UPDATE` row lock (domain.ts:36) prevents oversell within a single DB transaction, it does **not** prevent inventory exhaustion via many rapid sequential calls that each consume one unit of `reservedInventory`.

**Severity:** HIGH — Denial of inventory via reservation exhaustion.

---

### FRD-04 [MEDIUM] Inventory Reserved Without Payment Commitment — No Reservation TTL

**File:** `lib/domain.ts:94`

**Detail:** When `createOrderWithDeposit` runs, `reservedInventory` is incremented (line 94). But if the user never completes the Stripe payment (closes browser, walks away), the inventory stays reserved **indefinitely**. There is no cron job, TTL, or timeout that auto-releases `pending_payment` orders. The `markOverdueOrders` function (domain.ts:10-19) only marks `deposit_paid` → `overdue`, not `pending_payment` → cancelled.

**Severity:** MEDIUM — Abandoned checkouts permanently reduce available stock.

---

### FRD-05 [MEDIUM] No Drop Opening Time Enforcement

**Files:**
- `prisma/schema.prisma:99` — `depositOpensAt` field on Drop
- `app/api/create-order/route.ts:19-91` — no check against `depositOpensAt`

**Detail:** The `Drop` model has `depositOpensAt` for scheduling when orders open, but the `create-order` route never checks it. Customers can place orders before the scheduled drop time.

**Severity:** MEDIUM — Bypass of scheduled drop windows.

---

### FRD-06 [MEDIUM] Login Brute-Force Protection Is In-Memory Only

**File:** `app/api/seller/login/route.ts:14-16`

**Detail:** The failed-attempt counter (`failedAttempts` Map) and lockout logic exist only in Node.js process memory. A server restart or multi-instance deployment (no shared Redis/store) resets all counters. Attackers can cycle instances or wait for deploys.

**Severity:** MEDIUM — Brute-force protection gap in production/multi-instance environments.

---

## INVENTORY SYSTEM

### INV-01 [CRITICAL] Inventory Leak: Order Reserved But PaymentIntent Never Created

**Same as PAY-02** — included here for inventory-specific impact.

**File:** `app/api/create-order/route.ts:31-89`

**Detail:** `createOrderWithDeposit` (domain.ts:29-101) runs in a transaction that:
1. Locks the `drop_sizes` row with `FOR UPDATE`
2. Checks availability
3. Creates the Customer record
4. Creates the Order
5. Increments `reservedInventory` by 1

But steps 2–4 in the route handler (payment record, Stripe PaymentIntent) are OUTSIDE this transaction. If Stripe is down or the payment record creation fails, the inventory is already reserved and **never released** — the order is stuck in `pending_payment` with no payment link.

**Severity:** CRITICAL — Permanent inventory drain on every failure between order creation and Stripe.

---

### INV-02 [CRITICAL] No Reservation Auto-Release / TTL

**Same as FRD-04** — included here for inventory impact.

**File:** `lib/domain.ts:10-19` (`markOverdueOrders` only handles `deposit_paid → overdue`)

**Detail:** There is no mechanism to auto-cancel `pending_payment` orders after a timeout. `markOverdueOrders` only transitions `deposit_paid` orders with expired `balanceDueAt`. Orders stuck in `pending_payment` never time out and never release their reserved inventory.

**Severity:** CRITICAL — Abandoned checkouts permanently hold inventory.

---

### INV-03 [HIGH] Edit-Drop Allows `totalInventory` Below `reserved + sold`

**File:** `app/api/seller/drops/[dropId]/route.ts:92-95`

**Detail:** The edit-drop route updates existing sizes' `totalInventory` directly:

```typescript
await prisma.dropSize.update({
  where: { id: existing.id },
  data: { totalInventory: size.totalInventory },
});
```

There is **no validation** that `size.totalInventory >= existing.reservedInventory + existing.soldInventory`. A seller could accidentally set `totalInventory` to 1 on a size that already has 50 reserved + 20 sold, making the DB state inconsistent.

**Severity:** HIGH — Data integrity violation; allows negative availability.

---

### INV-04 [HIGH] Cancelling a `deposit_paid` Order Releases Inventory Without Refund

**File:** `lib/domain.ts:150-161`

**Detail:** `cancelReservedOrder` allows cancelling orders in `deposit_paid` status (line 152). It decrements `reservedInventory` (line 160) and sets order to `cancelled` (line 166). But the customer **already paid a deposit** that succeeded via Stripe. No refund is issued — the money is kept while inventory is returned to the pool. This is a dual loss: financial (customer charged, no refund) and inventory inconsistency (the deposit payment record remains `succeeded` but the order is `cancelled`).

**Severity:** HIGH — Financial/inventory double-loss; no refund handling.

---

### INV-05 [HIGH] `cancelReservedOrder` Race Condition Leaves Uncancelled Orders

**File:** `lib/domain.ts:158-162`

**Detail:** The function uses `updateMany` with `reservedInventory: { gt: 0 }` as a guard:
```typescript
const result = await tx.dropSize.updateMany({
  where: { id: lockedOrder.drop_size_id, reservedInventory: { gt: 0 } },
  data: { reservedInventory: { decrement: 1 } },
});
if (result.count !== 1) throw new Error("Inventory mismatch; cannot release pair");
```

If two concurrent cancel requests race, both pass the `FOR UPDATE` lock (they lock different rows — the order rows are locked, not the dropSize), both check the order status, both attempt `updateMany`. The second one finds `reservedInventory` already decremented to 0 by the first and throws. The second order is **never cancelled** — it stays in its current status while the first cancellation already decremented inventory. Net result: inventory decremented once, but only one of two orders cancelled.

**Severity:** HIGH — Concurrent cancel race leaves orphaned orders.

---

### INV-06 [MEDIUM] No Database-Level CHECK Constraint on Inventory

**File:** `prisma/schema.prisma:115-130`

**Detail:** The `DropSize` model has no CHECK constraint:
```
CONSTRAINT inventory_check CHECK (total_inventory >= reserved_inventory + sold_inventory)
```

All inventory integrity depends on application-level logic only. A direct DB write, migration error, or bug could violate the invariant.

**Severity:** MEDIUM — Missing defense-in-depth for core business invariant.

---

### INV-07 [MEDIUM] `payBalanceForOrder` Moves Inventory reserved→sold Before Payment Confirmed

**File:** `lib/domain.ts:122-127`

**Detail:** When `payBalanceForOrder` is called (during balance payment initiation), it **immediately** moves inventory from `reserved` to `sold` (lines 122-127) — before the Stripe PaymentIntent is even created (line 68 of pay-balance/route.ts), let alone confirmed (via webhook). If the payment fails, the inventory is already marked `sold` with no corresponding successful payment. The webhook failure handler at `app/api/stripe/webhook/route.ts:98-113` only releases reserved inventory for `pending_payment` orders — it does **not** reverse sold inventory for `deposit_paid` orders whose balance payment failed.

**Severity:** MEDIUM — Premature inventory state change; no reversal on payment failure.

---

### INV-08 [LOW] Abandoned `pending_payment` Orders Have No Visibility/Tracking

**File:** `lib/status.ts:8-12` (`REVENUE_ORDER_STATUSES` includes `pending_payment`)

**Detail:** Orders stuck in `pending_payment` (due to Stripe failure or user abandonment) are counted in `activeOrders` (domain.ts:183-185 via `REVENUE_ORDER_STATUSES`) but the seller has no way to identify or bulk-cancel them. There's no dashboard filter or API endpoint for "stuck pending" orders.

**Severity:** LOW — Operational blind spot.

---

## SECURITY

### SEC-01 [HIGH] No CSRF Protection on State-Changing Endpoints

**Files:** All POST/PUT/DELETE route handlers:
- `app/api/create-order/route.ts`
- `app/api/pay-balance/route.ts`
- `app/api/release-order/route.ts`
- `app/api/create-drop/route.ts`
- `app/api/seller/settings/route.ts`
- etc.

**Detail:** None of the API endpoints implement CSRF tokens. The seller session cookie uses `sameSite: "lax"` (`lib/auth.ts` not in this file — actually set in `app/api/seller/login/route.ts:66`), which prevents most cross-site POST attacks from third-party sites. However, `sameSite: "lax"` does NOT protect against:
- Same-site subdomain attacks
- Top-level navigation-based POSTs (form submissions)
- Older browsers that don't support SameSite

No CSRF token header or double-submit cookie pattern is implemented.

**Severity:** HIGH — Potential for cross-site request forgery on seller/admin endpoints.

---

### SEC-02 [HIGH] Session Tokens Have No Server-Side Revocation

**Files:**
- `lib/auth.ts:55-60` — `createSellerSessionToken` creates a self-contained signed token
- `lib/auth.ts:62-81` — `isValidSellerSession` only checks signature + expiry

**Detail:** The seller session is a stateless signed token with no server-side session store. Once issued, a session token is valid until it expires (12 hours, `lib/auth.ts:4`). There is no way to:
- Force-logout a compromised session
- Revoke all sessions for a user
- Implement session rotation
- Track active sessions

**Severity:** HIGH — No session revocation; compromised tokens are valid for full TTL.

---

### SEC-03 [MEDIUM] Error Messages Leak Internal State

**Files:**
- `app/api/create-order/route.ts:89` — `error.message` returned raw
- `app/api/pay-balance/route.ts:85` — `error.message` returned raw

**Detail:** The catch blocks return `error.message` directly to the client. This can leak:
- DB error details (relation names, constraint names)
- Stripe error details (API key fragments, account IDs)
- Internal logic state ("Size is sold out", "Selected size not found")

**Severity:** MEDIUM — Information disclosure; aids reconnaissance.

---

### SEC-04 [MEDIUM] No Content-Type Validation on JSON Endpoints

**Files:** All route handlers (create-order, pay-balance, release-order, etc.)

**Detail:** Every route handler calls `request.json()` without first checking `request.headers.get("content-type")`. If a client sends `text/plain` or `multipart/form-data`, the behavior depends on the runtime and may produce confusing errors or unexpected parsing.

**Severity:** MEDIUM — Missing input validation on request format.

---

### SEC-05 [MEDIUM] `customerPhone` Is Optional → Fraud Controls Can't Depend On It

**File:** `app/api/create-order/route.ts:16` — `customerPhone: z.string().optional()`

**Detail:** The `create-order` schema marks `customerPhone` as optional. Even if `maxOrdersPerPhonePerDrop` were enforced (FRD-01), an attacker can simply omit the phone field entirely and bypass the check. A `NULL` phone would never match any existing phone count.

**Severity:** MEDIUM — Phone-based fraud controls are structurally bypassable.

---

### SEC-06 [LOW] No Audit Logging

**Files:** All routes and `lib/domain.ts`

**Detail:** There is no audit trail for:
- Order creation (who, when, what drop)
- Payment success/failure
- Seller login/logout
- Settings changes
- Order cancellation

No structured logging, no audit table, no event sourcing.

**Severity:** LOW — Operational/debugging gap; compliance risk.

---

### SEC-07 [LOW] Stripe Webhook Raw Body Parsing Risk

**File:** `app/api/stripe/webhook/route.ts:9`

**Detail:** The webhook handler reads the raw body with `request.text()` (line 9). Next.js App Router route handlers may have already consumed or modified the body if any middleware or body parser ran first. The `stripe.webhooks.constructEvent` call on line 20 requires the exact raw body bytes for signature verification. If Next.js or any middleware parses the body before this handler, signature verification will fail. This is a known Next.js + Stripe webhook footgun.

**Severity:** LOW — Currently works; fragile to middleware changes.

---

## DATABASE / SCHEMA GAPS

### DB-01 [MEDIUM] Missing Index on `Payment.orderId`

**File:** `prisma/schema.prisma:175-194`

**Detail:** The `Payment` model has `@@index([tenantId, createdAt])` but **no index on `orderId`**. The webhook handler frequently needs to look up payments by order, and `pay-balance` flow would benefit from it. Without this index, every order-payment join becomes a sequential scan on the `payments` table.

**Severity:** MEDIUM — Performance degradation at scale.

---

### DB-02 [MEDIUM] Missing Index on `Order(tenantId, status)`

**File:** `prisma/schema.prisma:170-171`

**Detail:** Existing indexes are `@@index([tenantId, createdAt])` and `@@index([dropId, status])`. The `sellerStats` query (domain.ts:171) filters by `tenantId, dropId, status` — the `[dropId, status]` index partially helps but doesn't cover the `tenantId` filter. A `@@index([tenantId, status])` would speed up many seller dashboard queries.

**Severity:** MEDIUM — Query performance gap.

---

### DB-03 [LOW] No UNIQUE Constraint on `Customer(tenantId, email)`

**File:** `prisma/schema.prisma:132-146`

**Detail:** The `Customer` model has `@@index([tenantId, email])` (line 143) but no UNIQUE constraint. The `createOrderWithDeposit` function (domain.ts:48-59) does an upsert-like pattern (findFirst → update or create), but this is not atomic. Two concurrent orders from the same email could create duplicate `Customer` records.

**Severity:** LOW — Potential duplicate customer records under race conditions.

---

### DB-04 [LOW] `stripePaymentIntentId` Unique Constraint May Be NULL-Unsafe

**File:** `prisma/schema.prisma:191` — `@@unique([stripePaymentIntentId])`

**Detail:** In PostgreSQL, a UNIQUE constraint on a nullable column allows multiple NULLs (NULL ≠ NULL in SQL). This is correct behavior for pending payments that haven't been linked to Stripe yet. However, if a bug creates multiple payments with `stripePaymentIntentId = null` for the same order, there's no way to know which one is "real" until a webhook arrives.

**Severity:** LOW — Theoretical; current flow should prevent this.

---

## WEBHOOK GAPS

### WHK-01 [HIGH] No Webhook Idempotency Key Storage

**File:** `app/api/stripe/webhook/route.ts:27-147`

**Detail:** The webhook handler checks `payment.status === PaymentStatus.succeeded` (line 45) as a form of idempotency, but this is not a true idempotency guard. Stripe sends an `idempotency_key` with each event. The handler does not store received event IDs and does not check for duplicates. If Stripe retries a webhook (which it does up to 3 days), and the payment status check is somehow bypassed (race condition, manual DB change), duplicate processing occurs. More critically, the idempotency check at line 45 is a READ then WRITE — two concurrent webhook deliveries could both pass the check.

**Severity:** HIGH — Duplicate webhook processing risk; no event deduplication table.

---

### WHK-02 [MEDIUM] `payment_intent.canceled` Handler Doesn't Update Payment Record

**File:** `app/api/stripe/webhook/route.ts:118-143`

**Detail:** The `payment_intent.canceled` handler cancels the order and releases inventory, but it does **not** update the `Payment` record status to `failed`. Compare with `payment_intent.payment_failed` (lines 87-93) which does update the payment status. This leaves the payment row as `pending` even though the PaymentIntent was canceled.

**Severity:** MEDIUM — Data inconsistency; payment status doesn't reflect reality.

---

### WHK-03 [MEDIUM] Missing Refund/Dispute Webhook Handlers

**File:** `app/api/stripe/webhook/route.ts:27-147`

**Detail:** The webhook switch statement has no cases for:
- `charge.refunded` — inventory should be returned, order status updated
- `charge.dispute.created` — seller should be notified, funds may be held
- `charge.dispute.closed` — final resolution

**Severity:** MEDIUM — No automated response to refunds or disputes.

---

## ADDITIONAL GAPS

### ADDL-01 [LOW] Public Order ID Collision Retry Is Fragile

**File:** `lib/domain.ts:67-90`

**Detail:** The order creation retries up to 3 times on P2002 (unique constraint violation for `publicOrderId`). The ID uses `crypto.randomBytes(5).toString("hex")` which is 10 hex chars (40 bits). At 3 retries, the collision probability is low but not zero. A simpler approach would be to use a longer random value or a deterministic increment.

**Severity:** LOW — Unlikely to manifest; well-handled with retry.

---

### ADDL-02 [LOW] `DepositAmount` Could Be Zero

**File:** `app/api/create-drop/route.ts:12` — `depositAmount: z.coerce.number().positive()`

**Detail:** The schema requires `depositAmount > 0` (positive). This is correct. However, nothing stops a seller from setting `depositAmount` equal to `fullPrice`, effectively making it a full-price order. The `allowFullPrice` setting on `SellerSetting` (schema.prisma:244) is never checked in the create-order flow to enforce whether full-price orders are allowed.

**Severity:** LOW — Configuration not enforced; may confuse customer experience.

---

## SUMMARY TABLE

| ID      | Category          | Severity | Description                                      |
|---------|-------------------|----------|--------------------------------------------------|
| PAY-01  | Payment           | CRITICAL | No idempotency keys on Stripe PaymentIntents     |
| PAY-02  | Payment           | CRITICAL | Inventory reserved before PaymentIntent; no rollback |
| PAY-03  | Payment           | HIGH     | Duplicate balance payments possible              |
| PAY-04  | Payment           | MEDIUM   | Webhook processing is non-transactional          |
| PAY-05  | Payment           | MEDIUM   | Missing `payment_intent.processing` webhook      |
| PAY-06  | Payment           | LOW      | No Stripe outage retry path                      |
| PAY-07  | Payment           | LOW      | No partial capture support                       |
| FRD-01  | Fraud Prevention  | CRITICAL | `maxOrdersPerPhonePerDrop` never enforced        |
| FRD-02  | Fraud Prevention  | HIGH     | Phone format bypass via no normalization         |
| FRD-03  | Fraud Prevention  | HIGH     | No rate limiting on create-order                 |
| FRD-04  | Fraud Prevention  | MEDIUM   | No reservation TTL for abandoned checkouts       |
| FRD-05  | Fraud Prevention  | MEDIUM   | No `depositOpensAt` enforcement                  |
| FRD-06  | Fraud Prevention  | MEDIUM   | In-memory brute-force protection                 |
| INV-01  | Inventory         | CRITICAL | Inventory leak on Stripe failure                 |
| INV-02  | Inventory         | CRITICAL | No auto-release of `pending_payment` reservations |
| INV-03  | Inventory         | HIGH     | Edit-drop allows totalInventory below reserved + sold |
| INV-04  | Inventory         | HIGH     | Cancelling deposit_paid order: no refund         |
| INV-05  | Inventory         | HIGH     | Concurrent cancel race condition                 |
| INV-06  | Inventory         | MEDIUM   | No CHECK constraint on DropSize inventory        |
| INV-07  | Inventory         | MEDIUM   | Inventory moved to sold before payment confirmed |
| INV-08  | Inventory         | LOW      | No visibility into stuck pending_payment orders  |
| SEC-01  | Security          | HIGH     | No CSRF protection                               |
| SEC-02  | Security          | HIGH     | No server-side session revocation                |
| SEC-03  | Security          | MEDIUM   | Error messages leak internal state               |
| SEC-04  | Security          | MEDIUM   | No Content-Type validation                       |
| SEC-05  | Security          | MEDIUM   | customerPhone optional → bypasses phone controls |
| SEC-06  | Security          | LOW      | No audit logging                                 |
| SEC-07  | Security          | LOW      | Webhook body parsing fragility                   |
| DB-01   | Database          | MEDIUM   | Missing index on Payment.orderId                 |
| DB-02   | Database          | MEDIUM   | Missing composite index for stats queries        |
| DB-03   | Database          | LOW      | No UNIQUE on Customer(tenantId, email)           |
| DB-04   | Database          | LOW      | Stripe PI ID unique constraint NULL semantics    |
| WHK-01  | Webhook           | HIGH     | No event idempotency key storage                 |
| WHK-02  | Webhook           | MEDIUM   | payment_intent.canceled doesn't update payment   |
| WHK-03  | Webhook           | MEDIUM   | Missing refund/dispute handlers                  |
| ADDL-01 | Misc              | LOW      | Public order ID collision retry fragility        |
| ADDL-02 | Misc              | LOW      | allowFullPrice setting not enforced              |

**Total:** 35 gaps — 5 CRITICAL, 11 HIGH, 14 MEDIUM, 5 LOW
