import { useQuery } from '@tanstack/react-query';
import { listActivities } from '../services/activitiesService';
import { getReportsSummary } from '../services/reportsService';
import { queryKeys } from '../api';
export function useReports() {
    return useQuery({
        queryKey: queryKeys.reports.summary(),
        queryFn: getReportsSummary,
        staleTime: Infinity,
    });
}
export function useActivities(params) {
    return useQuery({
        queryKey: queryKeys.activities.list(params),
        queryFn: () => listActivities(params),
    });
}
//# sourceMappingURL=useReports.js.map