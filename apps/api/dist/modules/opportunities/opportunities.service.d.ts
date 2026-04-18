import { Opportunity, OpportunityStage } from './opportunities.interface';
export declare function createOpportunity(opportunity: Partial<Opportunity>): Promise<Opportunity>;
export declare function getOpportunitiesByOrganization(organizationId: string): Promise<Opportunity[]>;
export declare function updateOpportunityStage(opportunityId: number, toStage: OpportunityStage, changedBy: number, note?: string, financialData?: Partial<Opportunity>): Promise<Opportunity>;
//# sourceMappingURL=opportunities.service.d.ts.map