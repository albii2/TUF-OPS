/**
 * TUF Ops 2.0 — `Market` (plan §2.1, §2.3; R2/R3 rulings).
 *
 * A Market is the single activation gate into operational attention.
 *
 * Governing principle (plan / ACTIVATE_MARKET_SPEC):
 *   Knowing a school exists does not make it a Market. A Market represents an
 *   intentional allocation of TUF resources.
 *
 * A Market is NEVER a rename of `organizations` (the read-only
 * MarketUniverseEntry). Every 2.0 operational entity keys to `markets.id`.
 */

import type { CommonFields } from './common-fields.js';

/**
 * Market Lifecycle — plan §2.3, verbatim:
 *
 *   IDENTIFIED → QUALIFIED → DEVELOPMENT → LAUNCH_READY → PENETRATION
 *              → ACTIVE → EXPANSION → MATURE
 *              (+ BLOCKED, PAUSED, KILLED)
 */
export enum MarketState {
  IDENTIFIED = 'IDENTIFIED',
  QUALIFIED = 'QUALIFIED',
  DEVELOPMENT = 'DEVELOPMENT',
  LAUNCH_READY = 'LAUNCH_READY',
  PENETRATION = 'PENETRATION',
  ACTIVE = 'ACTIVE',
  EXPANSION = 'EXPANSION',
  MATURE = 'MATURE',
  BLOCKED = 'BLOCKED',
  PAUSED = 'PAUSED',
  KILLED = 'KILLED',
}

/**
 * The Market Lifecycle in the exact order given by plan §2.3. The three
 * interruption states are appended after the forward chain.
 */
export const MARKET_STATES: readonly MarketState[] = [
  MarketState.IDENTIFIED,
  MarketState.QUALIFIED,
  MarketState.DEVELOPMENT,
  MarketState.LAUNCH_READY,
  MarketState.PENETRATION,
  MarketState.ACTIVE,
  MarketState.EXPANSION,
  MarketState.MATURE,
  MarketState.BLOCKED,
  MarketState.PAUSED,
  MarketState.KILLED,
];

/**
 * The forward (non-interruption) chain of the Market Lifecycle, in order.
 * ACTIVATE MARKET creates a Market in the entry state `IDENTIFIED`
 * (ACTIVATE_MARKET_SPEC §6).
 */
export const MARKET_FORWARD_STATES: readonly MarketState[] = [
  MarketState.IDENTIFIED,
  MarketState.QUALIFIED,
  MarketState.DEVELOPMENT,
  MarketState.LAUNCH_READY,
  MarketState.PENETRATION,
  MarketState.ACTIVE,
  MarketState.EXPANSION,
  MarketState.MATURE,
];

/**
 * Market priority — enumerated ordinal/tier (ACTIVATE_MARKET_SPEC §2.1:
 * "priority — ordinal / tier ... Enumerated — no free text"). Mirrors the
 * universe `tuf_priority` tier vocabulary without aliasing it (that field is
 * intelligence metadata, not activation — ACTIVATE_MARKET_SPEC §8).
 */
export enum MarketPriority {
  TIER_1 = 'TIER_1',
  TIER_2 = 'TIER_2',
  TIER_3 = 'TIER_3',
}

export const MARKET_PRIORITIES: readonly MarketPriority[] = [
  MarketPriority.TIER_1,
  MarketPriority.TIER_2,
  MarketPriority.TIER_3,
];

/**
 * A Market — a school where TUF has DELIBERATELY COMMITTED operational
 * attention via the ACTIVATE MARKET operation.
 *
 * Inherits the §2.2 common fields, including the REQUIRED `nextAction` and
 * `nextActionDue` (NO MARKET SITS WAITING). `ownerId`, `priority`, `objective`,
 * `state`, `nextAction` and `nextActionDue` all arrive from `CommonFields`.
 */
export interface Market extends CommonFields<MarketState, MarketPriority> {
  id: number;

  /**
   * System-assigned, monotonic, never reused (ACTIVATE_MARKET_SPEC §5).
   * Display zero-pads to `001`, `002`, …; storage is an integer.
   */
  marketNumber: number;

  /**
   * The universe row (`organizations.id`) this Market was activated from.
   * UNIQUE — one activation per school (ACTIVATE_MARKET_SPEC §3 V9).
   */
  universeOrganizationId: number;

  /**
   * Timestamp (ISO-8601) of the deliberate commitment. NOT NULL, server
   * assigned. The immutable provenance of operational attention
   * (ACTIVATE_MARKET_SPEC §2.1, §6).
   */
  activatedAt: string;

  /**
   * Convenience, denormalized display name of the activated universe school.
   * Optional and NOT authoritative — the universe remains the source of truth.
   */
  name?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}
