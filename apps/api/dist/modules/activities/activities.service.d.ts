import { Activity } from './activities.interface';
export declare function createActivity(activity: Partial<Activity>): Promise<Activity>;
export declare function getActivitiesByOpportunity(opportunityId: number): Promise<Activity[]>;
export declare function getActivitiesByOrganization(organizationId: number): Promise<Activity[]>;
export declare function markActivityComplete(activityId: number, completedBy: number): Promise<Activity>;
//# sourceMappingURL=activities.service.d.ts.map