import { useEffect, useMemo, useState } from 'react';
import { listActivities, type ActivityParams } from '../services/activitiesService';
import type { Activity } from '../data/mockSalesData';
import { getReportsSummary } from '../services/reportsService';

export function useReports() {
  return useMemo(() => getReportsSummary(), []);
}

export function useActivities(params: ActivityParams): Activity[] {
  const [data, setData] = useState<Activity[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshKey((key) => key + 1);
    window.addEventListener('tuf:activity-updated', refresh);
    return () => window.removeEventListener('tuf:activity-updated', refresh);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listActivities(params).then((activities) => {
      if (!cancelled) setData(activities);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [params.entityId, params.entityType, params.limit, refreshKey]);

  return data;
}
