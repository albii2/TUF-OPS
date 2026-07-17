import type { RevenueLane } from '../data/mockSalesData';
export declare function toTitleCase(value: string): string;
export declare const normalizeAccountName: (value: string) => string;
export declare const normalizeSport: (value: string) => string;
export declare const normalizeProgramLevel: (value: string) => string;
export declare const normalizeSeasonCode: (value: string) => string;
export declare function getSeasonLabel(code: string): string;
export declare function getLaneLabel(lane: RevenueLane): string;
export declare function buildOpportunityDisplayName(input: {
    programLevel: string;
    sport: string;
    seasonCode: string;
    lanes: RevenueLane[];
}): string;
//# sourceMappingURL=naming.d.ts.map