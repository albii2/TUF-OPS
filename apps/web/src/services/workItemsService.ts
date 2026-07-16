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

export interface ListWorkItemsParams {
  owner_id?: number;
  status?: string;
  source?: string;
  priority?: string;
  linked_entity_type?: string;
  linked_entity_id?: number;
}

export interface CreateWorkItemInput {
  owner_id?: number | null;
  source: string;
  item_type: string;
  priority?: string;
  title: string;
  description?: string | null;
  due_at?: string | null;
  status?: string;
  linked_entity_type?: string | null;
  linked_entity_id?: number | null;
  suggested_action?: string | null;
  ai_summary?: string | null;
}

export interface UpdateWorkItemInput {
  owner_id?: number | null;
  source?: string;
  item_type?: string;
  priority?: string;
  title?: string;
  description?: string | null;
  due_at?: string | null;
  status?: string;
  linked_entity_type?: string | null;
  linked_entity_id?: number | null;
  suggested_action?: string | null;
  ai_summary?: string | null;
}

export async function listWorkItems(params?: ListWorkItemsParams): Promise<WorkItem[]> {
  const query: Record<string, string | number | boolean | undefined> = {};
  if (params?.owner_id !== undefined) query.owner_id = params.owner_id;
  if (params?.status) query.status = params.status;
  if (params?.source) query.source = params.source;
  if (params?.priority) query.priority = params.priority;
  if (params?.linked_entity_type) query.linked_entity_type = params.linked_entity_type;
  if (params?.linked_entity_id !== undefined) query.linked_entity_id = params.linked_entity_id;
  return apiClient<WorkItem[]>('/work-items', { query });
}

export async function createWorkItem(input: CreateWorkItemInput): Promise<WorkItem> {
  return apiClient<WorkItem>('/work-items', { method: 'POST', body: input });
}

export async function updateWorkItem(id: number, input: UpdateWorkItemInput): Promise<WorkItem> {
  return apiClient<WorkItem>(`/work-items/${id}`, { method: 'PUT', body: input });
}

export async function updateWorkItemStatus(id: number, status: string): Promise<WorkItem> {
  return apiClient<WorkItem>(`/work-items/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}
