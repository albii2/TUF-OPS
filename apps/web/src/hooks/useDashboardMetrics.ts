import { useEffect, useState } from 'react';
import type { Role } from '@tuf/shared';
import { emptyDashboardMetrics, fetchDashboardMetrics, type DashboardMetrics } from '../services/dashboardMetricsService';

export function useDashboardMetrics(role: Role, userId?: string, userEmail?: string) {
  const [metrics, setMetrics] = useState<DashboardMetrics>(() => emptyDashboardMetrics());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDashboardMetrics(role, userId, userEmail)
      .then((next) => { if (!cancelled) { setMetrics(next); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Dashboard metrics unavailable'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [role, userId, userEmail]);

  return { metrics, error, loading, isApiBacked: true };
}
