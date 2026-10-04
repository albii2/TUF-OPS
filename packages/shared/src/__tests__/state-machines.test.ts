/**
 * State-machine property tests (plan §2.3 / T1.3 / T7.1):
 *   - every state has an entry in the transition table
 *   - no transition points at an undefined state
 *   - every state is reachable from the entry state
 *   - terminal states have no outbound transitions (KILLED / LOST / EXPANSION)
 *   - the pure `canTransition` guard agrees with the table
 */

import { assert, type TestCase } from './_harness.js';

import { MarketState, MARKET_STATES } from '../types/market.js';
import {
  MARKET_TRANSITIONS,
  MARKET_ENTRY_STATE,
  MARKET_TERMINAL_STATES,
  canTransition as canTransitionMarket,
} from '../state-machines/market.js';

import { LetteredState, LETTERED_STATES } from '../types/lettered-deployment.js';
import {
  LETTERED_TRANSITIONS,
  LETTERED_ENTRY_STATE,
  LETTERED_TERMINAL_STATES,
  canTransition as canTransitionLettered,
} from '../state-machines/lettered.js';

import {
  TeamUniformsState,
  TEAM_UNIFORMS_STATES,
} from '../types/revenue-opportunity.js';
import {
  TEAM_UNIFORMS_TRANSITIONS,
  TEAM_UNIFORMS_ENTRY_STATE,
  TEAM_UNIFORMS_TERMINAL_STATES,
  canTransition as canTransitionTeamUniforms,
} from '../state-machines/team-uniforms.js';

import { IssueState, ISSUE_STATES } from '../types/revenue-opportunity.js';
import {
  ISSUE_TRANSITIONS,
  ISSUE_ENTRY_STATE,
  ISSUE_TERMINAL_STATES,
  canTransition as canTransitionIssue,
} from '../state-machines/issue.js';

interface MachineSpec<S extends string> {
  name: string;
  states: readonly S[];
  entry: S;
  terminal: readonly S[];
  transitions: Readonly<Record<S, readonly S[]>>;
}

/**
 * Structural invariants every state machine must satisfy.
 */
function assertMachineWellFormed<S extends string>(spec: MachineSpec<S>): string[] {
  const { name, states, entry, terminal, transitions } = spec;
  const problems: string[] = [];
  const known = new Set(states);

  // Every declared state is a key of the transition table, and vice versa.
  if (Object.keys(transitions).length !== states.length) {
    problems.push(
      `${name}: transition table has ${Object.keys(transitions).length} keys but there are ${states.length} states`,
    );
  }
  for (const state of states) {
    if (!(state in transitions)) {
      problems.push(`${name}: state ${state} is missing from the transition table`);
    }
  }

  // No transition targets an undefined state.
  for (const state of states) {
    const targets = transitions[state] ?? [];
    for (const target of targets) {
      if (!known.has(target)) {
        problems.push(`${name}: transition ${state} -> ${target} targets an undefined state`);
      }
    }
  }

  // Reachability: everything is reachable from the entry state (BFS).
  const visited = new Set<S>([entry]);
  const queue: S[] = [entry];
  while (queue.length > 0) {
    const current = queue.shift() as S;
    for (const target of transitions[current] ?? []) {
      if (!visited.has(target)) {
        visited.add(target);
        queue.push(target);
      }
    }
  }
  for (const state of states) {
    if (!visited.has(state)) {
      problems.push(`${name}: state ${state} is unreachable from entry ${entry}`);
    }
  }

  // Terminal states are sinks.
  for (const state of terminal) {
    if ((transitions[state] ?? []).length !== 0) {
      problems.push(`${name}: terminal state ${state} has outbound transitions`);
    }
  }

  // No self-loops (a transition always moves the object).
  for (const state of states) {
    if ((transitions[state] ?? []).includes(state)) {
      problems.push(`${name}: self-loop on ${state}`);
    }
  }

  return problems;
}

