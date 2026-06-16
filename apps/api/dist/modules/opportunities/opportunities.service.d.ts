import { Opportunity, OpportunityStage } from './opportunities.interface';
export declare function getOpportunityById(id: number): Promise<Opportunity>;
export declare function createOpportunity(opportunity: Partial<Opportunity>): Promise<Opportunity>;
export declare function getOpportunitiesByOrganization(organizationId: string): Promise<Opportunity[]>;
export declare function getOpportunities(): Promise<Opportunity[]>;
export declare function getOrganizationChannelPenetration(organizationId: number): Promise<{
    channels: {
        uniform: OpportunityStage;
        travel_gear: OpportunityStage;
        team_store: OpportunityStage;
        letterman: OpportunityStage;
    };
    channel_penetration_score: number;
}>;
export declare function updateOpportunityStage(opportunityId: number, toStage: OpportunityStage, changedBy: number, note?: string, financialData?: Partial<Opportunity>): Promise<Opportunity>;
export declare function updateOpportunity(id: number, updates: Partial<Opportunity>): Promise<Opportunity>;
//# sourceMappingURL=opportunities.service.d.ts.map