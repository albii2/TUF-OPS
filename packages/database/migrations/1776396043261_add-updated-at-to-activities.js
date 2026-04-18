exports.up = (pgm) => {
  pgm.addColumn('activities', {
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('activities', 'updated_at');
};