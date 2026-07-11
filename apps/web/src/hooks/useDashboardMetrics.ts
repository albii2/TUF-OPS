import { useEffect, useState } from 'react';
import type { Role } from '@tuf/shared';
import { emptyDashboardMetrics, fetchDashboardMetrics, type DashboardMetrics } from '../services/dashboardMetricsService';
import { DATA_MODE } from '../services/dataMode';

export function useDashboardMetrics(role: Role, userId?: string, userEmail?: string) {
  const [metrics, setMetrics] = useState<DashboardMetrics>(() => emptyDashboardMetrics());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(DATA_MODE === 'api');

  useEffect(() => {
    let cancelled = false;
    if (DATA_MODE !== 'api') {
      setMetrics(emptyDashboardMetrics());
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    fetchDashboardMetrics(role, userId, userEmail)
      .then((next) => { if (!cancelled) { setMetrics(next); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Dashboard metrics unavailable'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [role, userId, userEmail]);

  return { metrics, error, loading, isApiBacked: DATA_MODE === 'api' };
}
