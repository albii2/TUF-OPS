import type { TerritoryId } from '@tuf/shared';
export type Territory = {
    id: TerritoryId;
    name: string;
    accounts: number;
    untouched: number;
    pipeline: number;
    closed: number;
    lanePenetration: {
        uniform: number;
        teamStore: number;
        travelGear: number;
        letterman: number;
    };
};
export type WorkloadRow = {
    rep: string;
    territory: TerritoryId;
    assignedAccounts: number;
    untouchedAccounts: number;
    activeOpportunities: number;
    nearCloseOpportunities: number;
    stuckOpportunities: number;
    closedWonMTD: number;
    pipelineValue: number;
};
export declare const territories: Territory[];
export declare const repCoverage: WorkloadRow[];
export declare const untouchedAccountsQueue: any;
//# sourceMappingURL=territoryMock.d.ts.map