const MACHINES = [
  {
    name: 'market',
    states: MARKET_STATES,
    entry: MARKET_ENTRY_STATE,
    terminal: MARKET_TERMINAL_STATES,
    transitions: MARKET_TRANSITIONS,
  },
  {
    name: 'lettered',
    states: LETTERED_STATES,
    entry: LETTERED_ENTRY_STATE,
    terminal: LETTERED_TERMINAL_STATES,
    transitions: LETTERED_TRANSITIONS,
  },
  {
    name: 'team-uniforms',
    states: TEAM_UNIFORMS_STATES,
    entry: TEAM_UNIFORMS_ENTRY_STATE,
    terminal: TEAM_UNIFORMS_TERMINAL_STATES,
    transitions: TEAM_UNIFORMS_TRANSITIONS,
  },
  {
    name: 'issue',
    states: ISSUE_STATES,
    entry: ISSUE_ENTRY_STATE,
    terminal: ISSUE_TERMINAL_STATES,
    transitions: ISSUE_TRANSITIONS,
  },
] as const;

export const stateMachineTests: TestCase[] = [
  {
    name: 'every machine is well-formed (no undefined targets, no unreachable states)',
    run() {
      const problems = MACHINES.flatMap((machine) =>
        assertMachineWellFormed(machine as MachineSpec<string>),
      );
      assert(problems.length === 0, `state-machine problems:\n${problems.join('\n')}`);
    },
  },
  {
    name: 'market canTransition matches the table',
    run() {
      assert(canTransitionMarket(MarketState.IDENTIFIED, MarketState.QUALIFIED), 'IDENTIFIED -> QUALIFIED');
      assert(canTransitionMarket(MarketState.MATURE, MarketState.KILLED), 'MATURE -> KILLED');
      assert(canTransitionMarket(MarketState.BLOCKED, MarketState.ACTIVE), 'BLOCKED -> ACTIVE (resume)');
      assert(!canTransitionMarket(MarketState.IDENTIFIED, MarketState.MATURE), 'IDENTIFIED -> MATURE (skip) rejected');
      assert(!canTransitionMarket(MarketState.KILLED, MarketState.IDENTIFIED), 'KILLED is terminal');
      assert(!canTransitionMarket(MarketState.IDENTIFIED, MarketState.IDENTIFIED), 'no self-loop');
    },
  },
  {
    name: 'lettered canTransition models the DECISION_GATE branch',
    run() {
      assert(canTransitionLettered(LetteredState.DECISION_GATE, LetteredState.COLLABORATIVE), 'DECISION_GATE -> COLLABORATIVE');
      assert(canTransitionLettered(LetteredState.DECISION_GATE, LetteredState.COMMUNITY), 'DECISION_GATE -> COMMUNITY');
      assert(canTransitionLettered(LetteredState.COLLABORATIVE, LetteredState.MARKET_SEEDING), 'COLLABORATIVE -> MARKET_SEEDING');
      assert(canTransitionLettered(LetteredState.COMMUNITY, LetteredState.MARKET_SEEDING), 'COMMUNITY -> MARKET_SEEDING');
      assert(!canTransitionLettered(LetteredState.DECISION_GATE, LetteredState.MARKET_SEEDING), 'branch must not skip');
      assert(!canTransitionLettered(LetteredState.DROP_002, LetteredState.SCALE), 'DROP_002 cannot go back to SCALE');
      assert(canTransitionLettered(LetteredState.PAUSED, LetteredState.LIVE), 'PAUSED -> LIVE (resume)');
    },
  },
  {
    name: 'team-uniforms canTransition',
    run() {
      assert(canTransitionTeamUniforms(TeamUniformsState.PROSPECTING, TeamUniformsState.DISCOVERY), 'PROSPECTING -> DISCOVERY');
      assert(canTransitionTeamUniforms(TeamUniformsState.BLOCKED, TeamUniformsState.WON), 'BLOCKED -> WON (resume)');
      assert(!canTransitionTeamUniforms(TeamUniformsState.PROSPECTING, TeamUniformsState.WON), 'cannot skip the funnel');
      assert(!canTransitionTeamUniforms(TeamUniformsState.LOST, TeamUniformsState.PROSPECTING), 'LOST is terminal');
    },
  },
  {
    name: 'issue canTransition is the strict linear chain',
    run() {
      assert(canTransitionIssue(IssueState.IDENTIFIED, IssueState.NEEDS_ASSESSMENT), 'IDENTIFIED -> NEEDS_ASSESSMENT');
      assert(canTransitionIssue(IssueState.DELIVERED, IssueState.EXPANSION), 'DELIVERED -> EXPANSION');
      assert(!canTransitionIssue(IssueState.IDENTIFIED, IssueState.EXPANSION), 'cannot skip the chain');
      assert(!canTransitionIssue(IssueState.EXPANSION, IssueState.IDENTIFIED), 'EXPANSION is terminal');
    },
  },
];
