/**
 * TUF Ops 2.0 — Wave 5A: the deterministic Task engine schema (forward-only).
 * =============================================================================
 *
 * Wave 1 (1900000060000_create_markets_2_0.js) already created `market_tasks`
 * and `market_activities`. This migration is ADDITIVE ONLY: it does not create a
 * duplicate task table, and it never edits an applied migration.
 *
 * What it adds, and why:
 *   - `task_key`  a deterministic identifier for the task a state transition
 *                 generated, e.g. `MARKET:DEVELOPMENT` or `LETTERED:12:LIVE`.
 *                 It is the idempotency key: re-running the SAME transition
 *                 while the generated task is still OPEN must NOT duplicate it.
 *   - `priority`  the priority of the task, carried from the declarative task
 *                 template (ADR-001 §5 common fields carry priority).
 *
 * The idempotency guarantee is enforced at the DATABASE layer by a PARTIAL
 * UNIQUE index — unique on (market_id, task_key) ONLY for rows that are still
 * OPEN. That means:
 *   - re-running a transition while its task is OPEN  -> blocked (no duplicate);
 *   - a genuinely NEW cycle later (previous task DONE) -> allowed (new row).
 * A NULL `task_key` (legacy/edge rows) is never constrained.
 *
 * Also adds an index supporting the COMMAND "what needs to be done today" read,
 * which scans OPEN tasks ordered by due date.
 *
 * Forward-only. No rows are created or modified by this migration.
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // --- additive columns on the existing Wave-1 task table ---
  pgm.addColumns('market_tasks', {
    task_key: { type: 'varchar(160)' }, // deterministic idempotency key
    priority: { type: 'varchar(16)' }, // carried from the task template
  });

  // --- idempotency, enforced by the database (partial UNIQUE) ---
  // Only OPEN tasks are deduplicated, so a completed task never blocks the
  // generation of the next legitimate task in a later cycle.
  pgm.createIndex('market_tasks', ['market_id', 'task_key'], {
    name: 'market_tasks_open_task_key_uniq',
    unique: true,
    where: "task_key IS NOT NULL AND state = 'OPEN'",
  });

  // --- COMMAND read support: OPEN tasks by due date ---
  pgm.createIndex('market_tasks', ['state', 'due_at'], {
    name: 'market_tasks_state_due_at_idx',
  });
};

exports.down = (pgm) => {
  pgm.dropIndex('market_tasks', ['state', 'due_at'], {
    name: 'market_tasks_state_due_at_idx',
  });
  pgm.dropIndex('market_tasks', ['market_id', 'task_key'], {
    name: 'market_tasks_open_task_key_uniq',
  });
  pgm.dropColumns('market_tasks', ['task_key', 'priority']);
};
