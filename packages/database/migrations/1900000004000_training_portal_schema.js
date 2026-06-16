exports.up = (pgm) => {
  // training_modules - Store individual training modules
  pgm.createTable('training_modules', {
    id: 'id',
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    role: {
      type: 'varchar(50)',
      notNull: true,
      check: "role IN ('TAE', 'DIRECTOR', 'ADMIN')",
    },
    phase: {
      type: 'varchar(50)',
      notNull: true,
      check: "phase IN ('DAY_1', 'DAY_1_2', 'WEEK_1_2', 'MONTH_1')",
    },
    order_index: { type: 'integer', notNull: true },
    content_markdown: { type: 'text', notNull: true },
    estimated_duration_minutes: { type: 'integer' },
    module_type: {
      type: 'varchar(50)',
      notNull: true,
      default: 'MODULE',
      check: "module_type IN ('VIDEO', 'INTERACTIVE', 'HANDS_ON', 'MODULE')",
    },
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
  });

  // training_enrollments - Track user enrollment in training
  pgm.createTable('training_enrollments', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users',
      onDelete: 'cascade',
    },
    role: {
      type: 'varchar(50)',
      notNull: true,
      check: "role IN ('TAE', 'DIRECTOR', 'ADMIN')",
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'ACTIVE',
      check: "status IN ('ACTIVE', 'COMPLETED', 'INACTIVE')",
    },
    current_phase: {
      type: 'varchar(50)',
      notNull: true,
      default: 'DAY_1',
      check: "current_phase IN ('DAY_1', 'DAY_1_2', 'WEEK_1_2', 'MONTH_1')",
    },
    enrolled_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    completed_at: { type: 'timestamp' },
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
  });

  // training_progress - Track completion of individual modules
  pgm.createTable('training_progress', {
    id: 'id',
    enrollment_id: {
      type: 'integer',
      notNull: true,
      references: 'training_enrollments',
      onDelete: 'cascade',
    },
    module_id: {
      type: 'integer',
      notNull: true,
      references: 'training_modules',
      onDelete: 'cascade',
    },
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'NOT_STARTED',
      check: "status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')",
    },
    started_at: { type: 'timestamp' },
    completed_at: { type: 'timestamp' },
    time_spent_seconds: { type: 'integer', default: 0 },
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
  });

  // training_assessments - Optional quiz/test scores (for future)
  pgm.createTable('training_assessments', {
    id: 'id',
    module_id: {
      type: 'integer',
      notNull: true,
      references: 'training_modules',
      onDelete: 'cascade',
    },
    enrollment_id: {
      type: 'integer',
      notNull: true,
      references: 'training_enrollments',
      onDelete: 'cascade',
    },
    score: { type: 'integer' },
    passed: { type: 'boolean' },
    taken_at: { type: 'timestamp' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // training_friction_notes - Track friction points encountered
  pgm.createTable('training_friction_notes', {
    id: 'id',
    enrollment_id: {
      type: 'integer',
      notNull: true,
      references: 'training_enrollments',
      onDelete: 'cascade',
    },
    module_id: {
      type: 'integer',
      references: 'training_modules',
      onDelete: 'cascade',
    },
    friction_point_text: { type: 'text', notNull: true },
    resolution_text: { type: 'text' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Add indexes for common queries
  pgm.createIndex('training_modules', ['role', 'phase']);
  pgm.createIndex('training_enrollments', ['user_id']);
  pgm.createIndex('training_progress', ['enrollment_id']);
  pgm.createIndex('training_friction_notes', ['enrollment_id']);
};

exports.down = (pgm) => {
  pgm.dropTable('training_friction_notes');
  pgm.dropTable('training_assessments');
  pgm.dropTable('training_progress');
  pgm.dropTable('training_enrollments');
  pgm.dropTable('training_modules');
};
