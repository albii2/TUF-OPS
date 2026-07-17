import type { Opportunity, Organization } from '../data/mockSalesData';
export type MomentumInput = {
    nearClose: number;
    stuck: number;
    stale: number;
    touched: number;
};
export declare function daysSince(dateIso: string, now?: number): number;
export declare function isStale(dateIso: string, thresholdDays?: number, now?: number): boolean;
export declare function getStaleOrganizations(organizations: Organization[], thresholdDays?: number): Organization[];
export declare function getStaleOpenOpportunities(opportunities: Opportunity[], thresholdDays?: number): Opportunity[];
export declare function getMomentumState(input: MomentumInput): 'HOT' | 'BUILDING' | 'STALLED' | 'CRITICAL';
//# sourceMappingURL=kpiUtils.d.ts.map