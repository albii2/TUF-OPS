import type { Activity } from '../data/mockSalesData';
import { apiClient } from './apiClient';

export type ActivityParams = {
  entityType?: Activity['entityType'];
  entityId?: string;
  limit?: number;
};

export async function createActivity(input: {
  entityType: Activity['entityType'];
  entityId: string;
  message: string;
  timestamp?: string;
  user?: string;
}): Promise<Activity> {
  return apiClient<Activity>('/activities', { method: 'POST', body: input });
}

export async function listActivities(params: ActivityParams = {}): Promise<Activity[]> {
  const query: Record<string, string | undefined> = {};
  if (params.entityType) query.entityType = params.entityType;
  if (params.entityId) query.entityId = params.entityId;
  if (params.limit) query.limit = String(params.limit);
  return apiClient<Activity[]>('/activities', { query });
}
