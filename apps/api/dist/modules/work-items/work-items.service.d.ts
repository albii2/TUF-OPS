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
export interface UpdateWorkItemStatusInput {
    status: string;
}
export interface ListWorkItemsQuery {
    owner_id?: number;
    status?: string;
    source?: string;
    priority?: string;
    linked_entity_type?: string;
    linked_entity_id?: number;
}
export declare function listWorkItems(query: ListWorkItemsQuery): Promise<WorkItem[]>;
export declare function getWorkItemById(id: number): Promise<WorkItem | null>;
export declare function createWorkItem(input: CreateWorkItemInput): Promise<WorkItem>;
export declare function updateWorkItem(id: number, input: UpdateWorkItemInput): Promise<WorkItem | null>;
export declare function updateWorkItemStatus(id: number, input: UpdateWorkItemStatusInput): Promise<WorkItem | null>;
//# sourceMappingURL=work-items.service.d.ts.map