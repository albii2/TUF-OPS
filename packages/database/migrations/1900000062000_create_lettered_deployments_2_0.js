/**
 * TUF Ops 2.0 — Wave 3A: the `lettered_deployments` spine.
 * =============================================================================
 *
 * Governing principle (ADR-001, DROPS_CONTRACT, plan §2.3):
 *   LETTERED is NOT a conventional B2B opportunity. It has its OWN lifecycle
 *   (IDENTIFIED → … → DROP_002, plus BLOCKED/PAUSED/KILLED). It is never a
 *   RevenueOpportunity (that engine supports TEAM_UNIFORMS and ISSUE only) and
 *   it does not use `opportunities.channel_type`.
 *
 * A `LetteredDeployment` belongs to a MARKET and is keyed to `markets.id` —
 * NEVER `organizations.id`. `organizations` stays the read-only Universe.
 *
 * Drops OS is the system of record for LETTERED consumer commerce. This table
 * stores ONLY the three references frozen by R8 / DROPS_CONTRACT.md §4.1 —
 * `drops_organization_id`, `drops_collection_id` (+ optional `drops_drop_id`)
 * and `storefront_url`. It stores NO products, NO orders, NO customers, NO
 * payments, NO line items. There is deliberately no consumer-commerce table.
 *
 * Constraints that make the lifecycle contract unbreakable at the DB layer:
 *   - market_id                   integer NOT NULL REFERENCES markets(id)
 *   - state                        varchar(32) NOT NULL, CHECK-constrained to the
 *                                  canonical 23-state LETTERED lifecycle
 *   - objective                    text NOT NULL
 *   - owner_id                     integer NOT NULL REFERENCES users(id)
 *   - priority                     varchar(16) NOT NULL, CHECK TIER_1|TIER_2|TIER_3
 *   - next_action                  text NOT NULL  ("NO MARKET SITS WAITING")
 *   - next_action_due              timestamptz NOT NULL
 *
 * Forward-only. Creates NO rows: the single Pillager LIVE deployment is written
 * by the idempotent Commander-gated seed (packages/database/seed_lettered_2_0.js).
 */

exports.shorthands = undefined;

// Mirrors the canonical LETTERED states in
// packages/shared/src/types/lettered-deployment.ts (LETTERED_STATES). Kept as
// literals so the migration is self-contained and cannot drift silently from a
// shared-package build.
const LETTERED_STATES = [
  'IDENTIFIED',
  'QUALIFIED',
  'RIGHTS_PATH',
  'COLLECTION_CONCEPT',
  'COLLECTION_READY',
  'STORE_DRAFT',
  'ASSETS_READY',
  'COMMERCE_QA',
  'LAUNCH_READY',
  'INSTITUTIONAL_FIRST_LOOK',
  'DECISION_GATE',
  'COLLABORATIVE',
  'COMMUNITY',
  'MARKET_SEEDING',
  'LIVE',
  'FIRST_ORDER',
  'TEN_ORDERS',
  'TWENTY_FIVE_ORDERS',
  'SCALE',
  'DROP_002',
  'BLOCKED',
  'PAUSED',
  'KILLED',
];

const MARKET_PRIORITIES = ['TIER_1', 'TIER_2', 'TIER_3'];

const sqlList = (values) => values.map((value) => `'${value}'`).join(', ');

exports.up = (pgm) => {
  pgm.createTable('lettered_deployments', {
    id: 'id',
    market_id: {
      type: 'integer',
      notNull: true,
      references: 'markets',
      onDelete: 'RESTRICT',
    },
    state: { type: 'varchar(32)', notNull: true, default: 'IDENTIFIED' },
    objective: { type: 'text', notNull: true },
    owner_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'RESTRICT',
    },
    priority: { type: 'varchar(16)', notNull: true },
    next_action: { type: 'text', notNull: true },
    next_action_due: { type: 'timestamptz', notNull: true },
    blocker: { type: 'text' },

    // --- Drops OS references ONLY (R8 / DROPS_CONTRACT §4.1). Opaque text. ---
    drops_organization_id: { type: 'text' },
    drops_collection_id: { type: 'text' },
    drops_drop_id: { type: 'text' },
    storefront_url: { type: 'text' },

    last_activity_at: { type: 'timestamptz' },
    source: { type: 'varchar(64)' },
    created_by: { type: 'integer' },
    updated_by: { type: 'integer' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('lettered_deployments', 'lettered_deployments_state_check', {
    check: `state IN (${sqlList(LETTERED_STATES)})`,
  });
  pgm.addConstraint('lettered_deployments', 'lettered_deployments_priority_check', {
    check: `priority IN (${sqlList(MARKET_PRIORITIES)})`,
  });

  pgm.createIndex('lettered_deployments', 'market_id');
  pgm.createIndex('lettered_deployments', 'state');
  pgm.createIndex('lettered_deployments', 'owner_id');
  pgm.createIndex('lettered_deployments', 'next_action_due');
  // One deployment per market per source is NOT constrained here (a market can
  // legitimately run several drops over time); the seed is idempotent by an
  // explicit existence check instead of a UNIQUE that would forbid that.
};

exports.down = (pgm) => {
  pgm.dropTable('lettered_deployments');
};
