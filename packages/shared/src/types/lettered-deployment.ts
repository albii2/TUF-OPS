/**
 * TUF Ops 2.0 — `LetteredDeployment` (plan §2.1, §2.3; R8).
 *
 * LETTERED is its own lifecycle — NOT a conventional opportunity. Drops OS
 * stays authoritative for LETTERED consumer commerce (collections, products,
 * storefronts, checkout, orders, payments, fulfillment). TUF Ops stores only
 * Drops identifiers/references and reads summarized metrics
 * (`MarketMetric`, `./market-metric.js`) — never line items (R8).
 */

import type { CommonFields } from './common-fields.js';
import type { MarketPriority } from './market.js';

/**
 * LETTERED Lifecycle — plan §2.3, verbatim:
 *
 *   IDENTIFIED → QUALIFIED → RIGHTS_PATH → COLLECTION_CONCEPT → COLLECTION_READY
 *              → STORE_DRAFT → ASSETS_READY → COMMERCE_QA → LAUNCH_READY
 *              → INSTITUTIONAL_FIRST_LOOK → DECISION_GATE → COLLABORATIVE | COMMUNITY
 *              → MARKET_SEEDING → LIVE → FIRST_ORDER → TEN_ORDERS
 *              → TWENTY_FIVE_ORDERS → SCALE → DROP_002
 *              (+ BLOCKED, PAUSED, KILLED)
 */
export enum LetteredState {
  IDENTIFIED = 'IDENTIFIED',
  QUALIFIED = 'QUALIFIED',
  RIGHTS_PATH = 'RIGHTS_PATH',
  COLLECTION_CONCEPT = 'COLLECTION_CONCEPT',
  COLLECTION_READY = 'COLLECTION_READY',
  STORE_DRAFT = 'STORE_DRAFT',
  ASSETS_READY = 'ASSETS_READY',
  COMMERCE_QA = 'COMMERCE_QA',
  LAUNCH_READY = 'LAUNCH_READY',
  INSTITUTIONAL_FIRST_LOOK = 'INSTITUTIONAL_FIRST_LOOK',
  DECISION_GATE = 'DECISION_GATE',
  COLLABORATIVE = 'COLLABORATIVE',
  COMMUNITY = 'COMMUNITY',
  MARKET_SEEDING = 'MARKET_SEEDING',
  LIVE = 'LIVE',
  FIRST_ORDER = 'FIRST_ORDER',
  TEN_ORDERS = 'TEN_ORDERS',
  TWENTY_FIVE_ORDERS = 'TWENTY_FIVE_ORDERS',
  SCALE = 'SCALE',
  DROP_002 = 'DROP_002',
  BLOCKED = 'BLOCKED',
  PAUSED = 'PAUSED',
  KILLED = 'KILLED',
}

/**
 * The LETTERED main-chain lifecycle (excluding the three interruption states)
 * in the exact plan §2.3 order. DECISION_GATE branches into COLLABORATIVE |
 * COMMUNITY, which both converge on MARKET_SEEDING.
 *
 * NOTE: plan §2.3 and deliverable text label this "19 states", but the
 * verbatim enumerated list contains 20 main-chain states. This constant is
 * the verbatim list (20); the "19" label is treated as a miscount.
 */
export const LETTERED_LIFECYCLE_STATES: readonly LetteredState[] = [
  LetteredState.IDENTIFIED,
  LetteredState.QUALIFIED,
  LetteredState.RIGHTS_PATH,
  LetteredState.COLLECTION_CONCEPT,
  LetteredState.COLLECTION_READY,
  LetteredState.STORE_DRAFT,
  LetteredState.ASSETS_READY,
  LetteredState.COMMERCE_QA,
  LetteredState.LAUNCH_READY,
  LetteredState.INSTITUTIONAL_FIRST_LOOK,
  LetteredState.DECISION_GATE,
  LetteredState.COLLABORATIVE,
  LetteredState.COMMUNITY,
  LetteredState.MARKET_SEEDING,
  LetteredState.LIVE,
  LetteredState.FIRST_ORDER,
  LetteredState.TEN_ORDERS,
  LetteredState.TWENTY_FIVE_ORDERS,
  LetteredState.SCALE,
  LetteredState.DROP_002,
];

/**
 * The full LETTERED lifecycle: the main chain followed by the three
 * interruption states (BLOCKED, PAUSED, KILLED).
 */
export const LETTERED_STATES: readonly LetteredState[] = [
  ...LETTERED_LIFECYCLE_STATES,
  LetteredState.BLOCKED,
  LetteredState.PAUSED,
  LetteredState.KILLED,
];

/**
 * A LetteredDeployment — LETTERED's own lifecycle, nested under a Market and
 * NOT a RevenueOpportunity. Drops identifiers are stored here (R8); Drops OS
 * remains the system of record for the consumer commerce behind them.
 */
export interface LetteredDeployment
  extends CommonFields<LetteredState, MarketPriority> {
  id: number;

  /** The Market this deployment belongs to (references `markets.id`). */
  marketId: number;

  /** Denormalized market number for display. Optional. */
  marketNumber?: number | null;

  /**
   * Drops OS organization id (R8). The cache key for `MarketMetric`.
   */
  dropsOrganizationId: string | null;

  /**
   * Drops OS collection id (R8). The cache key for `MarketMetric`, alongside
   * `dropsOrganizationId`.
   */
  dropsCollectionId: string | null;

  /**
   * Drops OS storefront URL for this deployment (R8), e.g.
   * `/schools/<school>/<collection>`.
   */
  storefrontUrl: string | null;

  /**
   * Optional Drops `drop_id` where the contract distinguishes a drop from a
   * collection (R8 lists `drops_collection_id / drop_id`).
   */
  dropsDropId?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}
