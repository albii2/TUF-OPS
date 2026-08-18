// ─── Certification Audit Trail — who certified, when, under which Academy version ───
// Created: 2026-08-18 — Mission 8 (auditable certification)
exports.up = async (pgm) => {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS certified_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS certified_by INTEGER REFERENCES users(id);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS academy_version TEXT NOT NULL DEFAULT 'v2';
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP COLUMN IF EXISTS certified_at;
    ALTER TABLE users DROP COLUMN IF EXISTS certified_by;
    ALTER TABLE users DROP COLUMN IF EXISTS academy_version;
  `);
};
