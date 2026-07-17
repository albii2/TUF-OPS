import type { TeamMember, Organization, Opportunity, Order, Activity } from '@tuf/shared';
export type { RevenueLane, LaneStatus, OpportunityStage, CoverageStatus, TerritoryId, TeamMember, Organization, Opportunity, Order, Activity, } from '@tuf/shared';
export { opportunityStages } from '@tuf/shared';
export declare const teamMembers: TeamMember[];
export declare const organizations: Organization[];
export declare const opportunities: Opportunity[];
export declare const orders: Order[];
export declare const activities: Activity[];
export declare const reportsSummary: {
    weeklySummary: {
        pipelineAdded: number;
        closedWon: number;
        newOrganizations: number;
        blockedOrders: number;
    };
    monthlySummary: {
        pipelineTotal: number;
        closedWon: number;
        winRate: number;
        averageDeal: number;
    };
    lanePerformance: any;
    repPerformance: never[];
};
export declare const opsWorkspaceQueue: {
    NEEDS_REVIEW: Order[];
    READY_FOR_VENDOR: Order[];
    IN_PRODUCTION: Order[];
    BLOCKED: Order[];
    COMPLETED: Order[];
};
//# sourceMappingURL=mockSalesData.d.ts.map