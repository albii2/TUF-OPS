import { activities, type Activity } from '../data/mockSalesData';
import { DATA_MODE } from './dataMode';

export type ActivityParams = {
  entityType?: Activity['entityType'];
  entityId?: string;
  limit?: number;
};

export function listActivities(params: ActivityParams = {}): Activity[] {
  if (DATA_MODE !== 'mock') return [];

  const filtered = activities.filter((activity) => {
    const matchesType = !params.entityType || activity.entityType === params.entityType;
    const matchesEntityId = !params.entityId || activity.entityId === params.entityId;
    return matchesType && matchesEntityId;
  });

  return params.limit ? filtered.slice(0, params.limit) : filtered;
}
