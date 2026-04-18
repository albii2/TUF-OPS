exports.up = (pgm) => {
  pgm.createTable('organizations', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    assigned_rep_id: { type: 'integer' },
    assigned_director_id: { type: 'integer' },
    territory_id: { type: 'integer' },
    status: { type: 'varchar(50)', notNull: true, default: 'active' },
    created_by: { type: 'integer', notNull: true },
    updated_by: { type: 'integer', notNull: true },
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
};

exports.down = (pgm) => {
  pgm.dropTable('organizations');
};
