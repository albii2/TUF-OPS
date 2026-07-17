import type { Opportunity, Organization, Order, RevenueLane } from '@tuf/shared';
export declare function getNearCloseOpportunities(opportunities: Opportunity[]): Opportunity[];
export declare function getStuckOpportunities(opportunities: Opportunity[]): Opportunity[];
export declare function getLanePenetration(organizations: Organization[]): Record<RevenueLane, number>;
export declare function getOrganizationPriorityScore(org: Organization): number;
export declare function getOrderRiskScore(order: Order): number;
export declare function getOpenPipelineValue(opportunities: Opportunity[]): number;
export declare function getUntouchedAccounts(organizations: Organization[]): Organization[];
export declare function getStaleAccounts(organizations: Organization[], thresholdDays?: number): any;
export declare function getStaleOpportunities(opportunities: Opportunity[], thresholdDays?: number): any;
export declare function getMomentumState(input: {
    nearClose: number;
    stuck: number;
    stale: number;
    touched: number;
}): any;
export declare function getTerritoryHealthLabel(coveragePct: number): "Active" | "Weak Coverage" | "Building" | "Dominating";
export declare function getAccountsNeedingAction(organizations: Organization[]): Organization[];
//# sourceMappingURL=businessSelectors.d.ts.map