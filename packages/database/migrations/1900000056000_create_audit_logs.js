// ─── audit_logs table — was only created at server startup (ensureAuditLogsTable) ───
// Test environments never boot the server, so the table was missing → all audit writes
// silently failed and suites that assert audit behavior broke. Make it migration-managed.
// Created: 2026-08-18
exports.up = async (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      action VARCHAR(50) NOT NULL,
      user_id INTEGER,
      resource_type VARCHAR(80) NOT NULL,
      resource_id VARCHAR(255) NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS audit_logs CASCADE;`);
};
