/**
 * Forge Engine v1.0 — Rule-Based Pipeline Intelligence
 * Helps the rep answer: what should I do today, and why?
 */
export interface ForgeMission {
    dailyBriefing: string;
    repName: string;
    territory: string;
    topAccounts: ForgeAccount[];
    pipelineGaps: string[];
    atRiskOpportunities: ForgeAccount[];
    nextBestLane: string;
    academyTip: string;
}
export interface ForgeAccount {
    organizationId: string;
    organizationName: string;
    priority: number;
    reason: string;
    recommendedAction: string;
    opportunityStage: string | null;
    lastActivityDate: string | null;
    daysSinceContact: number | null;
}
export declare function getForgeMission(): Promise<ForgeMission>;
//# sourceMappingURL=forgeEngine.d.ts.map