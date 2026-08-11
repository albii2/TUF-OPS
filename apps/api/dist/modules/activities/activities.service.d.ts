import { Activity } from './activities.interface';
export declare function createActivity(activity: Partial<Activity>): Promise<Activity>;
export declare function getActivitiesByOpportunity(opportunityId: number): Promise<Activity[]>;
export declare function getActivitiesByOrganization(organizationId: number): Promise<Activity[]>;
export declare function getAllActivities(limit?: number): Promise<Activity[]>;
export declare function markActivityComplete(activityId: number, completedBy: number): Promise<Activity>;
export interface RepActivityRecord {
    id: number;
    user_id: number;
    opportunity_id: number | null;
    activity_type: string;
    notes: string | null;
    created_at: Date;
    user_full_name?: string | null;
    user_email?: string | null;
}
export declare function createRepActivity(data: {
    user_id: number;
    opportunity_id: number;
    activity_type: string;
    notes?: string | null;
}): Promise<RepActivityRecord>;
export declare function getRepActivitiesByOpportunity(opportunityId: number): Promise<RepActivityRecord[]>;
//# sourceMappingURL=activities.service.d.ts.map