export interface DashboardMetrics {
  total_opportunities_count: number;
  opportunities_by_stage: any;
  closed_won_count: number;
  closed_lost_count: number;
  total_actual_revenue: number;
  total_gross_profit: number;
  total_rep_commission: number;
  total_director_override: number;
}

const dummyMetrics: DashboardMetrics = {
  total_opportunities_count: 0,
  opportunities_by_stage: {},
  closed_won_count: 0,
  closed_lost_count: 0,
  total_actual_revenue: 0,
  total_gross_profit: 0,
  total_rep_commission: 0,
  total_director_override: 0,
};

export async function getDirectorDashboardMetrics(directorId: number): Promise<DashboardMetrics> {
  console.log(`STUB: Fetching metrics for director ${directorId}`);
  return dummyMetrics;
}

export async function getRepDashboardMetrics(repId: number): Promise<DashboardMetrics> {
  console.log(`STUB: Fetching metrics for rep ${repId}`);
  return dummyMetrics;
}
