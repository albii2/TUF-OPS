import type { Activity } from '../data/mockSalesData';
import { apiClient } from './apiClient';

export type ActivityParams = {
  entityType?: Activity['entityType'];
  entityId?: string;
  limit?: number;
};

/**
 * Normalize a raw API response object into the canonical Activity shape.
 *
 * The backend may return snake_case database columns (organization_id, created_at,
 * description, etc.) and numeric IDs — this function maps every field to its
 * camelCase counterpart on the front-end Activity type and supplies safe defaults
 * so the rest of the app never sees a bare API row.
 */
export function normalizeApiActivity(raw: Record<string, unknown>): Activity {
  const entityType = (
    raw.entity_type ??
    raw.entityType ??
    'ORGANIZATION'
  ) as Activity['entityType'];

  return {
    id: String(raw.id ?? ''),
    entityType: (['ORGANIZATION', 'OPPORTUNITY', 'ORDER'] as const).includes(
      entityType as (typeof entityType & string),
    )
      ? (entityType as Activity['entityType'])
      : 'ORGANIZATION',
    entityId: String(
      raw.entity_id ??
        raw.entityId ??
        raw.organization_id ??
        raw.opportunity_id ??
        '',
    ),
    message: String(raw.message ?? raw.description ?? ''),
    timestamp: String(raw.timestamp ?? raw.created_at ?? new Date().toISOString()),
    user: String(raw.user ?? raw.created_by ?? 'Unknown'),
  };
}

export async function createActivity(input: {
  entityType: Activity['entityType'];
  entityId: string;
  message: string;
  timestamp?: string;
  user?: string;
}): Promise<Activity> {
  const raw = await apiClient<Record<string, unknown>>('/activities', {
    method: 'POST',
    body: input,
  });
  return normalizeApiActivity(raw);
}

export async function listActivities(params: ActivityParams = {}): Promise<Activity[]> {
  const query: Record<string, string | undefined> = {};
  if (params.entityType) query.entityType = params.entityType;
  if (params.entityId) query.entityId = params.entityId;
  if (params.limit) query.limit = String(params.limit);
  const raw = await apiClient<Record<string, unknown>[]>('/activities', { query });
  return (raw ?? []).map(normalizeApiActivity);
}
