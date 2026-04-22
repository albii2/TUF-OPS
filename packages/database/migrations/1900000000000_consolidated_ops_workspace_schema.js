exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. raw_order_uploads
  pgm.createTable('raw_order_uploads', {
    id: 'id',
    file_name: { type: 'varchar(255)', notNull: true },
    file_path: { type: 'varchar(1024)', notNull: true },
    order_type: { type: 'varchar(50)', notNull: true },
    processing_status: { type: 'varchar(50)', notNull: true, default: 'PENDING' },
    uploaded_by_user_id: { type: 'integer' }, // Can be linked to a users table if one exists
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // 2. orders_raw
  pgm.createTable('orders_raw', {
    id: 'id',
    source_upload_id: { type: 'integer', notNull: true, references: 'raw_order_uploads' },
    source_row_number: { type: 'integer' },
    order_number: { type: 'varchar(255)' },
    email: { type: 'varchar(255)' },
    customer_name: { type: 'varchar(255)' },
    base_sku: { type: 'varchar(100)' },
    quantity: { type: 'integer' },
    size: { type: 'varchar(50)' },
    item_role: { type: 'varchar(50)' },
    set_role: { type: 'varchar(50)' },
    color: { type: 'varchar(100)' },
    player_name: { type: 'varchar(255)' },
    name_on_back: { type: 'varchar(255)' },
    player_number: { type: 'varchar(10)' },
    sleeve_number: { type: 'varchar(10)' },
    "timestamp": { type: 'timestamp' },
    order_total: { type: 'decimal(10, 2)' },
    notes: { type: 'text' },
    order_type: { type: 'varchar(50)' },
    validation_status: { type: 'varchar(50)', notNull: true, default: 'PENDING' },
    parse_errors: { type: 'text[]' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // 3. orders (assuming basic structure)
  pgm.createTable('orders', {
      id: 'id',
      opportunity_id: { type: 'integer', references: 'opportunities' },
      status: { type: 'varchar(255)', notNull: true, default: 'pending' },
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
    },
  );

  // 4. order_items
  pgm.createTable('order_items', {
    id: 'id',
    order_id: { type: 'integer', notNull: true, references: 'orders' },
    source_raw_row_id: { type: 'integer', notNull: true, references: 'orders_raw' },
    order_number: { type: 'varchar(255)' },
    customer_name: { type: 'varchar(255)' },
    set_role: { type: 'varchar(50)' },
    item_role: { type: 'varchar(50)' },
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
  pgm.dropTable('orders');
  pgm.dropTable('orders_raw');
  pgm.dropTable('raw_order_uploads');
};
