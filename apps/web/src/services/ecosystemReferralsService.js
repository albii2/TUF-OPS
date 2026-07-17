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
import { getStoredUser } from '../auth';
import { listOrganizations } from './organizationsService';
import { listOpportunities } from './opportunitiesService';
import { getManagedRepNamesForDirector } from './usersService';
export const referredOrganizationTypes = [
    'Youth Football',
    'Youth Basketball',
    'Youth Wrestling',
    'Youth Baseball',
    'Youth Softball',
    'Volleyball Club',
    'Booster Club',
    'Parent Organization',
    'Other',
];
export const warmIntroductionStatuses = ['Mentioned', 'Referred', 'Introduced', 'Contacted', 'Qualified'];
const LOCAL_REFERRALS_KEY = 'tuf_ops_ecosystem_referrals_v3';
const LEGACY_REFERRALS_KEYS = ['tuf_ops_mock_ecosystem_referrals_v1', 'tuf_ops_ecosystem_referrals_v2'];
function readLocalReferrals() {
    try {
        LEGACY_REFERRALS_KEYS.forEach((key) => localStorage.removeItem(key));
        return JSON.parse(localStorage.getItem(LOCAL_REFERRALS_KEY) || '[]');
    }
    catch {
        return [];
    }
}
function writeLocalReferrals(rows) {
    localStorage.setItem(LOCAL_REFERRALS_KEY, JSON.stringify(rows));
}
function getAllReferrals() {
    return readLocalReferrals();
}
export function listEcosystemReferrals(params = {}) {
    const user = getStoredUser();
    return getAllReferrals().filter((referral) => {
        const matchesStatus = !params.status || params.status === 'ALL' || referral.warmIntroductionStatus === params.status;
        const matchesRep = !params.rep || params.rep === 'ALL' || referral.assignedRep === params.rep;
        const matchesSource = !params.sourceOrganizationId || referral.referralSourceOrganizationId === params.sourceOrganizationId;
        const matchesSearch = !(params.search ?? '').trim() || [
            referral.referralSourceOrganization,
            referral.referralSourceContact,
            referral.referredOrganizationName,
            referral.contactName,
            referral.contactEmail,
            referral.assignedRep,
        ].join(' ').toLowerCase().includes((params.search ?? '').toLowerCase());
        const roleScoped = !user || user.role === 'ADMIN' || user.role === 'REGIONAL_DIRECTOR' || user.role === 'OPERATIONS'
            ? true
            : user.role === 'DIRECTOR'
                ? getManagedRepNamesForDirector(user.name).includes(referral.assignedRep)
                : referral.assignedRep === user.name;
        return matchesStatus && matchesRep && matchesSource && matchesSearch && roleScoped;
    });
}
export async function createEcosystemReferral(input) {
    const orgs = await listOrganizations({});
    const source = orgs.find((org) => org.id === input.referralSourceOrganizationId);
    const opps = await listOpportunities({});
    const linkedOpportunity = input.linkedOpportunityId ? opps.find((opp) => opp.id === input.linkedOpportunityId) : undefined;
    const user = getStoredUser();
    const row = {
        id: `ref-local-${Date.now()}`,
        referralSourceOrganizationId: input.referralSourceOrganizationId,
        referralSourceOrganization: source?.name ?? 'Unknown Organization',
        referralSourceContact: input.referralSourceContact,
        referralSourceRole: input.referralSourceRole,
        referredOrganizationName: input.referredOrganizationName,
        referredOrganizationType: input.referredOrganizationType,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        relationshipNotes: input.relationshipNotes,
        warmIntroductionStatus: input.warmIntroductionStatus,
        linkedOpportunityId: linkedOpportunity?.id,
        linkedOpportunityName: linkedOpportunity?.title,
        assignedRep: source?.assignedRep || user?.name || 'Unassigned',
        createdAt: new Date().toISOString().slice(0, 10),
        estimatedRevenue: input.warmIntroductionStatus === 'Qualified' ? 12000 : 0,
        revenueGenerated: 0,
    };
    writeLocalReferrals([row, ...readLocalReferrals()]);
    return row;
}
export function getEcosystemReferralSummary(referrals = listEcosystemReferrals({})) {
    const qualified = referrals.filter((referral) => referral.warmIntroductionStatus === 'Qualified');
    return {
        created: referrals.length,
        qualified: qualified.length,
        revenueGenerated: referrals.reduce((sum, referral) => sum + referral.revenueGenerated, 0),
    };
}
export function getReferralSourceEffectiveness(referrals = listEcosystemReferrals({})) {
    const sourceNames = Array.from(new Set(referrals.map((referral) => referral.referralSourceOrganization)));
    return sourceNames.map((source) => {
        const sourceRows = referrals.filter((referral) => referral.referralSourceOrganization === source);
        return {
            source,
            created: sourceRows.length,
            qualified: sourceRows.filter((referral) => referral.warmIntroductionStatus === 'Qualified').length,
            revenueGenerated: sourceRows.reduce((sum, referral) => sum + referral.revenueGenerated, 0),
        };
    }).sort((a, b) => b.qualified - a.qualified || b.created - a.created);
}
export function getReferralRepEffectiveness(referrals = listEcosystemReferrals({})) {
    const reps = Array.from(new Set(referrals.map((referral) => referral.assignedRep)));
    return reps.map((rep) => {
        const repRows = referrals.filter((referral) => referral.assignedRep === rep);
        return {
            rep,
            created: repRows.length,
            qualified: repRows.filter((referral) => referral.warmIntroductionStatus === 'Qualified').length,
            revenueGenerated: repRows.reduce((sum, referral) => sum + referral.revenueGenerated, 0),
        };
    }).sort((a, b) => b.qualified - a.qualified || b.created - a.created);
}
//# sourceMappingURL=ecosystemReferralsService.js.map