/**
 * TUF Ops 2.0 — canonical common fields (plan §2.2).
 *
 * "Every active object carries: state · objective · owner · priority ·
 *  next_action · next_action_due · blocker · last_activity_at · source ·
 *  created_by · updated_by", enforced at schema level, not convention.
 *
 * CRITICAL invariant — "NO MARKET SITS WAITING":
 *   `nextAction` and `nextActionDue` are REQUIRED (non-optional). An object
 *   cannot exist without a next move. See ACTIVATE_MARKET_SPEC §2/§3.2, where
 *   `next_action` and `next_action_due` are NOT NULL at the database level.
 *
 * Field naming follows the repository's camelCase TypeScript convention; the
 * snake_case names in the plan/spec are the DB column names (e.g.
 * `next_action` -> `nextAction`).
 */

/**
 * Priority is domain-specific, so it is generic; the 2.0 entities reuse the
 * `MarketPriority` enum exported from `./market.js`.
 */
export type CommonPriority = string;

/**
 * Lifecycle state is domain-specific, so it is generic; each entity supplies
 * its own state enum (e.g. `MarketState`, `LetteredState`).
 */
export type CommonState = string;

export interface CommonFields<
  S extends string = string,
  P extends string = string,
> {
  /**
   * Lifecycle state. Domain enum (the entity's state machine). Required.
   */
  state: S;

  /**
   * What TUF intends to achieve with this object. Required.
   */
  objective: string;

  /**
   * The accountable person (references `users.id`). Plan §2.2 "owner".
   * Required — a Market cannot exist without an owner
   * (ACTIVATE_MARKET_SPEC §2.1).
   */
  ownerId: number;

  /**
   * Ordinal / tier priority. Enumerated, never free text
   * (ACTIVATE_MARKET_SPEC §2.1). Required.
   */
  priority: P;

  /**
   * The immediate next move. REQUIRED — never null.
   *
   * NO MARKET SITS WAITING.
   */
  nextAction: string;

  /**
   * When the next action is due (ISO-8601 timestamp). REQUIRED — never null.
   *
   * NO MARKET SITS WAITING.
   */
  nextActionDue: string;

  /**
   * Why the object is stuck, if it is. Optional.
   */
  blocker?: string | null;

  /**
   * Timestamp (ISO-8601) of the last logged Activity. Optional.
   */
  lastActivityAt?: string | null;

  /**
   * Provenance of the object, e.g. `'ACTIVATION'`. Optional.
   */
  source?: string | null;

  /**
   * Actor who created the object (references `users.id`). Optional.
   */
  createdBy?: number | null;

  /**
   * Actor who last updated the object (references `users.id`). Optional.
   */
  updatedBy?: number | null;
}

/**
 * The subset of `CommonFields` keys that are guaranteed present on every
 * concrete object. Kept as a runtime-visible union for documentation and for
 * downstream schema-generation; the compile-time guarantee is enforced by the
 * non-optional members above.
 */
export type RequiredCommonField =
  | 'state'
  | 'objective'
  | 'ownerId'
  | 'priority'
  | 'nextAction'
  | 'nextActionDue';
