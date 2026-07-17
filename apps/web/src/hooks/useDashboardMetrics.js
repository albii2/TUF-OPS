import { useQuery } from '@tanstack/react-query';
import { fetchDashboardMetrics, emptyDashboardMetrics, queryKeys } from '../api';
export function useDashboardMetrics(role, userId, userEmail) {
    const query = useQuery({
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
//# sourceMappingURL=useDashboardMetrics.js.map