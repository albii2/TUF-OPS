import { useEffect, useMemo, useState } from 'react';
import { listActivities, type ActivityParams } from '../services/activitiesService';
import { getReportsSummary } from '../services/reportsService';

export function useReports() {
  return useMemo(() => getReportsSummary(), []);
}

export function useActivities(params: ActivityParams) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshKey((key) => key + 1);
    window.addEventListener('tuf:activity-updated', refresh);
    return () => window.removeEventListener('tuf:activity-updated', refresh);
  }, []);

  return useMemo(() => listActivities(params), [params.entityId, params.entityType, params.limit, refreshKey]);
}
