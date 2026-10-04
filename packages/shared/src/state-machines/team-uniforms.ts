/**
 * TUF Ops 2.0 — TEAM UNIFORMS state machine (plan §2.3).
 *
 * The institutional uniform revenue engine's sales lifecycle. BLOCKED, PAUSED
 * and LOST are interruption states; LOST is terminal.
 */

import {
  TeamUniformsState,
  TEAM_UNIFORMS_FORWARD_STATES,
} from '../types/revenue-opportunity.js';

export { TeamUniformsState } from '../types/revenue-opportunity.js';

/**
 * Valid transitions, keyed by every `TeamUniformsState`. The `Record` type
 * makes a missing key a compile error. Interruption states may resume into any
 * forward state; LOST has no outbound transitions.
 */
export const TEAM_UNIFORMS_TRANSITIONS: Readonly<
  Record<TeamUniformsState, readonly TeamUniformsState[]>
> = {
  [TeamUniformsState.PROSPECTING]: [
    TeamUniformsState.DISCOVERY,
    TeamUniformsState.BLOCKED,
    TeamUniformsState.PAUSED,
    TeamUniformsState.LOST,
  ],
  [TeamUniformsState.DISCOVERY]: [
    TeamUniformsState.DESIGN,
    TeamUniformsState.BLOCKED,
    TeamUniformsState.PAUSED,
    TeamUniformsState.LOST,
  ],
  [TeamUniformsState.DESIGN]: [
    TeamUniformsState.QUOTE,
    TeamUniformsState.BLOCKED,
    TeamUniformsState.PAUSED,
    TeamUniformsState.LOST,
  ],
  [TeamUniformsState.QUOTE]: [
    TeamUniformsState.DECISION,
    TeamUniformsState.BLOCKED,
    TeamUniformsState.PAUSED,
    TeamUniformsState.LOST,
  ],
  [TeamUniformsState.DECISION]: [
    TeamUniformsState.WON,
    TeamUniformsState.BLOCKED,
    TeamUniformsState.PAUSED,
    TeamUniformsState.LOST,
  ],
  [TeamUniformsState.WON]: [
    TeamUniformsState.PRODUCTION,
    TeamUniformsState.BLOCKED,
    TeamUniformsState.PAUSED,
    TeamUniformsState.LOST,
  ],
  [TeamUniformsState.PRODUCTION]: [
    TeamUniformsState.DELIVERED,
    TeamUniformsState.BLOCKED,
    TeamUniformsState.PAUSED,
    TeamUniformsState.LOST,
  ],
  [TeamUniformsState.DELIVERED]: [
    TeamUniformsState.EXPANSION,
    TeamUniformsState.BLOCKED,
    TeamUniformsState.PAUSED,
    TeamUniformsState.LOST,
  ],
  [TeamUniformsState.EXPANSION]: [
    TeamUniformsState.BLOCKED,
    TeamUniformsState.PAUSED,
    TeamUniformsState.LOST,
  ],
  [TeamUniformsState.BLOCKED]: [
    ...TEAM_UNIFORMS_FORWARD_STATES,
    TeamUniformsState.PAUSED,
    TeamUniformsState.LOST,
  ],
  [TeamUniformsState.PAUSED]: [
    ...TEAM_UNIFORMS_FORWARD_STATES,
    TeamUniformsState.BLOCKED,
    TeamUniformsState.LOST,
  ],
  [TeamUniformsState.LOST]: [],
};

/** Entry state of the TEAM UNIFORMS lifecycle. */
export const TEAM_UNIFORMS_ENTRY_STATE: TeamUniformsState =
  TeamUniformsState.PROSPECTING;

/** Terminal states — no outbound transitions. */
export const TEAM_UNIFORMS_TERMINAL_STATES: readonly TeamUniformsState[] = [
  TeamUniformsState.LOST,
];

/**
 * Pure transition guard: true iff moving `from` → `to` is permitted by
 * `TEAM_UNIFORMS_TRANSITIONS`.
 */
export function canTransition(
  from: TeamUniformsState,
  to: TeamUniformsState,
): boolean {
  const allowed = TEAM_UNIFORMS_TRANSITIONS[from];
  return allowed !== undefined && allowed.includes(to);
}
