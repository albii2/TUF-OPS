exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT current_timestamp
  `);
};

exports.down = (pgm) => {
  pgm.sql('ALTER TABLE activities DROP COLUMN IF EXISTS updated_at');
};
