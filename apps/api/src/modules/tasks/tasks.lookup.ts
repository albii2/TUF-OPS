/**
 * TUF Ops 2.0 — the DECLARATIVE task lookup tables (Wave 5A).
 *
 * This is the ONLY place the "state -> next task" decision lives. It is DATA,
 * not logic: an explicit, exhaustively-typed map from a lifecycle state to the
 * task template that being in that state implies. `Record<State, ...>` makes a
 * missing key a COMPILE error, so the table can never silently fall out of sync
 * with the canonical state machine.
 *
 * NO AI. NO model. NO network. The generator reads this table; nothing else.
 *
 * `null` means "this state generates no task" (the terminal KILLED states).
 */

import { MarketState, MarketPriority, LetteredState } from '@tuf/shared';
import type { TaskTemplate } from './tasks.interface.js';

/**
 * Canonical MARKET lifecycle -> task template.
 *
 * The seeded three markets occupy PENETRATION (001 Pillager), LAUNCH_READY
 * (002 Pequot Lakes) and DEVELOPMENT (003 Brainerd); every other state is
 * covered so any transition is defined.
 */
export const MARKET_TASK_LOOKUP: Readonly<Record<MarketState, TaskTemplate | null>> = {
  [MarketState.IDENTIFIED]: {
    action: 'Qualify the market: confirm the decision-maker, need and timing.',
    dueInDays: 3,
    priority: MarketPriority.TIER_2,
  },
  [MarketState.QUALIFIED]: {
    action: 'Open development: run the first substantive working session with the market.',
    dueInDays: 5,
    priority: MarketPriority.TIER_2,
  },
  [MarketState.DEVELOPMENT]: {
    action: 'Advance development: define the offering and collect the market requirements.',
    dueInDays: 7,
    priority: MarketPriority.TIER_2,
  },
  [MarketState.LAUNCH_READY]: {
    action: 'Prepare launch: lock the assets and confirm the launch date with the market.',
    dueInDays: 7,
    priority: MarketPriority.TIER_1,
  },
  [MarketState.PENETRATION]: {
    action: 'Penetrate the market: work the account for repeat and expansion revenue.',
    dueInDays: 14,
    priority: MarketPriority.TIER_1,
  },
  [MarketState.ACTIVE]: {
    action: 'Service the active market: protect the recurring relationship and revenue.',
    dueInDays: 14,
    priority: MarketPriority.TIER_1,
  },
  [MarketState.EXPANSION]: {
    action: 'Expand: identify the next program or school inside the market.',
    dueInDays: 21,
    priority: MarketPriority.TIER_2,
  },
  [MarketState.MATURE]: {
    action: 'Sustain the mature market: harvest referrals and defend the account.',
    dueInDays: 30,
    priority: MarketPriority.TIER_3,
  },
  [MarketState.BLOCKED]: {
    action: 'Resolve the blocker and return the market to its forward path.',
    dueInDays: 2,
    priority: MarketPriority.TIER_1,
  },
  [MarketState.PAUSED]: {
    action: 'Review the paused market: decide to resume or kill it.',
    dueInDays: 10,
    priority: MarketPriority.TIER_2,
  },
  // Terminal — killing a market generates NO task.
  [MarketState.KILLED]: null,
};

/**
 * Canonical LETTERED lifecycle -> task template. The seeded Pillager deployment
 * is at LIVE; the full chain is covered so any deployment transition is defined.
 */
