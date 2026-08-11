// Migration: Add classification fields to executive_intake
// — attention_score (0-100), classification_type, due_date, related_person_id, related_organization_id

exports.up = async (pgm) => {
  await pgm.db.query(`
    ALTER TABLE executive_intake 
    ADD COLUMN IF NOT EXISTS attention_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS classification_type TEXT,
    ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS related_person_id INTEGER REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS related_organization_id INTEGER REFERENCES organizations(id);
  `);

  // Index for queries by attention score
  await pgm.db.query(`
    CREATE INDEX IF NOT EXISTS idx_intake_attention 
    ON executive_intake(attention_score DESC) 
    WHERE status = 'open';
  `);

  // Index for classification type
  await pgm.db.query(`
    CREATE INDEX IF NOT EXISTS idx_intake_classification 
    ON executive_intake(classification_type) 
    WHERE status = 'open';
  `);

  console.log('✅ executive_intake: added attention_score, classification_type, due_date, related_person_id, related_organization_id');
};

exports.down = async (pgm) => {
  await pgm.db.query(`
    ALTER TABLE executive_intake 
    DROP COLUMN IF EXISTS attention_score,
    DROP COLUMN IF EXISTS classification_type,
    DROP COLUMN IF EXISTS due_date,
    DROP COLUMN IF EXISTS related_person_id,
    DROP COLUMN IF EXISTS related_organization_id;
  `);
  console.log('✅ Dropped classification columns');
};
