import { apiClient } from './apiClient';
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

export function emptyDashboardMetrics(): DashboardMetrics {
  return {
    assigned_schools: 0,
    touched_schools: 0,
    untouched_schools: 0,
    active_opportunities: 0,
    follow_ups_due: 0,
    action_needed_items: 0,
    closed_won_count: 0,
    paid_order_count: 0,
    paid_revenue: 0,
    gross_profit: 0,
    rep_commission_estimate: 0,
    director_override_estimate: 0,
    month_to_date_activity: 0,
    total_opportunities_count: 0,
    closed_lost_count: 0,
    total_actual_revenue: 0,
    total_gross_profit: 0,
    total_rep_commission: 0,
    total_director_override: 0,
  };
}

function numericId(id?: string) {
  if (!id || !/^\d+$/.test(id)) return undefined;
  return Number(id);
}

export async function fetchDashboardMetrics(role: Role, userId?: string, userEmail?: string): Promise<DashboardMetrics> {
  try {
    if (role === 'ADMIN') return apiClient<DashboardMetrics>('/reporting/owner-dashboard');
    if (role === 'DIRECTOR') {
      const id = numericId(userId);
      if (id) return apiClient<DashboardMetrics>(`/reporting/director-dashboard/${id}`);
      if (userEmail) return apiClient<DashboardMetrics>('/reporting/director-dashboard-by-email', { query: { email: userEmail } });
      throw new Error('Director dashboard requires backend numeric user id or email in API mode');
    }
    if (role === 'REP') {
      const id = numericId(userId);
      if (id) return apiClient<DashboardMetrics>(`/reporting/rep-dashboard/${id}`);
      if (userEmail) return apiClient<DashboardMetrics>('/reporting/rep-dashboard-by-email', { query: { email: userEmail } });
      throw new Error('Rep dashboard requires backend numeric user id or email in API mode');
    }
  } catch {
    console.warn('[dashboardMetrics] API unavailable — using empty metrics');
  }
  return emptyDashboardMetrics();
}
