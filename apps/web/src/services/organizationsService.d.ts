import type { CoverageStatus, Organization, TerritoryId } from '../data/mockSalesData';
export type OrganizationListParams = {
    search?: string;
    status?: 'ALL' | Organization['status'];
    rep?: string;
    territory?: 'ALL' | TerritoryId;
    director?: 'ALL' | string;
    coverageStatus?: 'ALL' | CoverageStatus;
    priority?: 'ALL' | Organization['priority'];
    refreshKey?: number;
};
export declare function listOrganizations(params?: OrganizationListParams): Promise<Organization[]>;
export declare function createOrganization(input: {
    name: string;
    accountType: string;
    city?: string;
    state?: string;
    assignedRep?: string;
    assignedDirector?: string;
    territory?: TerritoryId;
}): Promise<Organization>;
export declare function updateOrganization(id: string, patch: Partial<{
    assignedRep: string;
    assignedDirector: string;
    priority: Organization['priority'];
    leadTier: Organization['leadTier'];
    nextAction: string;
}>): Promise<Organization | null>;
export declare function getOrganizationById(id: string): Promise<Organization | undefined>;
export declare function listUntouchedAccounts(): Organization[];
export declare function listStaleAccounts(): Organization[];
export declare function listAccountsNeedingAction(): Organization[];
//# sourceMappingURL=organizationsService.d.ts.map