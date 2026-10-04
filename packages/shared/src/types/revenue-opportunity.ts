/**
 * TUF Ops 2.0 — `RevenueOpportunity` (plan §2.1, §2.3).
 *
 * A conventional B2B sales lifecycle for the two institutional engines:
 *   TEAM_UNIFORMS — institutional uniform revenue engine
 *   ISSUE         — institutional/program apparel, coaches, travel, player gear
 *
 * LETTERED is deliberately NOT a RevenueOpportunity: it has its own lifecycle
 * (`LetteredDeployment`, `./lettered-deployment.js`). The 2.0 engine
 * discriminator replaces the obsolete four-lane `RevenueLane` /
 * `channel_type` model, and — per the schema-collision finding (org 430,
 * opps 1305+1306) — the discriminator belongs in the key, collection-scoped.
 */

import type { CommonFields } from './common-fields.js';
import type { MarketPriority } from './market.js';

/** The only two engines a RevenueOpportunity may carry. */
export type RevenueOpportunityEngine = 'TEAM_UNIFORMS' | 'ISSUE';

export const REVENUE_OPPORTUNITY_ENGINES: readonly RevenueOpportunityEngine[] = [
  'TEAM_UNIFORMS',
  'ISSUE',
];

/**
 * TEAM UNIFORMS lifecycle — plan §2.3, verbatim:
 *
 *   PROSPECTING → DISCOVERY → DESIGN → QUOTE → DECISION
 *               → WON → PRODUCTION → DELIVERED → EXPANSION
 *               (+ BLOCKED, PAUSED, LOST)
 */
export enum TeamUniformsState {
  PROSPECTING = 'PROSPECTING',
  DISCOVERY = 'DISCOVERY',
  DESIGN = 'DESIGN',
  QUOTE = 'QUOTE',
  DECISION = 'DECISION',
  WON = 'WON',
  PRODUCTION = 'PRODUCTION',
  DELIVERED = 'DELIVERED',
  EXPANSION = 'EXPANSION',
  BLOCKED = 'BLOCKED',
  PAUSED = 'PAUSED',
  LOST = 'LOST',
}

/** TEAM UNIFORMS lifecycle in the exact plan §2.3 order. */
export const TEAM_UNIFORMS_STATES: readonly TeamUniformsState[] = [
  TeamUniformsState.PROSPECTING,
  TeamUniformsState.DISCOVERY,
  TeamUniformsState.DESIGN,
  TeamUniformsState.QUOTE,
  TeamUniformsState.DECISION,
  TeamUniformsState.WON,
  TeamUniformsState.PRODUCTION,
  TeamUniformsState.DELIVERED,
  TeamUniformsState.EXPANSION,
  TeamUniformsState.BLOCKED,
  TeamUniformsState.PAUSED,
  TeamUniformsState.LOST,
];

/** TEAM UNIFORMS forward (non-interruption) chain, in order. */
export const TEAM_UNIFORMS_FORWARD_STATES: readonly TeamUniformsState[] = [
  TeamUniformsState.PROSPECTING,
  TeamUniformsState.DISCOVERY,
  TeamUniformsState.DESIGN,
  TeamUniformsState.QUOTE,
  TeamUniformsState.DECISION,
  TeamUniformsState.WON,
  TeamUniformsState.PRODUCTION,
  TeamUniformsState.DELIVERED,
  TeamUniformsState.EXPANSION,
];

/**
 * ISSUE lifecycle — plan §2.3, verbatim:
 *
 *   IDENTIFIED → NEEDS_ASSESSMENT → PROGRAM_DESIGN → QUOTE
 *              → DECISION → WON → PRODUCTION → DELIVERED → EXPANSION
 *
 * Note: the plan's ISSUE lifecycle has NO interruption states.
 */
export enum IssueState {
  IDENTIFIED = 'IDENTIFIED',
  NEEDS_ASSESSMENT = 'NEEDS_ASSESSMENT',
  PROGRAM_DESIGN = 'PROGRAM_DESIGN',
  QUOTE = 'QUOTE',
  DECISION = 'DECISION',
  WON = 'WON',
  PRODUCTION = 'PRODUCTION',
  DELIVERED = 'DELIVERED',
  EXPANSION = 'EXPANSION',
}

/** ISSUE lifecycle in the exact plan §2.3 order. */
export const ISSUE_STATES: readonly IssueState[] = [
  IssueState.IDENTIFIED,
  IssueState.NEEDS_ASSESSMENT,
  IssueState.PROGRAM_DESIGN,
  IssueState.QUOTE,
  IssueState.DECISION,
  IssueState.WON,
  IssueState.PRODUCTION,
  IssueState.DELIVERED,
  IssueState.EXPANSION,
];

/**
 * A RevenueOpportunity — the conventional sales lifecycle for the
 * TEAM_UNIFORMS and ISSUE engines.
 *
 * `state` is the union of the two engine lifecycles; which enum applies is
 * determined by `engine`.
 */
export interface RevenueOpportunity
  extends CommonFields<TeamUniformsState | IssueState, MarketPriority> {
  id: number;

  /** Engine discriminator — exactly `TEAM_UNIFORMS | ISSUE`. */
  engine: RevenueOpportunityEngine;

  /** The Market this opportunity sells into (references `markets.id`). */
  marketId: number;

  /** Denormalized market number for display. Optional. */
  marketNumber?: number | null;

  /**
   * Collection / campaign discriminator. The obsolete 1.0 UNIQUE key
   * (org, sport, season, year, channel_type) collided when TEAM_STORE and
   * LETTERMAN collapsed (org 430); 2.0 puts the discriminator in the key.
   */
  collectionId?: string | null;

  sport?: string | null;
  season?: string | null;
  year?: number | null;

  /** Estimated / contracted value in whole currency units. Optional. */
  value?: number | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}
