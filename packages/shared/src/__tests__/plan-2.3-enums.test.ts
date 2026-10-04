/**
 * Asserts each 2.0 state enum EXACTLY matches the plan §2.3 lifecycle —
 * content AND order — to kill typos/drift.
 *
 * The expected arrays below are transcribed verbatim from the plan's §2.3
 * lifecycle block.
 */

import {
  MarketState,
  MARKET_STATES,
  MARKET_FORWARD_STATES,
  MarketPriority,
  MARKET_PRIORITIES,
} from '../types/market.js';
import {
  REVENUE_OPPORTUNITY_ENGINES,
  TeamUniformsState,
  TEAM_UNIFORMS_STATES,
  IssueState,
  ISSUE_STATES,
} from '../types/revenue-opportunity.js';
import {
  LetteredState,
  LETTERED_STATES,
  LETTERED_LIFECYCLE_STATES,
} from '../types/lettered-deployment.js';
import { assert, assertEqual, sorted, type TestCase } from './_harness.js';

/** All runtime members of a string enum, in declaration order. */
function enumValues(enumObject: object): string[] {
  return Object.values(enumObject as Record<string, unknown>).map(String);
}

// ---- plan §2.3, verbatim ----

const PLAN_MARKET = [
  'IDENTIFIED',
  'QUALIFIED',
  'DEVELOPMENT',
  'LAUNCH_READY',
  'PENETRATION',
  'ACTIVE',
  'EXPANSION',
  'MATURE',
  'BLOCKED',
  'PAUSED',
  'KILLED',
];

const PLAN_MARKET_FORWARD = [
  'IDENTIFIED',
  'QUALIFIED',
  'DEVELOPMENT',
  'LAUNCH_READY',
  'PENETRATION',
  'ACTIVE',
  'EXPANSION',
  'MATURE',
];

const PLAN_TEAM_UNIFORMS = [
  'PROSPECTING',
  'DISCOVERY',
  'DESIGN',
  'QUOTE',
  'DECISION',
  'WON',
  'PRODUCTION',
  'DELIVERED',
  'EXPANSION',
  'BLOCKED',
  'PAUSED',
  'LOST',
];

const PLAN_ISSUE = [
  'IDENTIFIED',
  'NEEDS_ASSESSMENT',
  'PROGRAM_DESIGN',
  'QUOTE',
  'DECISION',
  'WON',
  'PRODUCTION',
  'DELIVERED',
  'EXPANSION',
];

// The plan §2.3 LETTERED chain. DECISION_GATE branches into
// COLLABORATIVE | COMMUNITY, which converge on MARKET_SEEDING. NOTE: the plan
// labels this "19 states" but the verbatim enumeration is 20 — this list is
// the verbatim enumeration.
const PLAN_LETTERED_LIFECYCLE = [
  'IDENTIFIED',
  'QUALIFIED',
  'RIGHTS_PATH',
  'COLLECTION_CONCEPT',
  'COLLECTION_READY',
  'STORE_DRAFT',
  'ASSETS_READY',
  'COMMERCE_QA',
  'LAUNCH_READY',
  'INSTITUTIONAL_FIRST_LOOK',
  'DECISION_GATE',
  'COLLABORATIVE',
  'COMMUNITY',
  'MARKET_SEEDING',
  'LIVE',
  'FIRST_ORDER',
  'TEN_ORDERS',
  'TWENTY_FIVE_ORDERS',
  'SCALE',
  'DROP_002',
];

const PLAN_LETTERED = [...PLAN_LETTERED_LIFECYCLE, 'BLOCKED', 'PAUSED', 'KILLED'];

export const plan23EnumTests: TestCase[] = [
  {
    name: 'MarketState matches plan §2.3 exactly, in order',
    run() {
      assertEqual(
        [...MARKET_STATES],
        PLAN_MARKET,
        'MARKET_STATES order/content',
      );
      assertEqual(
        sorted(enumValues(MarketState)),
        sorted(PLAN_MARKET),
        'MarketState enum members == MARKET_STATES',
      );
    },
  },
  {
    name: 'MARKET_FORWARD_STATES matches the plan §2.3 forward chain',
    run() {
      assertEqual(
        [...MARKET_FORWARD_STATES],
        PLAN_MARKET_FORWARD,
        'MARKET_FORWARD_STATES order/content',
      );
    },
  },
  {
    name: 'MarketPriority is the enumerated tier set',
    run() {
      assertEqual(
        [...MARKET_PRIORITIES],
        ['TIER_1', 'TIER_2', 'TIER_3'],
        'MARKET_PRIORITIES',
      );
      assertEqual(
        sorted(enumValues(MarketPriority)),
        sorted(['TIER_1', 'TIER_2', 'TIER_3']),
        'MarketPriority enum members',
      );
    },
  },
  {
    name: 'RevenueOpportunity engines are exactly TEAM_UNIFORMS | ISSUE',
    run() {
      assertEqual(
        [...REVENUE_OPPORTUNITY_ENGINES],
        ['TEAM_UNIFORMS', 'ISSUE'],
        'REVENUE_OPPORTUNITY_ENGINES',
      );
    },
  },
  {
    name: 'TeamUniformsState matches plan §2.3 exactly, in order',
    run() {
      assertEqual(
        [...TEAM_UNIFORMS_STATES],
        PLAN_TEAM_UNIFORMS,
        'TEAM_UNIFORMS_STATES order/content',
      );
      assertEqual(
        sorted(enumValues(TeamUniformsState)),
        sorted(PLAN_TEAM_UNIFORMS),
        'TeamUniformsState enum members == TEAM_UNIFORMS_STATES',
      );
    },
  },
  {
    name: 'IssueState matches plan §2.3 exactly, in order',
    run() {
      assertEqual([...ISSUE_STATES], PLAN_ISSUE, 'ISSUE_STATES order/content');
      assertEqual(
        sorted(enumValues(IssueState)),
        sorted(PLAN_ISSUE),
        'IssueState enum members == ISSUE_STATES',
      );
    },
  },
  {
    name: 'LetteredState main chain matches plan §2.3 exactly, in order',
    run() {
      assertEqual(
        [...LETTERED_LIFECYCLE_STATES],
        PLAN_LETTERED_LIFECYCLE,
        'LETTERED_LIFECYCLE_STATES order/content',
      );
      assert(
        LETTERED_LIFECYCLE_STATES.length === 20,
        `LETTERED main chain should be the 20 verbatim states, got ${LETTERED_LIFECYCLE_STATES.length}`,
      );
    },
  },
  {
    name: 'LETTERED_STATES == main chain + BLOCKED/PAUSED/KILLED',
    run() {
      assertEqual(
        [...LETTERED_STATES],
        PLAN_LETTERED,
        'LETTERED_STATES order/content',
      );
      assertEqual(
        sorted(enumValues(LetteredState)),
        sorted(PLAN_LETTERED),
        'LetteredState enum members == LETTERED_STATES',
      );
    },
  },
];
