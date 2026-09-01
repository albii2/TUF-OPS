exports.shorthands = undefined;

// Fall/Winter 2026 field deployment — Ryan Streetar launch clusters.
// launch_cluster marks an organization's deployment cluster so reps see
// accounts grouped by geography and management can compare cluster performance.
// Idempotent: the column was already added directly to production; IF NOT EXISTS
// keeps this safe if node-pg-migrate runs against a DB that has it.
exports.up = (pgm) => {
  pgm.sql('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS launch_cluster TEXT');
};

exports.down = (pgm) => {
  pgm.sql('ALTER TABLE organizations DROP COLUMN IF EXISTS launch_cluster');
};
