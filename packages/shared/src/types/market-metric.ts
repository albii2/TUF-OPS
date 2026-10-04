/**
 * TUF Ops 2.0 — `MarketMetric` (plan §2.1; R8 FINAL 2026-10-03).
 *
 * The cached Drops OS commerce/attribution snapshot. Drops OS is authoritative
 * for LETTERED collections, products, storefronts, checkout, consumer orders,
 * payments and fulfillment. TUF Ops stores ONLY summarized operational /
 * commerce / attribution information required to operate a Market.
 *
 * R8 field set (verbatim):
 *   drops_organization_id
 *   drops_collection_id / drop_id
 *   store_url
 *   store / lifecycle_status
 *   published_at
 *   order_count
 *   revenue
 *   AOV
 *   first_order_at
 *   UTM / referral summary
 *   production / fulfillment summary
 *   last_sync_at
 *
 * HARD RULE: NO LINE ITEMS. No consumer orders, order items or products are
 * duplicated into TUF Ops (R8: "Do not duplicate consumer orders into TUF
 * Ops"). The cache holds aggregates only.
 */

/** UTM / referral summary — aggregate attribution only, no per-order rows. */
export interface UtmReferralSummary {
  /** Primary source, e.g. `'facebook'`. */
  source?: string | null;
  /** Primary medium, e.g. `'social'`. */
  medium?: string | null;
  /** Campaign identifier where present. */
  campaign?: string | null;
  /** Top referrers as (referrer, count) aggregates. */
  topReferrers?: ReadonlyArray<{ referrer: string; count: number }>;
  /** Total attributed orders covered by the summary. */
  attributedOrderCount?: number | null;
}

/**
 * Production / fulfillment summary — aggregate counts only, "where
 * operationally useful" (R8). No individual order or line-item detail.
 */
export interface ProductionFulfillmentSummary {
  unitsOrdered?: number | null;
  unitsFulfilled?: number | null;
  unitsPending?: number | null;
  /** Aggregate fulfillment status, e.g. `'PARTIAL'`. */
  fulfillmentStatus?: string | null;
  lastFulfilledAt?: string | null;
}

/**
 * A cached Drops OS snapshot for a LETTERED deployment, keyed by the Drops
 * identifiers stored on `LetteredDeployment`.
 */
export interface MarketMetric {
  /**
   * Drops organization id (R8 `drops_organization_id`). Cache key.
   */
  dropsOrganizationId: string;

  /**
   * Drops collection id (R8 `drops_collection_id`). Cache key, alongside
   * `dropsOrganizationId`.
   */
  dropsCollectionId?: string | null;

  /**
   * Drops drop id (R8 `drop_id`), where distinct from the collection.
   */
  dropId?: string | null;

  /**
   * Storefront URL (R8 `store_url`).
   */
  storeUrl?: string | null;

  /**
   * Store status (R8 `store`), e.g. `'PUBLISHED'`.
   */
  storeStatus?: string | null;

  /**
   * Store lifecycle status (R8 `lifecycle_status`).
   */
  lifecycleStatus?: string | null;

  /**
   * Publication timestamp of the store/collection (R8 `published_at`).
   */
  publishedAt?: string | null;

  /**
   * Aggregate order count (R8 `order_count`).
   */
  orderCount: number;

  /**
   * Aggregate revenue (R8 `revenue`), whole currency units.
   */
  revenue: number;

  /**
   * Average order value (R8 `AOV`), whole currency units.
   */
  aov: number;

  /**
   * Timestamp of the first legitimate order (R8 `first_order_at`). Drives the
   * 1 / 10 / 25 milestone automations (plan §2.5).
   */
  firstOrderAt?: string | null;

  /**
   * UTM / referral summary (R8).
   */
  utmSummary?: UtmReferralSummary | null;

  /**
   * Production / fulfillment summary (R8), where operationally useful.
   */
  productionSummary?: ProductionFulfillmentSummary | null;

  /**
   * When this snapshot was last pulled from Drops (R8 `last_sync_at`).
   */
  lastSyncAt: string;

  /**
   * TUF-side linkage (not a Drops field): the Market this snapshot is for.
   */
  marketId?: number | null;

  /**
   * TUF-side linkage (not a Drops field): the LetteredDeployment this
   * snapshot is for.
   */
  letteredDeploymentId?: number | null;

  // NO LINE ITEMS. Any per-order / per-item field is forbidden here.
}
