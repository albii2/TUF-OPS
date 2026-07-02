import { activities, type Activity } from '../data/mockSalesData';
import { getStoredUser } from '../auth';
import { DATA_MODE } from './dataMode';
import { apiClient } from './apiClient';

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

function writeLocalActivities(rows: Activity[]) {
  localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent('tuf:activity-updated'));
}

export async function createActivity(input: {
  entityType: Activity['entityType'];
  entityId: string;
  message: string;
  timestamp?: string;
  user?: string;
}): Promise<Activity> {
  if (DATA_MODE === 'api') {
    // THROW on failure — no silent fallback to localStorage
    return await apiClient<Activity>('/activities', {
      method: 'POST',
      body: input,
    });
  }

  // Mock mode: write to localStorage
  const user = getStoredUser();
  const row: Activity = {
    id: `act-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    entityType: input.entityType,
    entityId: input.entityId,
    message: input.message.trim(),
    timestamp: input.timestamp ?? new Date().toISOString(),
    user: input.user ?? user?.name ?? 'System',
  };
  writeLocalActivities([row, ...readLocalActivities()]);
  return row;
}

export async function listActivities(params: ActivityParams = {}): Promise<Activity[]> {
  if (DATA_MODE === 'api') {
    const query: Record<string, string | undefined> = {};
    if (params.entityType) query.entityType = params.entityType;
    if (params.entityId) query.entityId = params.entityId;
    if (params.limit) query.limit = String(params.limit);
    // THROW on failure — no silent fallback to localStorage
    return await apiClient<Activity[]>('/activities', { query });
  }

  // Mock mode: read from localStorage and seeded data
  const activityRows = [...readLocalActivities(), ...activities];
  const filtered = activityRows.filter((activity) => {
    const matchesType = !params.entityType || activity.entityType === params.entityType;
    const matchesEntityId = !params.entityId || activity.entityId === params.entityId;
    return matchesType && matchesEntityId;
  });

  const sorted = filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return params.limit ? sorted.slice(0, params.limit) : sorted;
}
