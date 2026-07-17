/**
 * Lighthouse Engine v1.0 — Account Intelligence
 * Shows what we know, what we're missing, and how to develop each account.
 */
import type { RevenueLane } from '../data/mockSalesData';
export interface OrganizationIntel {
    organizationId: string;
    organizationName: string;
    territoryDevelopmentScore: number;
    knownContacts: number;
    missingContacts: string[];
    sportsMapped: string[];
    revenueLanesActivated: RevenueLane[];
    revenueLanesMissing: RevenueLane[];
    lastActivityDate: string | null;
    nextActionRecommendation: string;
    buyingWindows: BuyingWindow[];
    ecosystemLinks: EcosystemLink[];
}
export interface BuyingWindow {
    sport: string;
    season: string;
    urgency: 'NOW' | 'SOON' | 'LATER';
    description: string;
}
export interface EcosystemLink {
    organizationId: string;
    organizationName: string;
    relationship: string;
}
export declare function getOrganizationIntel(orgId: string): Promise<OrganizationIntel>;
//# sourceMappingURL=lighthouseEngine.d.ts.map