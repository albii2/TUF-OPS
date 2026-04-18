exports.up = (pgm) => {
  pgm.createTable('commissions', {
    id: 'id',
    opportunity_id: {
      type: 'integer',
      notNull: true,
      references: 'opportunities',
      onDelete: 'cascade',
      unique: true, // A commission record should be unique per opportunity
    },
    rep_user_id: { type: 'integer', notNull: true },
    director_user_id: { type: 'integer', notNull: true },
    gross_profit: { type: 'decimal(12, 2)', notNull: true },
    rep_rate: { type: 'decimal(5, 4)', notNull: true },
    rep_commission: { type: 'decimal(12, 2)', notNull: true },
    director_rate: { type: 'decimal(5, 4)', notNull: true },
    director_override: { type: 'decimal(12, 2)', notNull: true },
    status: { type: 'varchar(50)', notNull: true, default: 'PENDING' }, // PENDING | LOCKED | PAID | VOIDED
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
  pgm.dropTable('commissions');
};