import { activities, type Activity } from '../data/mockSalesData';
import { DATA_MODE } from './dataMode';

export type ActivityParams = {
  entityType?: Activity['entityType'];
  entityId?: string;
  limit?: number;
};

const LOCAL_ACTIVITIES_KEY = 'tuf_ops_mock_activities_v1';

function readLocalActivities(): Activity[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ACTIVITIES_KEY) || '[]') as Activity[];
  } catch {
    return [];
  }
}

export function listActivities(params: ActivityParams = {}): Activity[] {
  if (DATA_MODE !== 'mock') return [];

  const activityRows = [...readLocalActivities(), ...activities];
  const filtered = activityRows.filter((activity) => {
    const matchesType = !params.entityType || activity.entityType === params.entityType;
    const matchesEntityId = !params.entityId || activity.entityId === params.entityId;
    return matchesType && matchesEntityId;
  });

  const sorted = filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return params.limit ? sorted.slice(0, params.limit) : sorted;
}
