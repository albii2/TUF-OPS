/* eslint-disable camelcase */
/**
 * Employee Issue Intake — issue tracking for TUF Ops internal tooling & processes.
 * Fields: id, title, description, category, severity, affected_module,
 *   steps_to_reproduce, screenshot_url, is_blocking, status,
 *   submitted_by, assigned_to, created_at, updated_at, resolved_at
 */
exports.up = (pgm) => {
  pgm.createTable('issues', {
    id: { type: 'serial', primaryKey: true },
    title: { type: 'text', notNull: true },
    description: { type: 'text', notNull: true, default: '' },
    category: { type: 'varchar(50)', notNull: true, default: 'other' },
    severity: { type: 'varchar(20)', notNull: true, default: 'medium' },
    affected_module: { type: 'varchar(100)' },
    steps_to_reproduce: { type: 'text' },
    screenshot_url: { type: 'text' },
    is_blocking: { type: 'boolean', notNull: true, default: false },
    status: { type: 'varchar(30)', notNull: true, default: 'NEW' },
    submitted_by: { type: 'integer', notNull: true, references: 'users', onDelete: 'SET NULL' },
    assigned_to: { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    resolved_at: { type: 'timestamptz' },
  });

  pgm.createIndex('issues', 'status', { name: 'idx_issues_status' });
  pgm.createIndex('issues', 'severity', { name: 'idx_issues_severity' });
  pgm.createIndex('issues', 'category', { name: 'idx_issues_category' });
  pgm.createIndex('issues', 'submitted_by', { name: 'idx_issues_submitted_by' });
  pgm.createIndex('issues', 'assigned_to', { name: 'idx_issues_assigned_to' });
};

exports.down = (pgm) => {
  pgm.dropIndex('issues', 'submitted_by', { name: 'idx_issues_submitted_by' });
  pgm.dropIndex('issues', 'assigned_to', { name: 'idx_issues_assigned_to' });
  pgm.dropIndex('issues', 'category', { name: 'idx_issues_category' });
  pgm.dropIndex('issues', 'severity', { name: 'idx_issues_severity' });
  pgm.dropIndex('issues', 'status', { name: 'idx_issues_status' });
  pgm.dropTable('issues');
};
