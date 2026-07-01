exports.up = async (pgm) => {
  await pgm.addColumn('users', {
    login_count: { type: 'integer', notNull: true, default: 0 },
  });
  // last_login_at may already exist; add if missing
  await pgm.addColumn('users', {
    last_login_at: { type: 'timestamp with time zone' },
  }, { ifNotExists: true });
};

exports.down = async (pgm) => {
  await pgm.dropColumn('users', 'login_count');
  await pgm.dropColumn('users', 'last_login_at', { ifExists: true });
};