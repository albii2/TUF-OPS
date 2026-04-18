exports.up = (pgm) => {
  pgm.addColumns('opportunities', {
    deal_type: { type: 'varchar(50)', notNull: true, default: 'UNIFORM' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('opportunities', ['deal_type']);
};