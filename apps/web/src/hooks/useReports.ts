import { useMemo } from 'react';
import { listActivities, type ActivityParams } from '../services/activitiesService';
import { getReportsSummary } from '../services/reportsService';

export function useReports() {
  return useMemo(() => getReportsSummary(), []);
}

export function useActivities(params: ActivityParams) {
  return useMemo(() => listActivities(params), [params.entityId, params.entityType, params.limit]);
}
