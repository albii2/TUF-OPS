exports.up = (pgm) => {
  pgm.addColumns('opportunities', {
    stage: { type: 'varchar(50)', notNull: true, default: 'LEAD_ASSIGNED' },
    next_action: { type: 'text' },
    expected_close_date: { type: 'timestamp' },
    last_activity_date: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    assigned_rep_id: { type: 'integer' },
    assigned_director_id: { type: 'integer' },
  });

  pgm.createTable('opportunity_stage_history', {
    id: 'id',
    opportunity_id: {
      type: 'integer',
      notNull: true,
      references: 'opportunities',
      onDelete: 'cascade',
    },
    from_stage: { type: 'varchar(50)', notNull: true },
    to_stage: { type: 'varchar(50)', notNull: true },
    changed_by: { type: 'integer', notNull: true },
    changed_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    note: { type: 'text' },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('opportunity_stage_history');
  pgm.dropColumns('opportunities', [
    'stage',
    'next_action',
    'expected_close_date',
    'last_activity_date',
    'assigned_rep_id',
    'assigned_director_id',
  ]);
};