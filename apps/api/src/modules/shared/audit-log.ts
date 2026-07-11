import { pool } from '@packages/database';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STAGE_CHANGE'
  | 'STATUS_CHANGE';

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
export async function auditLog(entry: AuditEntry): Promise<void> {
  const { action, user_id, resource_type, resource_id, metadata = {} } = entry;
  try {
    await pool.query(
      `INSERT INTO audit_logs (action, user_id, resource_type, resource_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [action, user_id, resource_type, String(resource_id), JSON.stringify(metadata)],
    );
  } catch (error: any) {
    // Don't block the main operation on audit failure
    console.error(`[auditLog] Failed to write audit entry: ${error.message}`);
  }
}

/**
 * Ensure the audit_logs table exists.
 * Called at server startup.
 */
export async function ensureAuditLogsTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        user_id INTEGER,
        resource_type VARCHAR(80) NOT NULL,
        resource_id VARCHAR(255) NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
        ON audit_logs (resource_type, resource_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user
        ON audit_logs (user_id, created_at)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created
        ON audit_logs (created_at DESC)
    `);
  } catch (error: any) {
    console.error(`[auditLog] Failed to ensure audit_logs table: ${error.message}`);
  }
}
