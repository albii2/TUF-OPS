import type { AppUser } from '../types';
import type { Opportunity, Order, Organization } from '../data/mockSalesData';
export declare function getViewer(): any;
export declare function getDirectorRepSet(directorName: string): Set<unknown>;
export declare function getDirectorTerritorySet(directorName: string): Set<TerritoryId>;
export declare function canViewOrganization(org: Organization): boolean;
export declare function canViewOpportunity(opp: Opportunity): boolean;
export declare function canViewOrder(order: Order, linkedOpportunity?: Opportunity): boolean;
export declare function isRepCertified(user: AppUser | null): boolean;
export declare function canCreateOpportunity(): boolean;
export declare function canAdvanceOpportunity(opp: Opportunity): boolean;
export declare function getAdvanceDeniedMessage(opp: Opportunity): "" | "You do not have permission to advance this opportunity." | "Log in before advancing an opportunity." | "Onboarding and certification is required before you can perform sales actions." | "You can only advance opportunities assigned to you.";
//# sourceMappingURL=roleScope.d.ts.map