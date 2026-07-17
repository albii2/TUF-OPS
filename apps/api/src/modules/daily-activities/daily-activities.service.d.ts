import type { DailyActivity, DailyActivityInput } from './daily-activities.interface';
export declare function upsertDailyActivity(userId: number, input: DailyActivityInput): Promise<DailyActivity>;
export declare function getTodayActivities(requestingUserId: number, role: string): Promise<(DailyActivity & {
    user_name: string;
    user_role: string;
})[]>;
export declare function getActivityHistory(userId: number, days?: number): Promise<DailyActivity[]>;
//# sourceMappingURL=daily-activities.service.d.ts.map