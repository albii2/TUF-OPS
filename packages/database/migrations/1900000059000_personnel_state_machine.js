exports.shorthands = undefined;

// Personnel state machine (Academy Operating Standard, Sept 2026):
// ACTIVATION_PENDING → ACTIVE (activated; certification in progress while is_certified=false)
// → CERTIFICATION_COMPLETE (is_certified=true) → FIELD_READY (field-approved).
// CLOSED = removed from active consideration (record preserved, no login/access).
exports.up = (pgm) => {
  pgm.sql(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check`);
  pgm.sql(`ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (
    status = ANY (ARRAY[
      'ACTIVE'::varchar,
      'INACTIVE'::varchar,
      'ACTIVATION_PENDING'::varchar,
      'CERTIFICATION_COMPLETE'::varchar,
      'FIELD_READY'::varchar,
      'CLOSED'::varchar
    ])
  )`);
};

exports.down = (pgm) => {
  pgm.sql(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check`);
  pgm.sql(`ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (
    status = ANY (ARRAY['ACTIVE'::varchar, 'INACTIVE'::varchar])
  )`);
};
