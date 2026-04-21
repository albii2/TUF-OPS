exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('raw_order_uploads', {
    id: 'id',
    order_id: { type: 'integer', notNull: true, references: 'orders' },
    original_filename: { type: 'varchar(255)', notNull: true },
    is_active: { type: 'boolean', notNull: true, default: true },
    uploaded_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('raw_order_uploads');
};
