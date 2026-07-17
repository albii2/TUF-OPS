export interface DailyActivityEntry {
    id: number;
    user_id: number;
    activity_date: string;
    calls: number;
    emails: number;
    texts: number;
    linkedin_msgs: number;
    conversations: number;
    meetings: number;
    quotes: number;
    follow_ups: number;
    new_opps: number;
    next_actions: string | null;
    user_name?: string;
    user_role?: string;
}
export interface DailyActivityInput {
    calls?: number;
    emails?: number;
    texts?: number;
    linkedin_msgs?: number;
    conversations?: number;
    meetings?: number;
    quotes?: number;
    follow_ups?: number;
    new_opps?: number;
    next_actions?: string;
}
export declare function useDailyActivities(): {
    today: NoInfer<DailyActivityEntry[]>;
    myEntry: DailyActivityEntry | null;
    loading: boolean;
    saving: boolean;
    error: string | null;
    fetchToday: () => void;
    saveActivity: import("@tanstack/react-query").UseMutateAsyncFunction<any, Error, DailyActivityInput, unknown>;
};
//# sourceMappingURL=useDailyActivities.d.ts.map