export interface IntakeItem {
    id: number;
    title: string;
    description: string;
    source: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'review' | 'approved' | 'closed';
    owner: string;
    next_action: string;
    ai_summary: string;
    ai_draft: string;
    tags: string[];
    created_by: number;
    updated_by?: number;
    created_at: string;
    updated_at: string;
}
export interface IntakeComment {
    id: number;
    intake_id: number;
    content: string;
    author: string;
    created_at: string;
}
export interface IntakeAuditEntry {
    id: number;
    intake_id: number;
    action: string;
    changed_by: string;
    details: any;
    created_at: string;
}
export declare function createIntakeItem(data: {
    title: string;
    description?: string;
    source?: string;
    priority?: string;
    owner?: string;
    tags?: string[];
    created_by: number;
}): Promise<IntakeItem>;
export declare function getIntakeItems(filters?: {
    status?: string;
    priority?: string;
    owner?: string;
    source?: string;
}): Promise<IntakeItem[]>;
export declare function getIntakeItem(id: number): Promise<IntakeItem | null>;
export declare function updateIntakeItem(id: number, data: {
    title?: string;
    description?: string;
    source?: string;
    priority?: string;
    status?: string;
    owner?: string;
    next_action?: string;
    ai_summary?: string;
    ai_draft?: string;
    tags?: string[];
    updated_by: number;
}): Promise<IntakeItem | null>;
export declare function deleteIntakeItem(id: number): Promise<boolean>;
export declare function getOpenDecisions(): Promise<IntakeItem[]>;
//# sourceMappingURL=intake.service.d.ts.map