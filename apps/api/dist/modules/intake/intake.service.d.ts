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
    attention_score: number;
    classification_type: string | null;
    due_date: string | null;
    related_person_id: number | null;
    related_organization_id: number | null;
}
/** Classification types matching the Meridian OS spec */
export declare const CLASSIFICATION_TYPES: readonly ["recruiting_application", "recruiting_offer_accepted", "rep_inactive", "coach_reply", "order_paid", "mockup_requested", "vendor_delayed", "email_received", "meeting_completed", "territory_assigned", "executive_decision", "hr_onboarding", "academy_certification", "revenue_blocker", "pipeline_update", "status_check_response", "other"];
export type ClassificationType = typeof CLASSIFICATION_TYPES[number];
/**
 * Compute an attention score (0–100) for an intake item.
 * Based on Meridian OS Pulse engine — priority, staleness, and classification.
 */
export declare function computeAttentionScore(item: {
    priority: string;
    status: string;
    classification_type?: string | null;
    created_at?: string;
    due_date?: string | null;
}): number;
/**
 * Auto-classify an intake item based on title / source / tags keywords.
 */
export declare function classifyIntake(item: {
    title: string;
    description?: string;
    source?: string;
    tags?: string[];
}): ClassificationType;
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
    related_person_id?: number | null;
    related_organization_id?: number | null;
    due_date?: string | null;
}): Promise<IntakeItem>;
export declare function getIntakeItems(filters?: {
    status?: string;
    priority?: string;
    owner?: string;
    source?: string;
}): Promise<IntakeItem[]>;
/**
 * Lighthouse view — items requiring attention, scored and grouped.
 * This powers the Executive Command Center's "What requires attention?" section.
 */
export declare function getLighthouseView(): Promise<{
    items: IntakeItem[];
    byClassification: Record<string, number>;
    highAttention: IntakeItem[];
    overdue: IntakeItem[];
}>;
/** Re-compute attention scores for all open items — called periodically */
export declare function recalculateAttentionScores(): Promise<number>;
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
/**
 * Create a batch of status check intake items — one per director/recipient.
 * Each item tracks whether a specific leader has responded to a check-in.
 *
 * This is the "01 issue" fix: HR status checks must never fall through the cracks.
 * Every recipient gets a tracked item. Non-respondents surface in Lighthouse.
 */
export declare function createStatusCheckBatch(data: {
    title: string;
    description?: string;
    recipients: Array<{
        name: string;
        email?: string;
        territory?: string;
    }>;
    due_date: string;
    created_by: number;
}): Promise<{
    items: IntakeItem[];
}>;
/**
 * Get status check response summary — who's responded vs who hasn't.
 * Recalculates attention scores on each call so overdue items escalate automatically.
 */
export declare function getStatusCheckSummary(): Promise<{
    total: number;
    responded: number;
    pending: IntakeItem[];
}>;
//# sourceMappingURL=intake.service.d.ts.map