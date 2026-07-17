import type { Activity } from '../data/mockSalesData';
export type ActivityParams = {
    entityType?: Activity['entityType'];
    entityId?: string;
    limit?: number;
};
export declare function createActivity(input: {
    entityType: Activity['entityType'];
    entityId: string;
    message: string;
    timestamp?: string;
    user?: string;
}): Promise<Activity>;
export declare function listActivities(params?: ActivityParams): Promise<Activity[]>;
//# sourceMappingURL=activitiesService.d.ts.map