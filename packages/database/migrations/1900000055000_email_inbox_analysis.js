/* eslint-disable camelcase */
/**
 * Email Inbound Processing — Zoho IMAP inbox polling, analysis, and issue creation.
 *
 * Tables:
 *   email_inbox       — inbound emails fetched from Zoho IMAP
 *   email_analysis    — AI-style classification, priority detection, linked issues/tasks
 */
exports.up = (pgm) => {
  // ── Email Inbox ──────────────────────────────────────────────────────
  pgm.createTable('email_inbox', {
    id: { type: 'serial', primaryKey: true },
    account: { type: 'varchar(50)', notNull: true },
    message_id: { type: 'varchar(500)', notNull: true },
    sender_email: { type: 'varchar(255)', notNull: true },
    sender_name: { type: 'varchar(255)' },
    recipient_email: { type: 'varchar(255)', notNull: true },
    subject: { type: 'varchar(500)' },
    body_text: { type: 'text' },
    body_html: { type: 'text' },
    has_attachments: { type: 'boolean', notNull: true, default: false },
    attachment_info: { type: 'jsonb', default: '[]' },
    received_at: { type: 'timestamptz', notNull: true },
    is_read: { type: 'boolean', notNull: true, default: false },
    processed: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  }, { ifNotExists: true });

  pgm.addConstraint('email_inbox', 'uq_email_inbox_message_id', {
    unique: ['message_id', 'account'],
  });

  pgm.createIndex('email_inbox', 'account', { ifNotExists: true, name: 'idx_email_inbox_account' });
  pgm.createIndex('email_inbox', 'processed', { ifNotExists: true, name: 'idx_email_inbox_processed' });
  pgm.createIndex('email_inbox', 'received_at', { ifNotExists: true, name: 'idx_email_inbox_received_at' });
  pgm.createIndex('email_inbox', 'is_read', { ifNotExists: true, name: 'idx_email_inbox_is_read' });

  // ── Email Analysis ──────────────────────────────────────────────────
  pgm.createTable('email_analysis', {
    id: { type: 'serial', primaryKey: true },
    email_inbox_id: { type: 'integer', notNull: true, references: 'email_inbox', onDelete: 'CASCADE' },
    classification: {
      type: 'varchar(50)',
      notNull: true,
      default: 'general_inquiry',
    },
    priority: {
      type: 'varchar(20)',
      notNull: true,
      default: 'low',
    },
    urgency_signals: { type: 'jsonb', default: '[]' },
    detected_org_name: { type: 'varchar(255)' },
    detected_org_id: { type: 'integer' },
    detected_contact: { type: 'varchar(255)' },
    ai_summary: { type: 'text' },
    suggested_action: { type: 'text' },
    linked_issue_id: { type: 'integer' },
    linked_work_item_id: { type: 'integer' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  }, { ifNotExists: true });

  pgm.createIndex('email_analysis', 'email_inbox_id', { ifNotExists: true, name: 'idx_email_analysis_email_inbox_id' });
  pgm.createIndex('email_analysis', 'classification', { ifNotExists: true, name: 'idx_email_analysis_classification' });
  pgm.createIndex('email_analysis', 'priority', { ifNotExists: true, name: 'idx_email_analysis_priority' });
  pgm.createIndex('email_analysis', 'linked_issue_id', { ifNotExists: true, name: 'idx_email_analysis_linked_issue_id' });
  pgm.createIndex('email_analysis', 'detected_org_id', { ifNotExists: true, name: 'idx_email_analysis_detected_org_id' });
};

exports.down = (pgm) => {
  pgm.dropTable('email_analysis', { ifExists: true, cascade: true });
  pgm.dropTable('email_inbox', { ifExists: true, cascade: true });
};
