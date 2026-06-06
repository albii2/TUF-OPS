exports.shorthands = undefined;

exports.up = (pgm) => {
  // 1. vendors table - core vendor information
  pgm.createTable(
    'vendors',
    {
      id: 'id',
      name: { type: 'varchar(255)', notNull: true },
      location: { type: 'varchar(255)' },
      country: { type: 'varchar(100)', default: 'Pakistan' },
      specialization: { type: 'text' },
      contact_email: { type: 'varchar(255)' },
      contact_phone: { type: 'varchar(20)' },
      primary_contact_name: { type: 'varchar(255)' },
      monthly_capacity_min: { type: 'integer' },
      monthly_capacity_max: { type: 'integer' },
      price_per_unit_min: { type: 'decimal(10, 2)' },
      price_per_unit_max: { type: 'decimal(10, 2)' },
      lead_time_standard_days: { type: 'integer' },
      lead_time_expedite_days: { type: 'integer' },
      minimum_order_qty: { type: 'integer' },
      status: {
        type: 'varchar(50)',
        notNull: true,
        default: 'PROSPECT',
        check: "status IN ('PROSPECT', 'QUALIFIED', 'ACTIVE', 'INACTIVE', 'SUSPENDED')"
      },
      tier: {
        type: 'varchar(50)',
        check: "tier IN ('PREMIUM', 'HIGH_VOLUME', 'MID_RANGE')"
      },
      certifications: { type: 'text[]' },
      notes: { type: 'text' },
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
    { ifNotExists: true }
  );

  // 2. vendor_agreements table - contractual terms
  pgm.createTable(
    'vendor_agreements',
    {
      id: 'id',
      vendor_id: { type: 'integer', notNull: true, references: 'vendors(id)', onDelete: 'CASCADE' },
      agreement_date: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
      effective_date: { type: 'timestamp' },
      expiry_date: { type: 'timestamp' },
      payment_terms: {
        type: 'varchar(100)',
        check: "payment_terms IN ('NET_30', 'NET_60', 'DEPOSIT_50', 'DEPOSIT_100', 'COD')"
      },
      currency: { type: 'varchar(10)', default: 'USD' },
      price_per_unit: { type: 'decimal(10, 2)', notNull: true },
      minimum_order_qty: { type: 'integer' },
      price_tier_volume_1: { type: 'decimal(10, 2)' },
      price_tier_volume_2: { type: 'decimal(10, 2)' },
      status: { type: 'varchar(50)', notNull: true, default: 'ACTIVE' },
      terms_conditions: { type: 'text' },
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
    { ifNotExists: true }
  );

  // 3. vendor_performance_metrics table
  pgm.createTable(
    'vendor_performance_metrics',
    {
      id: 'id',
      vendor_id: { type: 'integer', notNull: true, references: 'vendors(id)', onDelete: 'CASCADE' },
      metric_month: { type: 'timestamp', notNull: true },
      total_orders: { type: 'integer', default: 0 },
      on_time_delivery_count: { type: 'integer', default: 0 },
      on_time_delivery_percentage: { type: 'decimal(5, 2)' },
      defect_rate_percentage: { type: 'decimal(5, 2)' },
      average_quality_score: { type: 'decimal(5, 2)' },
      communication_response_hours: { type: 'decimal(5, 2)' },
      price_variance_percentage: { type: 'decimal(5, 2)' },
      volume_flexibility_score: { type: 'decimal(5, 2)' },
      notes: { type: 'text' },
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
    { ifNotExists: true }
  );

  pgm.addConstraint('vendor_performance_metrics', 'vendor_perf_vendor_month_unique', {
    unique: ['vendor_id', 'metric_month']
  });

  // 4. Add vendor_settlement_status and related fields to orders table
  pgm.addColumns('orders', {
    vendor_settlement_status: {
      type: 'varchar(50)',
      check: "vendor_settlement_status IN ('PENDING', 'INVOICED', 'PAID', 'DISPUTED', 'REFUNDED')",
      default: 'PENDING'
    },
    vendor_invoice_id: { type: 'varchar(255)' },
    vendor_invoice_date: { type: 'timestamp' },
    vendor_payment_due_date: { type: 'timestamp' },
    vendor_paid_date: { type: 'timestamp' },
    order_value: { type: 'decimal(10, 2)' },
    vendor_payment_amount: { type: 'decimal(10, 2)' },
    quantity_ordered: { type: 'integer' },
    unit_price: { type: 'decimal(10, 2)' },
  });

  // 5. vendor_payments table for settlement tracking
  pgm.createTable(
    'vendor_payments',
    {
      id: 'id',
      vendor_id: { type: 'integer', notNull: true, references: 'vendors(id)', onDelete: 'CASCADE' },
      payment_date: { type: 'timestamp', notNull: true },
      amount: { type: 'decimal(10, 2)', notNull: true },
      currency: { type: 'varchar(10)', default: 'USD' },
      payment_method: { type: 'varchar(100)' },
      reference: { type: 'varchar(255)' },
      status: {
        type: 'varchar(50)',
        notNull: true,
        default: 'PENDING',
        check: "status IN ('PENDING', 'PROCESSED', 'FAILED', 'CANCELLED')"
      },
      notes: { type: 'text' },
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
    { ifNotExists: true }
  );

  // 6. vendor_order_mapping table for tracking relationships
  pgm.createTable(
    'vendor_order_mapping',
    {
      id: 'id',
      order_id: { type: 'integer', notNull: true, references: 'orders(id)', onDelete: 'CASCADE' },
      vendor_id: { type: 'integer', notNull: true, references: 'vendors(id)' },
      assigned_date: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
      quantity_allocated: { type: 'integer' },
      notes: { type: 'text' },
    },
    { ifNotExists: true }
  );

  pgm.addConstraint('vendor_order_mapping', 'vendor_order_unique', { unique: ['order_id', 'vendor_id'] });

  // Create indexes for performance
  pgm.createIndex('orders', ['vendor_id']);
  pgm.createIndex('orders', ['vendor_settlement_status']);
  pgm.createIndex('vendors', ['status']);
  pgm.createIndex('vendors', ['name']);
  pgm.createIndex('vendor_payments', ['vendor_id', 'payment_date']);
  pgm.createIndex('vendor_performance_metrics', ['vendor_id', 'metric_month']);
};

exports.down = (pgm) => {
  pgm.dropIndex('vendor_performance_metrics', ['vendor_id', 'metric_month']);
  pgm.dropIndex('vendor_payments', ['vendor_id', 'payment_date']);
  pgm.dropIndex('vendors', ['name']);
  pgm.dropIndex('vendors', ['status']);
  pgm.dropIndex('orders', ['vendor_settlement_status']);
  pgm.dropIndex('orders', ['vendor_id']);

  pgm.dropTable('vendor_order_mapping', { ifExists: true });
  pgm.dropTable('vendor_payments', { ifExists: true });
  pgm.dropTable('vendor_performance_metrics', { ifExists: true });
  pgm.dropTable('vendor_agreements', { ifExists: true });
  pgm.dropTable('vendors', { ifExists: true });

  pgm.dropColumns('orders', [
    'vendor_settlement_status',
    'vendor_invoice_id',
    'vendor_invoice_date',
    'vendor_payment_due_date',
    'vendor_paid_date',
    'order_value',
    'vendor_payment_amount',
    'quantity_ordered',
    'unit_price',
  ]);
};
