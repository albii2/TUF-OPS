exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('order_items', {
    id: 'id',
    order_id: { type: 'integer', notNull: true, references: 'orders' },
    source_raw_row_id: { type: 'integer', notNull: true, references: 'orders_raw' },
    item_type: { type: 'varchar(50)' },
    base_item: { type: 'varchar(255)' },
    sku: { type: 'varchar(100)' },
    color: { type: 'varchar(100)' },
    quantity: { type: 'integer', notNull: true },
    size: { type: 'varchar(50)' },
    player_name: { type: 'varchar(255)' },
    player_number: { type: 'varchar(10)' },
    personalization: { type: 'jsonb' },
    validation_status: { type: 'varchar(50)', notNull: true, default: 'NEEDS_REVIEW' },
    sort_order: { type: 'integer' },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('order_items');
};
