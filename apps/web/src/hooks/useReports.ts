import { useQuery } from '@tanstack/react-query';
import { listActivities, type ActivityParams } from '../services/activitiesService';
import { getReportsSummary } from '../services/reportsService';
import { queryKeys } from '../api';
import type { Activity } from '../data/mockSalesData';

export function useReports() {
  return useQuery({
    queryKey: queryKeys.reports.summary(),
    queryFn: getReportsSummary,
    staleTime: Infinity,
  });
}

export function useActivities(params: ActivityParams) {
  return useQuery<Activity[]>({
    queryKey: queryKeys.activities.list(params),
    queryFn: () => listActivities(params),
  });
}
