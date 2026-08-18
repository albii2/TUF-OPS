// ─── rep_activities — legacy Prisma-era table referenced by activities.service ───
// Never existed in node-pg-migrate migrations nor startup ensure → activity tests
// (and any runtime path through createRepActivity) failed with missing table.
// Created: 2026-08-18
exports.up = async (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS rep_activities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opportunity_id INTEGER,
      activity_type VARCHAR(40) NOT NULL,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_rep_activities_user ON rep_activities (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_rep_activities_opp ON rep_activities (opportunity_id);
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS rep_activities CASCADE;`);
};
