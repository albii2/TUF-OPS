/* eslint-disable camelcase */
/**
 * Work Items — unified task model across all TUF Ops modules.
 * Sources: daily_command, executive_intake, certification, order_blocker, recruiting
 */
exports.up = (pgm) => {
  pgm.createTable('work_items', {
    id: { type: 'serial', primaryKey: true },
    owner_id: { type: 'integer', references: 'users', onDelete: 'SET NULL' },
    source: { type: 'varchar(50)', notNull: true },
    item_type: { type: 'varchar(50)', notNull: true },
    priority: { type: 'varchar(20)', notNull: true, default: 'medium' },
    title: { type: 'text', notNull: true },
    description: { type: 'text' },
    due_at: { type: 'timestamptz' },
    status: { type: 'varchar(20)', notNull: true, default: 'open' },
    linked_entity_type: { type: 'varchar(50)' },
    linked_entity_id: { type: 'integer' },
    suggested_action: { type: 'text' },
    ai_summary: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });

  pgm.createIndex('work_items', 'owner_id', { name: 'idx_work_items_owner' });
  pgm.createIndex('work_items', 'status', { name: 'idx_work_items_status' });
  pgm.createIndex('work_items', 'priority', { name: 'idx_work_items_priority' });
};

exports.down = (pgm) => {
  pgm.dropIndex('work_items', 'owner_id', { name: 'idx_work_items_owner' });
  pgm.dropIndex('work_items', 'status', { name: 'idx_work_items_status' });
  pgm.dropIndex('work_items', 'priority', { name: 'idx_work_items_priority' });
  pgm.dropTable('work_items');
};
