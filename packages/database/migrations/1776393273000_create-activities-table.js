exports.up = (pgm) => {
  pgm.createTable('activities', {
    id: 'id',
    type: { type: 'varchar(50)', notNull: true }, // CALL | EMAIL | NOTE | TASK
    organization_id: {
      type: 'integer',
      notNull: true,
      references: 'organizations',
      onDelete: 'cascade',
    },
    opportunity_id: {
      type: 'integer',
      references: 'opportunities',
      onDelete: 'cascade',
    },
    description: { type: 'text', notNull: true },
    created_by: { type: 'integer', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    due_date: { type: 'timestamp' }, // For tasks
    completed: { type: 'boolean', notNull: true, default: false },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('activities');
};