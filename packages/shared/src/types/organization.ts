export type TerritoryId = 'metro' | 'north' | 'west' | 'south' | 'il' | 'wi';
export type CoverageStatus = 'UNTOUCHED' | 'CONTACTED' | 'ENGAGED' | 'NEGOTIATING' | 'CLOSED';
export type RevenueLane = 'UNIFORM' | 'TRAVEL_GEAR' | 'TEAM_STORE' | 'LETTERMAN';
export type LaneStatus = 'OPEN' | 'ACTIVE' | 'WON' | 'LOST';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type LeadTier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'UNASSIGNED';
export type OrgStatus = 'ACTIVE' | 'WATCH' | 'NEW';

export interface LaneStatusEntry {
  status: LaneStatus;
  estimatedValue: number;
  activeOpportunityCount: number;
  nextAction: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'OWNER' | 'DIRECTOR' | 'REP' | 'OPS';
  territoryIds: TerritoryId[];
  active: boolean;
}

export interface Organization {
  id: string;
  name: string;
  city: string;
  state: string;
  assignedRep: string;
  assignedRepId?: number | null;
  assignedDirector: string;
  assignedDirectorId?: number | null;
  territory: TerritoryId;
  schoolPhone?: string;
  athleticDirectorName?: string;
  athleticDirectorEmail?: string;
  athleticDirectorPhone?: string;
  headCoachName?: string;
  headCoachEmail?: string;
  headCoachPhone?: string;
  coverageStatus: CoverageStatus;
  priority: Priority;
  pipelineValue: number;
  status: OrgStatus;
  nextAction: string;
  lastActivity: string;
  leadTier?: LeadTier;
  /** Launch deployment cluster (e.g. 'minneapolis_metro', 'central_mn') — Fall/Winter 2026 territory grouping. */
  launchCluster?: string | null;
  /** Raw TUF priority from the organizations table (e.g. 'TIER_1' | 'TIER_2' | 'TIER_3'). */
  tufPriority?: string | null;
  laneStatuses: Record<RevenueLane, LaneStatusEntry>;
  expansionRecommendation: string;
}
