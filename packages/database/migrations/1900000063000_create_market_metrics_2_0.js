/**
 * TUF Ops 2.0 — Wave 4A: the `market_metrics` Drops OS cache.
 * =============================================================================
 *
 * Governing principle (DROPS_CONTRACT.md §1, R8 FINAL 2026-10-03):
 *
 *   Drops OS is the system of record for consumer commerce. TUF Ops is a reader,
 *   never a writer. If TUF Ops cannot read Drops, it shows what it last knew and
 *   says so — it never invents a number and never blanks the screen.
 *
 * `market_metrics` is a CACHE, not a system of record (DROPS_CONTRACT §5.1). It
 * holds exactly the summarized operational/commerce/attribution fields frozen by
 * R8 (§4.2–§4.6) for a single Drops collection, keyed by the Drops identifiers
 * stored on `lettered_deployments` (§4.1). It stores SUMMARY NUMBERS only.
 *
 * HARD INVARIANTS (asserted by the Wave-4A proof suite):
 *   - NO LINE ITEMS. There is no column for an order, order item, product,
 *     customer, payment token or per-order attribution (R8 §7 non-goals #1–#5).
 *   - Keyed by `(drops_organization_id, drops_collection_id)` — UNIQUE (§5.2).
 *   - `last_sync_at` advances ONLY on a successful read; a failed poll leaves the
 *     snapshot UNCHANGED and does not advance it (§5.3 / §6).
 *   - `order_count = 0` ⇒ `aov` is NULL, never `0` presented as real (§4.3 #8,
 *     GATE0 "zero rows ⇒ zero numbers").
 *   - `aov_provenance` records whether AOV was as-reported by Drops or derived by
 *     TUF Ops (the only value TUF Ops may derive is the AOV fallback, §5.4).
 *   - `market_id` / `lettered_deployment_id` are soft TUF-side references for
 *     routing; the Drops key is the identity Drops responses are matched against.
 *
 * Forward-only. Creates NO rows: the cache is populated only by a read of Drops
 * (the read-only Drops client) — never by this migration and never by a seed.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('market_metrics', {
    id: 'id',

    // --- TUF-side soft references (routing/discovery only; not the Drops key) ---
    market_id: {
      type: 'integer',
      notNull: true,
      references: 'markets',
      onDelete: 'RESTRICT',
    },
    lettered_deployment_id: {
      type: 'integer',
      references: 'lettered_deployments',
      onDelete: 'SET NULL',
    },

    // --- Drops key (DROPS_CONTRACT §5.2) — opaque text, Drops id type UNKNOWN ---
    drops_organization_id: { type: 'text', notNull: true },
    drops_collection_id: { type: 'text', notNull: true },
    drops_drop_id: { type: 'text' },

    // --- §4.2 operational / lifecycle (cached) ---
    store_url: { type: 'text' },
    store_status: { type: 'varchar(64)' },
    lifecycle_status: { type: 'varchar(64)' },
    published_at: { type: 'timestamptz' },

    // --- §4.3 commerce SUMMARY (nullable when Drops has not reported) ---
    order_count: { type: 'integer' },
    revenue: { type: 'numeric(14,2)' },
    aov: { type: 'numeric(14,2)' },
    aov_provenance: { type: 'varchar(16)', notNull: true, default: 'REPORTED' },
    first_order_at: { type: 'timestamptz' },

    // --- §4.4 attribution summary (bounded jsonb; never per-order rows) ---
    utm_summary: { type: 'jsonb' },
    referral_summary: { type: 'jsonb' },

    // --- §4.5 fulfillment / production summary (bounded jsonb; never line items) ---
    fulfillment_summary: { type: 'jsonb' },

    // --- §4.6 sync bookkeeping (TUF-owned clock) ---
    last_sync_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // One snapshot per Drops key (latest wins; no history in MVP — §5.2).
  pgm.addConstraint('market_metrics', 'market_metrics_drops_key_unique', {
    unique: ['drops_organization_id', 'drops_collection_id'],
  });

  // Aggregate counts are never negative.
  pgm.addConstraint('market_metrics', 'market_metrics_order_count_check', {
    check: 'order_count IS NULL OR order_count >= 0',
  });
  pgm.addConstraint('market_metrics', 'market_metrics_revenue_check', {
    check: 'revenue IS NULL OR revenue >= 0',
  });
  pgm.addConstraint('market_metrics', 'market_metrics_aov_check', {
    check: 'aov IS NULL OR aov >= 0',
  });

  // §5.4 provenance vocabulary (only the AOV fallback is ever DERIVED).
  pgm.addConstraint('market_metrics', 'market_metrics_aov_provenance_check', {
    check: "aov_provenance IN ('REPORTED', 'DERIVED')",
  });

  // Invariant #6: order_count = 0 ⇒ aov is NULL, never 0 as-if-real.
  pgm.addConstraint('market_metrics', 'market_metrics_zero_orders_no_aov', {
    check: 'NOT (order_count = 0 AND aov IS NOT NULL)',
  });

  pgm.createIndex('market_metrics', 'market_id');
  pgm.createIndex('market_metrics', 'lettered_deployment_id');
  pgm.createIndex('market_metrics', 'drops_organization_id');
};

exports.down = (pgm) => {
  pgm.dropTable('market_metrics');
};
