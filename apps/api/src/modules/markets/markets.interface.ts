/**
 * TUF Ops 2.0 — `markets` module contract (Wave 1).
 *
 * ACTIVATE MARKET is the SINGLE gateway by which a school (an inert
 * `organizations` universe row) becomes a Market. There is no bulk path.
 *
 * Governing principle:
 *   Knowing a school exists does not make it a Market. A Market represents an
 *   intentional allocation of TUF resources.
 *
 * Reason codes are stable and machine-readable (ACTIVATE_MARKET_SPEC §3). The
 * API/service must surface these, never a raw Postgres error.
 */

import type { Market, MarketPriority } from '@tuf/shared';

export type { Market, MarketPriority };

/** Stable, machine-readable activation rejection reasons (spec §3, V1–V10). */
export type ActivationReason =
  | 'MISSING_OWNER' // V1
  | 'MISSING_OBJECTIVE' // V2
  | 'MISSING_NEXT_ACTION' // V3
  | 'MISSING_NEXT_ACTION_DUE' // V4
  | 'INVALID_PRIORITY' // V6
  | 'UNKNOWN_UNIVERSE_REFERENCE' // V7
  | 'DUPLICATE_MARKET_NUMBER' // V8
  | 'SCHOOL_ALREADY_ACTIVATED' // V9
  | 'NOT_AUTHORISED'; // V10 (role model is Commander-gated; MVP requires only a resolved actor)

export const ACTIVATION_REASONS: readonly ActivationReason[] = [
  'MISSING_OWNER',
  'MISSING_OBJECTIVE',
  'MISSING_NEXT_ACTION',
  'MISSING_NEXT_ACTION_DUE',
  'INVALID_PRIORITY',
  'UNKNOWN_UNIVERSE_REFERENCE',
  'DUPLICATE_MARKET_NUMBER',
  'SCHOOL_ALREADY_ACTIVATED',
  'NOT_AUTHORISED',
];

/** Thrown by `activateMarket` for every contract rejection. */
export class ActivationError extends Error {
  readonly reason: ActivationReason;

  constructor(reason: ActivationReason, message?: string) {
    super(message ?? reason);
    this.name = 'ActivationError';
    this.reason = reason;
  }
}

/**
 * Caller-supplied activation input. `marketNumber` is deliberately absent —
 * the system allocates it from `market_number_seq` (spec §2.2).
 */
export interface ActivateMarketInput {
  universeOrganizationId?: number | string | null;
  ownerId?: number | string | null;
  priority?: string | null;
  objective?: string | null;
  nextAction?: string | null;
  nextActionDue?: string | Date | null;
}

/** The deliberate actor performing the activation (references `users.id`). */
export interface ActivationActor {
  id?: number | string | null;
  role?: string | null;
}

/** Soft warnings returned alongside a successful activation (spec §3.1). */
export interface ActivationResult {
  market: Market;
  warnings: ActivationReason[];
}

// --- Minimal structural DB types (keeps this module free of a hard `pg` import) ---

export interface QueryResultLike<R = Record<string, unknown>> {
  rows: R[];
  rowCount: number | null;
}

export interface DbClientLike {
  query<R = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResultLike<R>>;
  release?(destroy?: boolean): void;
}

export interface DbPoolLike {
  connect(): Promise<DbClientLike>;
  query?<R = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResultLike<R>>;
}

export interface ActivateMarketDeps {
  /**
   * Injected pool. Tests pass a transaction-scoped pool so the whole activation
   * (and its rolled-back fixtures) never persists. Production omits it and the
   * shared `@packages/database` pool is resolved lazily.
   */
  db?: DbPoolLike;
}
