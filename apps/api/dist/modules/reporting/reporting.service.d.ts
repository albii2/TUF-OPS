import { OpportunityStage } from '../opportunities/opportunities.interface';
export interface DashboardMetrics {
    total_opportunities_count: number;
    opportunities_by_stage: Record<OpportunityStage, number>;
    closed_won_count: number;
    closed_lost_count: number;
    total_actual_revenue: number;
    total_gross_profit: number;
    total_rep_commission: number;
    total_director_override: number;
}
export declare function getOwnerDashboardMetrics(): Promise<DashboardMetrics>;
export declare function getDirectorDashboardMetrics(directorId: number): Promise<DashboardMetrics>;
export declare function getRepDashboardMetrics(repId: number): Promise<DashboardMetrics>;
//# sourceMappingURL=reporting.service.d.ts.map