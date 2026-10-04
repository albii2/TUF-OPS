/**
 * TUF Ops 2.0 — LETTERED state machine (plan §2.3).
 *
 * The full 20-state main-chain LETTERED lifecycle (DECISION_GATE branches to
 * COLLABORATIVE | COMMUNITY, converging on MARKET_SEEDING) plus the three
 * interruption states BLOCKED, PAUSED, KILLED. KILLED is terminal.
 */

import { LetteredState, LETTERED_LIFECYCLE_STATES } from '../types/lettered-deployment.js';

export { LetteredState } from '../types/lettered-deployment.js';

/**
 * Valid transitions, keyed by every `LetteredState`. The `Record` type makes
 * a missing key a compile error. Interruption states may resume into any
 * main-chain state; KILLED has no outbound transitions.
 */
export const LETTERED_TRANSITIONS: Readonly<
  Record<LetteredState, readonly LetteredState[]>
> = {
  [LetteredState.IDENTIFIED]: [
    LetteredState.QUALIFIED,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.QUALIFIED]: [
    LetteredState.RIGHTS_PATH,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.RIGHTS_PATH]: [
    LetteredState.COLLECTION_CONCEPT,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.COLLECTION_CONCEPT]: [
    LetteredState.COLLECTION_READY,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.COLLECTION_READY]: [
    LetteredState.STORE_DRAFT,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.STORE_DRAFT]: [
    LetteredState.ASSETS_READY,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.ASSETS_READY]: [
    LetteredState.COMMERCE_QA,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.COMMERCE_QA]: [
    LetteredState.LAUNCH_READY,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.LAUNCH_READY]: [
    LetteredState.INSTITUTIONAL_FIRST_LOOK,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.INSTITUTIONAL_FIRST_LOOK]: [
    LetteredState.DECISION_GATE,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.DECISION_GATE]: [
    LetteredState.COLLABORATIVE,
    LetteredState.COMMUNITY,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.COLLABORATIVE]: [
    LetteredState.MARKET_SEEDING,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.COMMUNITY]: [
    LetteredState.MARKET_SEEDING,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.MARKET_SEEDING]: [
    LetteredState.LIVE,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.LIVE]: [
    LetteredState.FIRST_ORDER,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.FIRST_ORDER]: [
    LetteredState.TEN_ORDERS,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.TEN_ORDERS]: [
    LetteredState.TWENTY_FIVE_ORDERS,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.TWENTY_FIVE_ORDERS]: [
    LetteredState.SCALE,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.SCALE]: [
    LetteredState.DROP_002,
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.DROP_002]: [
    LetteredState.BLOCKED,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.BLOCKED]: [
    ...LETTERED_LIFECYCLE_STATES,
    LetteredState.PAUSED,
    LetteredState.KILLED,
  ],
  [LetteredState.PAUSED]: [
    ...LETTERED_LIFECYCLE_STATES,
    LetteredState.BLOCKED,
    LetteredState.KILLED,
  ],
  [LetteredState.KILLED]: [],
};

/** Entry state of the LETTERED lifecycle. */
export const LETTERED_ENTRY_STATE: LetteredState = LetteredState.IDENTIFIED;

/** Terminal states — no outbound transitions. */
export const LETTERED_TERMINAL_STATES: readonly LetteredState[] = [
  LetteredState.KILLED,
];

/**
 * Pure transition guard: true iff moving `from` → `to` is permitted by
 * `LETTERED_TRANSITIONS`.
 */
export function canTransition(from: LetteredState, to: LetteredState): boolean {
  const allowed = LETTERED_TRANSITIONS[from];
  return allowed !== undefined && allowed.includes(to);
}
