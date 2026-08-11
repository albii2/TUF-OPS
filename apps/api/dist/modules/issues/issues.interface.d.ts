/** Status values for Employee Issues */
export declare const ISSUE_STATUSES: readonly ["NEW", "TRIAGED", "ASSIGNED", "IN_PROGRESS", "READY_FOR_VERIFICATION", "RESOLVED", "CLOSED"];
export type IssueStatus = typeof ISSUE_STATUSES[number];
/** Severity levels */
export declare const ISSUE_SEVERITIES: readonly ["low", "medium", "high", "critical"];
export type IssueSeverity = typeof ISSUE_SEVERITIES[number];
/** Categories for issue classification */
export declare const ISSUE_CATEGORIES: readonly ["bug", "feature_request", "process_improvement", "tooling", "data_quality", "onboarding", "integration", "security", "performance", "ux", "documentation", "other"];
export type IssueCategory = typeof ISSUE_CATEGORIES[number];
export interface Issue {
    id: number;
    title: string;
    description: string;
    category: IssueCategory;
    severity: IssueSeverity;
    affected_module: string | null;
    steps_to_reproduce: string | null;
    screenshot_url: string | null;
    is_blocking: boolean;
    status: IssueStatus;
    submitted_by: number;
    assigned_to: number | null;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
}
export interface CreateIssueInput {
    title: string;
    description?: string;
    category?: IssueCategory;
    severity?: IssueSeverity;
    affected_module?: string | null;
    steps_to_reproduce?: string | null;
    screenshot_url?: string | null;
    is_blocking?: boolean;
}
export interface UpdateIssueInput {
    title?: string;
    description?: string;
    category?: IssueCategory;
    severity?: IssueSeverity;
    affected_module?: string | null;
    steps_to_reproduce?: string | null;
    screenshot_url?: string | null;
    is_blocking?: boolean;
    status?: IssueStatus;
    assigned_to?: number | null;
    resolved_at?: string | null;
}
export interface UpdateIssueStatusInput {
    status: IssueStatus;
}
export interface ListIssuesQuery {
    status?: IssueStatus;
    severity?: IssueSeverity;
    category?: IssueCategory;
    submitted_by?: number;
    assigned_to?: number;
    is_blocking?: boolean;
}
//# sourceMappingURL=issues.interface.d.ts.map