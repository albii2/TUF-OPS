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
