import type { Opportunity, OpportunityStage, RevenueLane } from '@tuf/shared';
export type OpportunityListParams = {
    search?: string;
    stage?: 'ALL' | OpportunityStage;
    lane?: 'ALL' | RevenueLane;
    rep?: string;
    sport?: string;
    refreshKey?: number;
};
export declare const nextActionByStage: Record<OpportunityStage, string>;
export declare function listOpportunities(params?: OpportunityListParams): Promise<Opportunity[]>;
export declare function createOpportunity(input: {
    organizationId: string;
    organizationName: string;
    programLevel: string;
    sport: string;
    seasonCode: string;
    lane: RevenueLane;
    assignedRep: string;
    value: number;
    organizationAssignedDirector?: string;
}): Promise<Opportunity>;
export declare function updateOpportunity(id: string, patch: Partial<Opportunity>): Promise<Opportunity>;
export declare function deleteOpportunity(id: string): Promise<boolean>;
export declare function addOpportunityLane(id: string, lane: RevenueLane): Promise<Opportunity | undefined>;
export declare function removeOpportunityLane(id: string, lane: RevenueLane): Promise<Opportunity | undefined>;
export declare function logOpportunityActivity(id: string, message: string): Promise<Opportunity | undefined>;
export declare function updateOpportunityStage(id: string, stage: OpportunityStage): Promise<Opportunity | undefined>;
export declare function getOpportunityStages(): OpportunityStage[];
export declare function getRevenueLanes(): any;
export declare function getOpportunityById(id: string): Promise<Opportunity | undefined>;
//# sourceMappingURL=opportunitiesService.d.ts.map