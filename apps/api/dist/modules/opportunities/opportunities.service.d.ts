import { Opportunity } from './opportunities.interface';
export declare function getOpportunityById(id: number): Promise<Opportunity>;
export declare function createOpportunity(opportunity: Partial<Opportunity> & {
    assignedRep?: string;
    assignedDirector?: string;
    organizationId?: number;
    estimated_value?: number;
    probability?: number;
    createdBy?: number;
    updatedBy?: number;
}): Promise<Opportunity>;
export declare function getOpportunitiesByOrganization(organizationId: string): Promise<Opportunity[]>;
export declare function getOpportunities(): Promise<Opportunity[]>;
export declare function getOrganizationChannelPenetration(organizationId: number): Promise<{
    channels: Record<string, string>;
    channel_penetration_score: number;
}>;
export declare function updateOpportunityStage(opportunityId: number, toStage: string, changedBy: number, note?: string, financialData?: Partial<Opportunity>): Promise<Opportunity>;
export declare function updateOpportunity(id: number, updates: Partial<Opportunity> & {
    assignedRep?: string;
    assignedDirector?: string;
    organizationId?: number;
    estimated_value?: number;
    updatedBy?: number;
    createdBy?: number;
}): Promise<Opportunity>;
//# sourceMappingURL=opportunities.service.d.ts.map