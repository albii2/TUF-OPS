/* eslint-disable camelcase */
/**
 * Email Integration — Zoho SMTP email sending, logging, and templates.
 *
 * Tables:
 *   email_log       — audit trail for every email sent from the CRM
 *   email_templates — reusable HTML email templates with variable slots
 */
exports.up = (pgm) => {
  // ── Email Log ───────────────────────────────────────────────────────
  pgm.createTable('email_log', {
    id: { type: 'serial', primaryKey: true },
    from_account: { type: 'varchar(100)', notNull: true },
    from_email: { type: 'varchar(255)', notNull: true },
    to_email: { type: 'varchar(255)', notNull: true },
    subject: { type: 'varchar(500)', notNull: true },
    body_html: { type: 'text' },
    body_text: { type: 'text' },
    template_id: { type: 'integer' },
    template_vars: { type: 'jsonb', default: '{}' },
    status: { type: 'varchar(30)', notNull: true, default: 'sent' },
    error_message: { type: 'text' },
    entity_type: { type: 'varchar(50)' },
    entity_id: { type: 'integer' },
    sent_by: { type: 'integer', notNull: true, references: 'users', onDelete: 'SET NULL' },
    sent_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  }, { ifNotExists: true });

  pgm.createIndex('email_log', 'from_account', { ifNotExists: true, name: 'idx_email_log_from_account' });
  pgm.createIndex('email_log', 'sent_by', { ifNotExists: true, name: 'idx_email_log_sent_by' });
  pgm.createIndex('email_log', 'entity_type', { ifNotExists: true, name: 'idx_email_log_entity_type' });
  pgm.createIndex('email_log', 'sent_at', { ifNotExists: true, name: 'idx_email_log_sent_at' });
  pgm.createIndex('email_log', 'status', { ifNotExists: true, name: 'idx_email_log_status' });

  // ── Email Templates ──────────────────────────────────────────────────
  pgm.createTable('email_templates', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    subject_template: { type: 'varchar(500)', notNull: true },
    body_html: { type: 'text', notNull: true },
    category: { type: 'varchar(50)', default: 'general' },
    variables: { type: 'jsonb', default: '[]' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_by: { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  }, { ifNotExists: true });

  pgm.createIndex('email_templates', 'category', { ifNotExists: true, name: 'idx_email_templates_category' });
  pgm.createIndex('email_templates', 'is_active', { ifNotExists: true, name: 'idx_email_templates_active' });

  // ── Seed default templates ───────────────────────────────────────────
  pgm.sql(`
    INSERT INTO email_templates (name, description, subject_template, body_html, category, variables)
    VALUES
    (
      'First Contact — Intro',
      'Initial outreach to a new contact at an organization',
      'TUF Sports — Team Gear & Uniforms for {{org_name}}',
      '<h2>Hi {{contact_name}},</h2>
<p>My name is {{rep_name}} with TUF Sports. We specialize in custom uniforms, team travel gear, and team stores for schools and programs like {{org_name}}.</p>
<p>I''d love to set up a quick call to understand your needs for the {{season}} season and show you how we can help.</p>
<p>Would you have 15 minutes this week to connect?</p>
<p>Best,<br>{{rep_name}}<br>TUF Sports<br>{{rep_email}}</p>',
      'outreach',
      '["org_name","contact_name","rep_name","season","rep_email"]'
    ),
    (
      'Follow-Up — After Discovery Call',
      'Sent after an initial discovery conversation',
      'Great speaking with you — next steps for {{org_name}}',
      '<h2>Hi {{contact_name}},</h2>
<p>Thanks for taking the time to chat today about {{org_name}}''s uniform and gear needs for the {{season}} season.</p>
<p>Here''s a quick recap of what we discussed:</p>
<ul>{{recap_items}}</ul>
<p>I''ll follow up with a formal proposal by {{proposal_date}}. In the meantime, feel free to reach out with any questions.</p>
<p>Best,<br>{{rep_name}}<br>TUF Sports<br>{{rep_email}}</p>',
      'follow_up',
      '["org_name","contact_name","rep_name","season","recap_items","proposal_date","rep_email"]'
    ),
    (
      'Proposal Follow-Up',
      'Check in after sending a proposal',
      'Checking in — TUF Sports proposal for {{org_name}}',
      '<h2>Hi {{contact_name}},</h2>
<p>I wanted to follow up on the proposal I sent for {{org_name}}''s {{season}} season. I''m here to answer any questions or walk through the numbers together.</p>
<p>What would be a good time to connect this week?</p>
<p>Best,<br>{{rep_name}}<br>TUF Sports<br>{{rep_email}}</p>',
      'follow_up',
      '["org_name","contact_name","rep_name","season","rep_email"]'
    ),
    (
      'Order Confirmation',
      'Confirm an order has been received and is in production',
      'Order Confirmed — {{org_name}}',
      '<h2>Hi {{contact_name}},</h2>
<p>Great news! Your order for {{org_name}} has been confirmed and is moving into production.</p>
<p><strong>Order Summary:</strong></p>
<ul>{{order_summary}}</ul>
<p>You can track your order status anytime at <a href="{{tracking_url}}">{{tracking_url}}</a>.</p>
<p>Thanks for choosing TUF Sports — we''re excited to deliver for your team!</p>
<p>Best,<br>{{rep_name}}<br>TUF Sports</p>',
      'transactional',
      '["org_name","contact_name","rep_name","order_summary","tracking_url"]'
    ),
    (
      'Blank — Custom Message',
      'Start from a blank canvas',
      '{{subject}}',
      '<div>{{body}}</div>',
      'general',
      '["subject","body"]'
    )
    ON CONFLICT DO NOTHING
  `);
};

exports.down = (pgm) => {
  pgm.dropIndex('email_templates', 'is_active', { name: 'idx_email_templates_active' });
  pgm.dropIndex('email_templates', 'category', { name: 'idx_email_templates_category' });
  pgm.dropTable('email_templates', { ifExists: true });

  pgm.dropIndex('email_log', 'status', { name: 'idx_email_log_status' });
  pgm.dropIndex('email_log', 'sent_at', { name: 'idx_email_log_sent_at' });
  pgm.dropIndex('email_log', 'entity_type', { name: 'idx_email_log_entity_type' });
  pgm.dropIndex('email_log', 'sent_by', { name: 'idx_email_log_sent_by' });
  pgm.dropIndex('email_log', 'from_account', { name: 'idx_email_log_from_account' });
  pgm.dropTable('email_log', { ifExists: true });
};
