exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('users', {
    hr_docs_completed: { type: 'boolean', notNull: true, default: false },
    director_signed_off: { type: 'boolean', notNull: true, default: false },
    is_certified: { type: 'boolean', notNull: true, default: false }
  }, { ifNotExists: true });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['hr_docs_completed', 'director_signed_off', 'is_certified'], { ifExists: true });
};
