export type DocumentType = 'nda' | 'performance_agreement' | 'commission_form' | 'territory_letter' | 'offer_letter';
export interface DocumentData {
    type: DocumentType;
    repName: string;
    repEmail: string;
    territory?: string;
    subterritory?: string;
    date: string;
    companyName?: string;
    ndaTermMonths?: number;
    callsPerDay?: number;
    meetingsPerWeek?: number;
    dealsPerMonth?: number;
    reviewDate?: string;
    directorName?: string;
    commissionRate?: string;
    paymentSchedule?: string;
    schoolCount?: number;
    zone?: string;
    assignedDirector?: string;
    effectiveDate?: string;
    position?: string;
    startDate?: string;
    compensation?: string;
    reportsTo?: string;
}
export declare function generateDocument(data: DocumentData): string;
//# sourceMappingURL=documentGenerator.d.ts.map