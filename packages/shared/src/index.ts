export type {
  Organization,
  TerritoryId,
  CoverageStatus,
  RevenueLane,
  LaneStatus,
  LaneStatusEntry,
  Priority,
  LeadTier,
  OrgStatus,
  TeamMember,
} from './types/organization.js';

export type {
  Opportunity,
  OpportunityStage,
} from './types/opportunity.js';

export { opportunityStages } from './types/opportunity.js';

export type {
  AppUser,
  Role,
  ManagedUser,
  UserStatus,
  SidebarKey,
} from './types/user.js';

export type {
  Candidate,
  CandidateStage,
  CandidateSource,
  CandidateActivity,
  CreateCandidateInput,
  UpdateCandidateInput,
  OfferStatus,
} from './types/candidate.js';

export {
  STAGE_ORDER,
  STAGE_LABELS,
} from './types/candidate.js';

export type {
  Order,
  OrderProductionStatus,
  OrderStage,
  Activity,
} from './types/order.js';

// -----------------------------
// TUF Ops 2.0 canonical types (ADDITIVE)
// -----------------------------
export type {
  CommonFields,
  CommonPriority,
  CommonState,
  RequiredCommonField,
} from './types/common-fields.js';

export type { Market } from './types/market.js';
export { MarketState, MARKET_STATES, MARKET_FORWARD_STATES } from './types/market.js';
export { MarketPriority, MARKET_PRIORITIES } from './types/market.js';

export type {
  RevenueOpportunity,
  RevenueOpportunityEngine,
} from './types/revenue-opportunity.js';
export {
  REVENUE_OPPORTUNITY_ENGINES,
  TeamUniformsState,
  TEAM_UNIFORMS_STATES,
  TEAM_UNIFORMS_FORWARD_STATES,
  IssueState,
  ISSUE_STATES,
} from './types/revenue-opportunity.js';

export type { LetteredDeployment } from './types/lettered-deployment.js';
export {
  LetteredState,
  LETTERED_STATES,
  LETTERED_LIFECYCLE_STATES,
} from './types/lettered-deployment.js';

export type {
  MarketMetric,
  UtmReferralSummary,
  ProductionFulfillmentSummary,
  MarketMetricValueProvenance,
  MarketMetricCacheSnapshot,
} from './types/market-metric.js';

// TUF Ops 2.0 Task engine (ADDITIVE — Wave 5A)
export type {
  Task,
  TaskBucket,
  TaskEntityKind,
} from './types/task.js';
export { TaskState, TASK_STATES, TASK_BUCKETS } from './types/task.js';

// TUF Ops 2.0 state machines (ADDITIVE)
export {
  MARKET_TRANSITIONS,
  MARKET_ENTRY_STATE,
  MARKET_TERMINAL_STATES,
  canTransition as canTransitionMarket,
} from './state-machines/market.js';

export {
  LETTERED_TRANSITIONS,
  LETTERED_ENTRY_STATE,
  LETTERED_TERMINAL_STATES,
  canTransition as canTransitionLettered,
} from './state-machines/lettered.js';

export {
  TEAM_UNIFORMS_TRANSITIONS,
  TEAM_UNIFORMS_ENTRY_STATE,
  TEAM_UNIFORMS_TERMINAL_STATES,
  canTransition as canTransitionTeamUniforms,
} from './state-machines/team-uniforms.js';

export {
  ISSUE_TRANSITIONS,
  ISSUE_ENTRY_STATE,
  ISSUE_TERMINAL_STATES,
  canTransition as canTransitionIssue,
} from './state-machines/issue.js';

// -----------------------------
// TUF Ops 2.0 canonical navigation (ADDITIVE — Wave 2A)
// -----------------------------
export type {
  CanonicalRole,
  NavItem,
  NavSection,
} from './navigation.js';
export {
  CANONICAL_ROLES,
  NAVIGATION,
  isVisibleTo,
  navigationForRole,
  allNavigationRoutes,
} from './navigation.js';
