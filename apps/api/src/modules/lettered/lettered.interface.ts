/**
 * TUF Ops 2.0 — `lettered` module contract (Wave 3A).
 *
 * LETTERED is its OWN deployment lifecycle (plan §2.3, DROPS_CONTRACT). It is
 * NOT a RevenueOpportunity and must never be forced into the generic B2B
 * opportunity lifecycle. A deployment belongs to a MARKET (`markets.id`), never
 * to an organization.
 *
 * Reason codes are stable and machine-readable. The API/service surfaces these,
 * never a raw Postgres error.
 */

import type { LetteredState, MarketPriority } from '@tuf/shared';
import type { DbClientLike, DbPoolLike } from '../markets/markets.interface.js';

export type { LetteredState, MarketPriority };
export type { DbClientLike, DbPoolLike };

/** Stable, machine-readable deployment rejection reasons. */
export type LetteredDeploymentReason =
  | 'MISSING_MARKET' // neither marketId nor universeOrganizationId supplied
  | 'UNKNOWN_MARKET' // marketId does not resolve to a markets row
  | 'UNIVERSE_ONLY_ORGANIZATION' // organization has no market — never operational
  | 'MISSING_OWNER'
  | 'MISSING_OBJECTIVE'
  | 'MISSING_NEXT_ACTION'
  | 'MISSING_NEXT_ACTION_DUE'
  | 'INVALID_PRIORITY'
  | 'INVALID_STATE' // state is not a canonical LETTERED state
  | 'NOT_FOUND'; // the deployment id does not exist

export const LETTERED_DEPLOYMENT_REASONS: readonly LetteredDeploymentReason[] = [
  'MISSING_MARKET',
  'UNKNOWN_MARKET',
  'UNIVERSE_ONLY_ORGANIZATION',
  'MISSING_OWNER',
  'MISSING_OBJECTIVE',
  'MISSING_NEXT_ACTION',
  'MISSING_NEXT_ACTION_DUE',
  'INVALID_PRIORITY',
  'INVALID_STATE',
  'NOT_FOUND',
];

/** Thrown by `createLetteredDeployment` for every contract rejection. */
export class LetteredDeploymentError extends Error {
  readonly reason: LetteredDeploymentReason;

  constructor(reason: LetteredDeploymentReason, message?: string) {
    super(message ?? reason);
    this.name = 'LetteredDeploymentError';
    this.reason = reason;
  }
}

/**
 * Thrown when a lifecycle move violates the canonical LETTERED state machine.
 * The `from`/`to` pair is carried so the caller can render a precise refusal —
 * an illegal transition is NEVER silently accepted or coerced.
 */
export class IllegalTransitionError extends Error {
  readonly from: string;
  readonly to: string;
  readonly reason = 'ILLEGAL_TRANSITION' as const;

  constructor(from: string, to: string) {
    super(`Illegal LETTERED transition ${from} -> ${to}`);
    this.name = 'IllegalTransitionError';
    this.from = from;
    this.to = to;
  }
}

/**
 * Caller-supplied creation input. A deployment MUST be anchored to a Market:
 * either directly by `marketId` (a `markets.id`) or by the universe
 * organization it was activated from (`universeOrganizationId`). The latter is
 * how a universe-only organization is REFUSED — it resolves to no Market.
 */
export interface CreateLetteredDeploymentInput {
  marketId?: number | string | null;
  universeOrganizationId?: number | string | null;
  ownerId?: number | string | null;
  priority?: string | null;
  objective?: string | null;
  nextAction?: string | null;
  nextActionDue?: string | Date | null;
  /** Defaults to the entry state `IDENTIFIED`. Must be a canonical state. */
  state?: string | null;

  // --- Drops OS references ONLY (R8). Nothing else crosses the boundary. ---
  dropsOrganizationId?: string | null;
  dropsCollectionId?: string | null;
  dropsDropId?: string | null;
  storefrontUrl?: string | null;

  source?: string | null;
}

/** The deliberate actor (references `users.id`). */
export interface LetteredActor {
  id?: number | string | null;
  role?: string | null;
}

export interface CreateLetteredDeploymentDeps {
  db?: DbPoolLike;
}
