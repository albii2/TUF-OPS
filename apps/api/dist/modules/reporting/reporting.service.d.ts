import { OpportunityStage } from '../opportunities/opportunities.interface';
export interface DashboardMetrics {
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
    opportunities_by_stage: Record<OpportunityStage, number>;
    closed_lost_count: number;
    total_actual_revenue: number;
    total_gross_profit: number;
    total_rep_commission: number;
    total_director_override: number;
}
export declare function getOwnerDashboardMetrics(): Promise<DashboardMetrics>;
export declare function getAdminDashboardMetrics(): Promise<DashboardMetrics>;
export declare function getSchoolCoverageMetrics(): Promise<Pick<DashboardMetrics, 'assigned_schools' | 'touched_schools' | 'untouched_schools'>>;
export declare function getCommissionMetrics(): Promise<Pick<DashboardMetrics, 'paid_order_count' | 'paid_revenue' | 'gross_profit' | 'rep_commission_estimate' | 'director_override_estimate'>>;
export declare function getDirectorDashboardMetrics(directorId: number): Promise<DashboardMetrics>;
export declare function getRepDashboardMetrics(repId: number): Promise<DashboardMetrics>;
export declare function getDirectorDashboardMetricsByEmail(email: string): Promise<DashboardMetrics>;
export declare function getRepDashboardMetricsByEmail(email: string): Promise<DashboardMetrics>;
//# sourceMappingURL=reporting.service.d.ts.map