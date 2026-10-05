/**
 * TUF Ops 2.0 — Drops OS integration contract (Wave 4A, S9 boundary).
 *
 * Governing principle (DROPS_CONTRACT.md §1):
 *   Drops OS is the system of record for consumer commerce. TUF Ops is a reader,
 *   never a writer. If TUF Ops cannot read Drops, it shows what it last knew and
 *   says so — it never invents a number and never blanks the screen.
 *
 * This file types EXACTLY the frozen R8 field set (§4). It does NOT widen it.
 * Anything a Drops response carries outside §4 is discarded by the adapter before
 * it is ever persisted (DROPS_CONTRACT §3.1, invariant #8). There are NO
 * line-item / order / product / customer / payment types here — by design
 * (§7 non-goals #1–#5).
 */

import type {
  UtmReferralSummary,
  ProductionFulfillmentSummary,
} from '@tuf/shared';

export type { UtmReferralSummary, ProductionFulfillmentSummary };
export type { DbClientLike, DbPoolLike } from '../markets/markets.interface.js';

/** The Drops key a read is scoped to (§4.1 #1/#2, opaque text). */
export interface DropsCollectionRef {
  dropsOrganizationId: string;
  dropsCollectionId: string;
  /** Optional drop id where distinct from the collection (§4.1 #2 alias). */
  dropsDropId?: string | null;
}

// --- Transport (§3.2). GET-only by construction: there is no method field. ---

export interface DropsHttpGetRequest {
  url: string;
  headers: Record<string, string>;
  timeoutMs: number;
}

export interface DropsHttpGetResponse {
  status: number;
  body: unknown;
}

/**
 * The injectable transport. Because the request shape carries no HTTP method,
 * an injected fake cannot widen the client beyond a read either — the client
 * only ever issues the one allowed verb.
 */
export type DropsTransport = (request: DropsHttpGetRequest) => Promise<DropsHttpGetResponse>;

/**
 * The §4.2–§4.5 field set a successful summary read yields. Every field is
 * nullable: Drops availability per field is UNKNOWN (§4 "Availability"), and a
 * value Drops did not report must NEVER become a fabricated `0` (§6 #3).
 */
export interface DropsCollectionSummary {
  storeUrl: string | null; // §4.2 #3 (stored on the deployment; echoed here)
  storeStatus: string | null; // §4.2 #4
  lifecycleStatus: string | null; // §4.2 #4b
  publishedAt: string | null; // §4.2 #5 (ISO-8601 → timestamptz)
  orderCount: number | null; // §4.3 #6 (aggregate only)
  revenue: number | null; // §4.3 #7 (as reported by Drops)
  aov: number | null; // §4.3 #8 (NULL when order_count = 0)
  aovProvenance: 'REPORTED' | 'DERIVED' | null; // §5.4 (only AOV may be derived)
  firstOrderAt: string | null; // §4.3 #9
  utmSummary: UtmReferralSummary | null; // §4.4 #10 (bounded)
  referralSummary: UtmReferralSummary | null; // §4.4 #10b (bounded)
  fulfillmentSummary: ProductionFulfillmentSummary | null; // §4.5 #11 (aggregate)
}

/** The cheap status projection (§3.1 op B). */
export interface DropsCollectionStatus {
  storeStatus: string | null;
  lifecycleStatus: string | null;
  publishedAt: string | null;
  storeUrl: string | null;
}

/**
 * Typed failure reasons (§3.2, §6). A non-2xx is ALWAYS a typed failure — never
 * partial data. These map to the cached+stale path, never an unhandled error.
 */
export type DropsReadFailureReason =
  | 'NOT_CONFIGURED' // no DROPS_BASE_URL / credential in the environment
  | 'TIMEOUT'
  | 'NETWORK'
  | 'HTTP_4XX' // auth/access/not-found — never retried
  | 'HTTP_5XX' // retried up to the cap, then failed
  | 'INVALID_SHAPE' // response did not match the frozen field shape
  | 'UNEXPECTED';

export interface DropsReadFailure {
  reason: DropsReadFailureReason;
  /** HTTP status where one was observed. */
  status?: number;
  /** Human-readable, credential-free diagnostic. */
  message: string;
  attempts: number;
}

/** Result envelope — success carries data, failure carries a typed reason. */
export type DropsReadResult<T> =
  | { ok: true; data: T; attempts: number }
  | { ok: false; failure: DropsReadFailure };

/** Reason codes for the cache/fetch service (machine-readable, stable). */
export type MarketMetricSyncReason =
  | 'OK'
  | 'NO_DEPLOYMENT' // the market has no LETTERED deployment with Drops refs
  | 'DROPS_READ_FAILED' // client returned a typed failure
  | 'PERSIST_FAILED'; // DB write failed

/** Outcome of a refresh (fetch + store). Never throws on a Drops failure. */
export interface MarketMetricRefreshResult {
  ok: boolean;
  reason: MarketMetricSyncReason;
  /** Present when a Drops read failed — carried through for logging/UI. */
  failure?: DropsReadFailure;
  /** True when the snapshot row was written/overwritten. */
  stored: boolean;
  lastSyncAt: string | null;
}

/**
 * The stale-marked view served to LETTERED COMMAND / the Market War-Board (§6).
 * `hasData=false` + `noDataYet=true` is the explicit "no data yet" empty state
 * (§6 #3) — it is NEVER a fabricated `0`.
 */
export interface CommerceMetricsView {
  marketId: number | null;
  marketNumber: number | null;
  letteredDeploymentId: number | null;
  dropsOrganizationId: string | null;
  dropsCollectionId: string | null;

  storeUrl: string | null;
  storeStatus: string | null;
  lifecycleStatus: string | null;
  publishedAt: string | null;

  orderCount: number | null;
  revenue: number | null;
  aov: number | null;
  aovProvenance: 'REPORTED' | 'DERIVED' | null;
  firstOrderAt: string | null;

  utmSummary: UtmReferralSummary | null;
  referralSummary: UtmReferralSummary | null;
  fulfillmentSummary: ProductionFulfillmentSummary | null;

  /** §4.6 — TUF-owned; null until the first successful sync. */
  lastSyncAt: string | null;

  /** §6 #2 — every Drops-sourced value is marked STALE when Drops is unreachable. */
  stale: boolean;
  staleReason: 'DROPS_UNREACHABLE' | 'WINDOW_EXCEEDED' | null;

  /** False ⇒ render the explicit "no data yet" state (§6 #3). */
  hasData: boolean;
  noDataYet: boolean;

  /** Typed reason when a refresh was attempted and failed (§6 #6). */
  refreshError: DropsReadFailureReason | null;
}
