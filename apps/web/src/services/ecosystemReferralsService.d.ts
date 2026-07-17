/**
 * NOTE: Ecosystem Referrals are currently stored in localStorage only.
 * There is no backend API endpoint for referrals yet (no /api/ecosystem-referrals
 * or equivalent route in the API server). All CRUD operations operate on the
 * local `tuf_ops_ecosystem_referrals_v3` key.
 *
 * When a backend endpoint becomes available, the following functions should be
 * updated to use apiClient:
 *   - listEcosystemReferrals → GET /api/ecosystem-referrals
 *   - createEcosystemReferral → POST /api/ecosystem-referrals
 *   - getEcosystemReferralSummary, getReferralSourceEffectiveness,
 *     getReferralRepEffectiveness → derived from listEcosystemReferrals
 */
export type ReferredOrganizationType = 'Youth Football' | 'Youth Basketball' | 'Youth Wrestling' | 'Youth Baseball' | 'Youth Softball' | 'Volleyball Club' | 'Booster Club' | 'Parent Organization' | 'Other';
export type WarmIntroductionStatus = 'Mentioned' | 'Referred' | 'Introduced' | 'Contacted' | 'Qualified';
export type EcosystemReferral = {
    id: string;
    referralSourceOrganizationId: string;
    referralSourceOrganization: string;
    referralSourceContact: string;
    referralSourceRole: string;
    referredOrganizationName: string;
    referredOrganizationType: ReferredOrganizationType;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    relationshipNotes: string;
    warmIntroductionStatus: WarmIntroductionStatus;
    linkedOpportunityId?: string;
    linkedOpportunityName?: string;
    assignedRep: string;
    createdAt: string;
    estimatedRevenue: number;
    revenueGenerated: number;
};
export type ReferralPipelineParams = {
    status?: 'ALL' | WarmIntroductionStatus;
    rep?: string;
    sourceOrganizationId?: string;
    search?: string;
    refreshKey?: number;
};
export declare const referredOrganizationTypes: ReferredOrganizationType[];
export declare const warmIntroductionStatuses: WarmIntroductionStatus[];
export declare function listEcosystemReferrals(params?: ReferralPipelineParams): EcosystemReferral[];
export declare function createEcosystemReferral(input: {
    referralSourceOrganizationId: string;
    referralSourceContact: string;
    referralSourceRole: string;
    referredOrganizationName: string;
    referredOrganizationType: ReferredOrganizationType;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    relationshipNotes: string;
    warmIntroductionStatus: WarmIntroductionStatus;
    linkedOpportunityId?: string;
}): Promise<EcosystemReferral>;
export declare function getEcosystemReferralSummary(referrals?: EcosystemReferral[]): {
    created: number;
    qualified: number;
    revenueGenerated: number;
};
export declare function getReferralSourceEffectiveness(referrals?: EcosystemReferral[]): {
    source: string;
    created: number;
    qualified: number;
    revenueGenerated: number;
}[];
export declare function getReferralRepEffectiveness(referrals?: EcosystemReferral[]): {
    rep: string;
    created: number;
    qualified: number;
    revenueGenerated: number;
}[];
//# sourceMappingURL=ecosystemReferralsService.d.ts.map