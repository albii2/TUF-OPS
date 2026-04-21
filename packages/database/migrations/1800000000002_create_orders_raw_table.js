exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('orders_raw', {
    id: 'id',
    upload_id: { type: 'integer', notNull: true, references: 'raw_order_uploads' },
    row_data_json: { type: 'jsonb', notNull: true },
    is_processed: { type: 'boolean', notNull: true, default: false },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('orders_raw');
};
