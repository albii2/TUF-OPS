import { apiClient } from './apiClient';

export interface WorkItem {
  id: number;
  owner_id: number | null;
  source: string;
  item_type: string;
  priority: string;
  title: string;
  description: string | null;
  due_at: string | null;
  status: string;
  linked_entity_type: string | null;
  linked_entity_id: number | null;
  suggested_action: string | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkItemListParams {
  owner_id?: number;
  status?: string;
  source?: string;
  priority?: string;
  linked_entity_type?: string;
  linked_entity_id?: number;
}

export async function listWorkItems(params: WorkItemListParams = {}): Promise<WorkItem[]> {
  return apiClient<WorkItem[]>('/work-items', {
    query: params as Record<string, string | number | boolean | undefined>,
  });
}

export async function updateWorkItemStatus(id: number, status: string): Promise<WorkItem> {
  return apiClient<WorkItem>(`/work-items/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}
