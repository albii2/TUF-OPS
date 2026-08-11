export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STAGE_CHANGE' | 'STATUS_CHANGE';
export interface AuditEntry {
    action: AuditAction;
    user_id: number | null;
    resource_type: string;
    resource_id: number | string;
    metadata?: Record<string, unknown>;
}
/**
 * Log an auditable action to the audit_logs table.
 * Creates the table if it doesn't exist (migration-safe).
 */
export declare function auditLog(entry: AuditEntry): Promise<void>;
/**
 * Ensure the audit_logs table exists.
 * Called at server startup.
 */
export declare function ensureAuditLogsTable(): Promise<void>;
//# sourceMappingURL=audit-log.d.ts.map