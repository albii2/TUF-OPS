exports.up = (pgm) => {
  pgm.addColumns('organizations', {
    owner_id: { type: 'integer', notNull: true },
    status: { type: 'varchar(50)', notNull: true, default: 'active' },
    created_by: { type: 'integer', notNull: true },
    updated_by: { type: 'integer', notNull: true },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('organizations', ['owner_id', 'status', 'created_by', 'updated_by']);
};
