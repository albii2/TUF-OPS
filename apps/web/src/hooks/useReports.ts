import { useEffect, useState } from 'react';
import { listActivities, type ActivityParams } from '../services/activitiesService';
import { getReportsSummary } from '../services/reportsService';
import type { Activity } from '../data/mockSalesData';

export function useReports() {
  const [summary, setSummary] = useState(getReportsSummary());
  return summary;
}

export function useActivities(params: ActivityParams) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshKey((key) => key + 1);
    window.addEventListener('tuf:activity-updated', refresh);
    return () => window.removeEventListener('tuf:activity-updated', refresh);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listActivities(params).then((result) => {
      if (!cancelled) setActivities(result);
    }).catch(() => {
      if (!cancelled) setActivities([]);
    });
    return () => { cancelled = true; };
  }, [params.entityId, params.entityType, params.limit, refreshKey]);

  return activities;
}
