/**
 * Compile-time proof that the §2.2 invariant is enforced by the type system:
 *
 *   NO MARKET SITS WAITING — `nextAction` and `nextActionDue` are REQUIRED on
 *   the common mixin and on every entity that extends it.
 *
 * The `@ts-expect-error` fixtures below are genuine negative proofs: if either
 * field becomes optional, the expected error disappears and `tsc` fails with
 * "Unused '@ts-expect-error' directive". This file contributes NO runtime
 * behaviour; it exists to be typechecked.
 */

import type { CommonFields } from '../types/common-fields.js';
import type { Market } from '../types/market.js';
import type { RevenueOpportunity } from '../types/revenue-opportunity.js';
import type { LetteredDeployment } from '../types/lettered-deployment.js';
import type { MarketMetric } from '../types/market-metric.js';

type IsOptional<T, K extends keyof T> = {} extends Pick<T, K> ? true : false;
type ExpectTrue<T extends true> = T;

// ---- positive proofs: the fields are NOT optional ----

type _CommonNextActionRequired = ExpectTrue<
  IsOptional<CommonFields, 'nextAction'> extends false ? true : false
>;
type _CommonNextActionDueRequired = ExpectTrue<
  IsOptional<CommonFields, 'nextActionDue'> extends false ? true : false
>;
type _MarketNextActionRequired = ExpectTrue<
  IsOptional<Market, 'nextAction'> extends false ? true : false
>;
type _MarketNextActionDueRequired = ExpectTrue<
  IsOptional<Market, 'nextActionDue'> extends false ? true : false
>;
type _OpportunityNextActionRequired = ExpectTrue<
  IsOptional<RevenueOpportunity, 'nextAction'> extends false ? true : false
>;
type _LetteredNextActionRequired = ExpectTrue<
  IsOptional<LetteredDeployment, 'nextAction'> extends false ? true : false
>;

// ---- negative proofs (must error if the invariant is ever relaxed) ----

// @ts-expect-error nextAction is REQUIRED — NO MARKET SITS WAITING
export const _missingNextAction: CommonFields = {
  state: 'X',
  objective: 'o',
  ownerId: 1,
  priority: 'p',
  nextActionDue: '2026-01-01T00:00:00Z',
};

// @ts-expect-error nextActionDue is REQUIRED — NO MARKET SITS WAITING
export const _missingNextActionDue: CommonFields = {
  state: 'X',
  objective: 'o',
  ownerId: 1,
  priority: 'p',
  nextAction: 'do it',
};

// @ts-expect-error a Market cannot exist without a next action
export const _marketMissingNextAction: Market = {
  id: 1,
  marketNumber: 1,
  universeOrganizationId: 1,
  ownerId: 1,
  priority: 'TIER_1' as never,
  state: 'IDENTIFIED' as never,
  objective: 'o',
  nextActionDue: '2026-01-01T00:00:00Z',
  activatedAt: '2026-01-01T00:00:00Z',
};

// ---- positive fixture: the shape is constructible when the invariant holds ----

export const _validCommon: CommonFields = {
  state: 'X',
  objective: 'o',
  ownerId: 1,
  priority: 'p',
  nextAction: 'do it',
  nextActionDue: '2026-01-01T00:00:00Z',
};

// ---- MarketMetric must NOT carry line items (R8) ----

type _NoCamelLineItems = ExpectTrue<
  'lineItems' extends keyof MarketMetric ? false : true
>;
type _NoSnakeLineItems = ExpectTrue<
  'line_items' extends keyof MarketMetric ? false : true
>;
type _NoOrderItems = ExpectTrue<
  'orderItems' extends keyof MarketMetric ? false : true
>;
type _NoOrders = ExpectTrue<'orders' extends keyof MarketMetric ? false : true>;
