exports.up = async (pgm) => {
  // 1. Add login_count to users table
  pgm.addColumn('users', {
    login_count: { type: 'integer', notNull: true, default: 0 },
  }, { ifNotExists: true });

  // 2. Add cohort to users table
  pgm.addColumn('users', {
    cohort: { type: 'varchar(80)' },
  }, { ifNotExists: true });

  // 3. Add enrollment_date to users table (when they started Academy)
  pgm.addColumn('users', {
    enrollment_date: { type: 'timestamp' },
  }, { ifNotExists: true });

  // 4. Create academy_activity_events table
  pgm.createTable('academy_activity_events', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'cascade',
    },
    event_type: { type: 'varchar(80)', notNull: true },
    entity_type: { type: 'varchar(80)' },
    entity_id: { type: 'integer' },
    metadata: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  }, { ifNotExists: true });

  // Indexes
  pgm.createIndex('academy_activity_events', ['user_id', 'created_at'], { ifNotExists: true });
  pgm.createIndex('academy_activity_events', ['event_type', 'created_at'], { ifNotExists: true });
  pgm.createIndex('academy_activity_events', ['created_at'], { ifNotExists: true });
};

exports.down = async (pgm) => {
  pgm.dropTable('academy_activity_events', { ifExists: true });
  pgm.dropColumn('users', 'enrollment_date', { ifExists: true });
  pgm.dropColumn('users', 'cohort', { ifExists: true });
  pgm.dropColumn('users', 'login_count', { ifExists: true });
};
