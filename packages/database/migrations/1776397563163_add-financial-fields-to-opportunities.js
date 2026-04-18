exports.up = (pgm) => {
  pgm.addColumns('opportunities', {
    estimated_revenue: { type: 'decimal(12, 2)' },
    actual_revenue: { type: 'decimal(12, 2)' },
    actual_cost: { type: 'decimal(12, 2)' },
    gross_profit: { type: 'decimal(12, 2)' },
    closed_at: { type: 'timestamp' },
    loss_reason: { type: 'text' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('opportunities', [
    'estimated_revenue',
    'actual_revenue',
    'actual_cost',
    'gross_profit',
    'closed_at',
    'loss_reason',
  ]);
};