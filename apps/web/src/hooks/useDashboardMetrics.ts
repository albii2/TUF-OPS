import { useQuery } from '@tanstack/react-query';
import type { Role } from '@tuf/shared';
import { fetchDashboardMetrics, emptyDashboardMetrics, queryKeys } from '../api';
import type { DashboardMetrics } from '../services/dashboardMetricsService';

export function useDashboardMetrics(role: Role, userId?: string, userEmail?: string) {
  const query = useQuery<DashboardMetrics>({
    queryKey: queryKeys.dashboard.metrics(role, userId, userEmail),
    queryFn: () => fetchDashboardMetrics(role, userId, userEmail),
    placeholderData: emptyDashboardMetrics,
  });

  return {
    metrics: query.data ?? emptyDashboardMetrics(),
    error: query.error ? (query.error instanceof Error ? query.error.message : 'Dashboard metrics unavailable') : null,
    loading: query.isLoading,
    isApiBacked: true,
  };
}
