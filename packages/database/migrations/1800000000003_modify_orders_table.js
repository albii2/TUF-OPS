exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add the new column for the active upload
  pgm.addColumn('orders', {
    active_upload_id: { type: 'integer', references: 'raw_order_uploads', onDelete: 'SET NULL' },
    notes: { type: 'text' },
  });

  // Drop the old status check constraint
  pgm.dropConstraint('orders', 'orders_status_check');

  // Add the new, expanded status check constraint
  pgm.addConstraint('orders', 'orders_status_check', {
    check: "status IN ('CREATED', 'FORM_RECEIVED', 'VALIDATING', 'READY_FOR_VENDOR', 'IN_PRODUCTION', 'QC', 'SHIPPED', 'DELIVERED', 'ON_HOLD', 'CANCELLED')",
  });

  // Rename deal_type to order_type for clarity
  pgm.renameColumn('orders', 'deal_type', 'order_type');
};

exports.down = (pgm) => {
  pgm.dropColumn('orders', 'active_upload_id');
  pgm.dropConstraint('orders', 'orders_status_check');
  pgm.addConstraint('orders', 'orders_status_check', {
    check: "status IN ('CREATED', 'IN_PRODUCTION', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED')",
  });
  pgm.renameColumn('orders', 'order_type', 'deal_type');
};
