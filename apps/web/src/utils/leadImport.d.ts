type RawRow = Record<string, string>;
export type NormalizedLead = {
    organizationName: string;
    accountType: string;
    sourceUrl: string;
    websiteUrl: string;
    brandColors: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    enrollmentOrSize: string;
    districtOrLeague: string;
    primaryContactName: string;
    primaryContactTitle: string;
    primaryContactEmail: string;
    primaryContactPhone: string;
    athleticDirectorName: string;
    athleticDirectorEmail: string;
    athleticDirectorPhone: string;
    headCoachName: string;
    headCoachEmail: string;
    headCoachPhone: string;
    sportsOffered: string[];
    sportUrls: string[];
    tufZone: string;
    territory: 'metro' | 'north' | 'west' | 'south' | '';
    tufPriority: string;
    sourceType: string;
    duplicateKey: string;
    validationErrors: string[];
    assignedRepName: string;
    assignedDirectorName: string;
};
export declare function mapCsvHeaders(headers: string[]): {
    [k: string]: string;
};
export declare function parseSportsFromWideColumns(row: RawRow): {
    sportsOffered: string[];
    sportUrls: string[];
};
export declare function buildDuplicateKey(row: {
    organizationName: string;
    state: string;
}): string;
export declare function validateLeadRow(row: NormalizedLead): string[];
export declare function normalizeLeadRow(rawRow: RawRow): NormalizedLead;
export declare function parseCsvText(text: string): string[][];
export {};
//# sourceMappingURL=leadImport.d.ts.map