export const LETTERED_TASK_LOOKUP: Readonly<Record<LetteredState, TaskTemplate | null>> = {
  [LetteredState.IDENTIFIED]: {
    action: 'Qualify the LETTERED concept with the school and confirm fit.',
    dueInDays: 3,
    priority: MarketPriority.TIER_2,
  },
  [LetteredState.QUALIFIED]: {
    action: 'Establish the rights path for the LETTERED collection.',
    dueInDays: 5,
    priority: MarketPriority.TIER_2,
  },
  [LetteredState.RIGHTS_PATH]: {
    action: 'Draft the collection concept and socialise it with the school.',
    dueInDays: 7,
    priority: MarketPriority.TIER_2,
  },
  [LetteredState.COLLECTION_CONCEPT]: {
    action: 'Finalise the collection: freeze the artwork and product list.',
    dueInDays: 7,
    priority: MarketPriority.TIER_2,
  },
  [LetteredState.COLLECTION_READY]: {
    action: 'Build the Drops storefront draft for the collection.',
    dueInDays: 5,
    priority: MarketPriority.TIER_2,
  },
  [LetteredState.STORE_DRAFT]: {
    action: 'Produce and load the store assets (photography, copy, variants).',
    dueInDays: 7,
    priority: MarketPriority.TIER_2,
  },
  [LetteredState.ASSETS_READY]: {
    action: 'Run commerce QA on the storefront before launch.',
    dueInDays: 3,
    priority: MarketPriority.TIER_2,
  },
  [LetteredState.COMMERCE_QA]: {
    action: 'Move the collection to launch-ready and confirm the go-live plan.',
    dueInDays: 3,
    priority: MarketPriority.TIER_1,
  },
  [LetteredState.LAUNCH_READY]: {
    action: 'Run the institutional first look with the school.',
    dueInDays: 5,
    priority: MarketPriority.TIER_1,
  },
  [LetteredState.INSTITUTIONAL_FIRST_LOOK]: {
    action: 'Hold the decision gate: choose the collaborative or community path.',
    dueInDays: 3,
    priority: MarketPriority.TIER_1,
  },
  [LetteredState.DECISION_GATE]: {
    action: 'Run the collaborative path: co-build with the school.',
    dueInDays: 7,
    priority: MarketPriority.TIER_2,
  },
  [LetteredState.COLLABORATIVE]: {
    action: 'Seed the market ahead of launch: drive awareness and first demand.',
    dueInDays: 7,
    priority: MarketPriority.TIER_2,
  },
  [LetteredState.COMMUNITY]: {
    action: 'Seed the community ahead of launch: drive awareness and first demand.',
    dueInDays: 7,
    priority: MarketPriority.TIER_2,
  },
  [LetteredState.MARKET_SEEDING]: {
    action: 'Go live with the LETTERED store.',
    dueInDays: 3,
    priority: MarketPriority.TIER_1,
  },
  [LetteredState.LIVE]: {
    action: 'Drive the first order on the live LETTERED store.',
    dueInDays: 7,
    priority: MarketPriority.TIER_1,
  },
  [LetteredState.FIRST_ORDER]: {
    action: 'Scale to ten orders: promote the store to the school community.',
    dueInDays: 14,
    priority: MarketPriority.TIER_1,
  },
  [LetteredState.TEN_ORDERS]: {
    action: 'Scale to twenty-five orders: amplify the campaign.',
    dueInDays: 21,
    priority: MarketPriority.TIER_2,
  },
  [LetteredState.TWENTY_FIVE_ORDERS]: {
    action: 'Scale the drop: extend the product range and reach.',
    dueInDays: 30,
    priority: MarketPriority.TIER_2,
  },
  [LetteredState.SCALE]: {
    action: 'Plan DROP_002 for the market.',
    dueInDays: 30,
    priority: MarketPriority.TIER_2,
  },
  [LetteredState.DROP_002]: {
    action: 'Operate DROP_002 and review performance.',
    dueInDays: 30,
    priority: MarketPriority.TIER_3,
  },
  [LetteredState.BLOCKED]: {
    action: 'Resolve the LETTERED blocker and resume the lifecycle.',
    dueInDays: 2,
    priority: MarketPriority.TIER_1,
  },
  [LetteredState.PAUSED]: {
    action: 'Review the paused LETTERED deployment: resume or kill it.',
    dueInDays: 10,
    priority: MarketPriority.TIER_2,
  },
  // Terminal — a killed deployment generates NO task.
  [LetteredState.KILLED]: null,
};

/** The two declarative tables, keyed by entity kind. */
export const TASK_LOOKUP = {
  MARKET: MARKET_TASK_LOOKUP,
  LETTERED: LETTERED_TASK_LOOKUP,
} as const;
