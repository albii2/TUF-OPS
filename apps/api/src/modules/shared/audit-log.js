"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
exports.ensureAuditLogsTable = ensureAuditLogsTable;
const database_1 = require("@packages/database");
/**
 * Log an auditable action to the audit_logs table.
 * Creates the table if it doesn't exist (migration-safe).
 */
async function auditLog(entry) {
    const { action, user_id, resource_type, resource_id, metadata = {} } = entry;
    try {
        await database_1.pool.query(`INSERT INTO audit_logs (action, user_id, resource_type, resource_id, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`, [action, user_id, resource_type, String(resource_id), JSON.stringify(metadata)]);
    }
    catch (error) {
        // Don't block the main operation on audit failure
        console.error(`[auditLog] Failed to write audit entry: ${error.message}`);
    }
}
/**
 * Ensure the audit_logs table exists.
 * Called at server startup.
 */
async function ensureAuditLogsTable() {
    try {
        await database_1.pool.query(`
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
        await database_1.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
        ON audit_logs (resource_type, resource_id)
    `);
        await database_1.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user
        ON audit_logs (user_id, created_at)
    `);
        await database_1.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created
        ON audit_logs (created_at DESC)
    `);
    }
    catch (error) {
        console.error(`[auditLog] Failed to ensure audit_logs table: ${error.message}`);
    }
}
//# sourceMappingURL=audit-log.js.map