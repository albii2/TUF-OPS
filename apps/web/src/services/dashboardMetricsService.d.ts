import type { Role } from '../types';
export type DashboardMetrics = {
    assigned_schools: number;
    touched_schools: number;
    untouched_schools: number;
    active_opportunities: number;
    follow_ups_due: number;
    action_needed_items: number;
    closed_won_count: number;
    paid_order_count: number;
    paid_revenue: number;
    gross_profit: number;
    rep_commission_estimate: number;
    director_override_estimate: number;
    month_to_date_activity: number;
    total_opportunities_count: number;
    closed_lost_count: number;
    total_actual_revenue: number;
    total_gross_profit: number;
    total_rep_commission: number;
    total_director_override: number;
};
export declare function emptyDashboardMetrics(): DashboardMetrics;
export declare function fetchDashboardMetrics(role: Role, userId?: string, userEmail?: string): Promise<DashboardMetrics>;
//# sourceMappingURL=dashboardMetricsService.d.ts.map