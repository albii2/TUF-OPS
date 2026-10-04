/**
 * TUF Ops 2.0 — Wave 1 spine: the `markets` activation gate (ADR-001, Option 2).
 * =============================================================================
 *
 * Governing principle (ADR-001 §5, ACTIVATE_MARKET_SPEC):
 *   Knowing a school exists does not make it a Market. A Market represents an
 *   intentional allocation of TUF resources.
 *
 * What this migration establishes:
 *   - `markets`        the ONLY operational source of Market attention.
 *   - `market_number_seq`  a PostgreSQL SEQUENCE that allocates `market_number`
 *                      concurrency-safely (ACTIVATE_MARKET_SPEC §5, Option A).
 *                      Sequences never hand out a duplicate; gaps are accepted.
 *   - `market_tasks`      the 2.0 Task. Activation materialises the initial Task
 *                      from next_action/next_action_due ("NO MARKET SITS WAITING").
 *   - `market_activities` an append-only 2.0 Activity; activation writes exactly
 *                      one ACTIVATION event. Named `market_activities` because the
 *                      legacy, organization-keyed `activities` table belongs to the
 *                      retired 1.0 domain and must not be overloaded.
 *
 * Constraints that make the activation contract unbreakable at the DB layer:
 *   - market_number               integer NOT NULL UNIQUE   (never reused)
 *   - universe_organization_id    integer NOT NULL UNIQUE   (one activation per school)
 *   - owner_id                    integer NOT NULL REFERENCES users(id)
 *   - objective                   text    NOT NULL
 *   - next_action                 text    NOT NULL  ("NO MARKET SITS WAITING")
 *   - next_action_due             timestamptz NOT NULL
 *   - activated_at                timestamptz NOT NULL DEFAULT now()  (provenance)
 *   - priority / state            CHECK-constrained to the canonical enums
 *
 * Every 2.0 operational entity keys to markets.id, NEVER organizations.id.
 * `organizations` remains the read-only Market Universe (intelligence only).
 *
 * Forward-only. This migration creates NO rows: importing/creating an
 * organization is inert, and the three launch markets are produced by the
 * Commander-gated seed (packages/database/seed_markets_2_0.js), never here.
 */

exports.shorthands = undefined;

// Mirrors the canonical enums in packages/shared/src/types/market.ts. Kept as
// literals so the migration is self-contained and cannot drift silently from a
// shared-package build.
const MARKET_STATES = [
  'IDENTIFIED',
  'QUALIFIED',
  'DEVELOPMENT',
  'LAUNCH_READY',
  'PENETRATION',
  'ACTIVE',
  'EXPANSION',
  'MATURE',
  'BLOCKED',
  'PAUSED',
  'KILLED',
];

const MARKET_PRIORITIES = ['TIER_1', 'TIER_2', 'TIER_3'];

const sqlList = (values) => values.map((value) => `'${value}'`).join(', ');

exports.up = (pgm) => {
  // --- market_number allocation: concurrency-safe by construction (Option A) ---
  pgm.createSequence('market_number_seq', { start: 1, increment: 1 });

  // --- the single activation gate ---
  pgm.createTable('markets', {
    id: 'id',
    market_number: {
      type: 'integer',
      notNull: true,
      unique: true,
      default: pgm.func("nextval('market_number_seq')"),
    },
    universe_organization_id: {
      type: 'integer',
      notNull: true,
      unique: true,
      references: 'organizations',
      onDelete: 'RESTRICT',
    },
    owner_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'RESTRICT',
    },
    priority: { type: 'varchar(16)', notNull: true },
    objective: { type: 'text', notNull: true },
    next_action: { type: 'text', notNull: true },
    next_action_due: { type: 'timestamptz', notNull: true },
    state: { type: 'varchar(32)', notNull: true, default: 'IDENTIFIED' },
    activated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    blocker: { type: 'text' },
    last_activity_at: { type: 'timestamptz' },
    source: { type: 'varchar(64)' },
    created_by: { type: 'integer' },
    updated_by: { type: 'integer' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('markets', 'markets_priority_check', {
    check: `priority IN (${sqlList(MARKET_PRIORITIES)})`,
  });
  pgm.addConstraint('markets', 'markets_state_check', {
    check: `state IN (${sqlList(MARKET_STATES)})`,
  });

  pgm.createIndex('markets', 'state');
  pgm.createIndex('markets', 'owner_id');
  pgm.createIndex('markets', 'next_action_due');

  // --- the initial Task materialised by activation ---
  pgm.createTable('market_tasks', {
    id: 'id',
    market_id: {
      type: 'integer',
      notNull: true,
      references: 'markets',
      onDelete: 'CASCADE',
    },
    title: { type: 'text', notNull: true },
    due_at: { type: 'timestamptz', notNull: true },
    state: { type: 'varchar(16)', notNull: true, default: 'OPEN' },
    source: { type: 'varchar(64)', notNull: true, default: 'ACTIVATION' },
    created_by: { type: 'integer' },
    completed_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('market_tasks', 'market_tasks_state_check', {
    check: "state IN ('OPEN', 'DONE', 'CANCELLED')",
  });
  pgm.createIndex('market_tasks', 'market_id');

  // --- append-only activation Activity ---
  pgm.createTable('market_activities', {
    id: 'id',
    market_id: {
      type: 'integer',
      notNull: true,
      references: 'markets',
      onDelete: 'CASCADE',
    },
    type: { type: 'varchar(64)', notNull: true },
    source: { type: 'varchar(64)', notNull: true, default: 'ACTIVATION' },
    actor_id: { type: 'integer' },
    detail: { type: 'text' },
    occurred_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('market_activities', 'market_id');
};

exports.down = (pgm) => {
  pgm.dropTable('market_activities');
  pgm.dropTable('market_tasks');
  pgm.dropTable('markets');
  pgm.dropSequence('market_number_seq');
};
