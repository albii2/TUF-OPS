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

/**
 * TUF Ops 2.0 — Wave 4A additions (ADDITIVE; the `MarketMetric` shape above is
 * unchanged).
 *
 * DROPS_CONTRACT.md §5.3/§5.4 fixes two facts the base `MarketMetric` interface
 * does not express: a cached commerce value may be ABSENT (Drops did not report
 * it, or the key was never synced), and each value records its PROVENANCE. The
 * persisted cache row (`market_metrics`) is therefore the nullable snapshot
 * below, not the "all values known" `MarketMetric` above. Nothing here widens
 * the frozen R8 field set (§4); it only types NULL-vs-known and provenance.
 */

/**
 * Provenance of a cached commerce value (DROPS_CONTRACT §5.4). `REPORTED` is the
 * value Drops returned; `DERIVED` is a value TUF Ops computed — in MVP the ONLY
 * value TUF Ops ever derives is the AOV fallback (`revenue / order_count`).
 */
export type MarketMetricValueProvenance = 'REPORTED' | 'DERIVED';

/**
 * The persisted `market_metrics` cache snapshot for one Drops key. Summary
 * numbers only; a `null` commerce field means "Drops did not report this" — it
 * is rendered as "no data yet", never as `0` (DROPS_CONTRACT §6 #3, GATE0).
 *
 * HARD RULE: NO LINE ITEMS. There is no per-order / per-item field anywhere.
 */
export interface MarketMetricCacheSnapshot {
  /** Drops key part 1 (DROPS_CONTRACT §4.1 #1). */
  dropsOrganizationId: string;
  /** Drops key part 2 (DROPS_CONTRACT §4.1 #2). */
  dropsCollectionId: string;
  /** Optional Drops drop id where distinct from the collection. */
  dropsDropId?: string | null;

  /** TUF-side soft references (routing/discovery), not Drops fields. */
  marketId?: number | null;
  letteredDeploymentId?: number | null;

  /** §4.2 operational / lifecycle. */
  storeUrl?: string | null;
  storeStatus?: string | null;
  lifecycleStatus?: string | null;
  publishedAt?: string | null;

  /** §4.3 commerce — null means "not reported", never assumed zero. */
  orderCount?: number | null;
  revenue?: number | null;
  aov?: number | null;
  /** §5.4 — `REPORTED` unless the AOV fallback was used. */
  aovProvenance?: MarketMetricValueProvenance | null;
  firstOrderAt?: string | null;

  /** §4.4 attribution — bounded aggregate summaries only. */
  utmSummary?: UtmReferralSummary | null;
  referralSummary?: UtmReferralSummary | null;

  /** §4.5 fulfillment / production — aggregate only, never line items. */
  fulfillmentSummary?: ProductionFulfillmentSummary | null;

  /** §4.6 — TUF-owned; advances ONLY on a successful read. */
  lastSyncAt: string;
}
