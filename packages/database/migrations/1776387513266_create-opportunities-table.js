exports.up = (pgm) => {
  pgm.createTable('opportunities', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    organization_id: {
      type: 'integer',
      notNull: true,
      references: 'organizations',
      onDelete: 'cascade',
    },
    status: { type: 'varchar(50)', notNull: true, default: 'open' },
    value: { type: 'decimal(10, 2)', notNull: true, default: 0.00 },
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
  pgm.dropTable('opportunities');
};
