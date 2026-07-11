exports.up = async (pgm) => {
  await pgm.db.query(`
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS position_applied TEXT;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS position_recommended TEXT;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assigned_recruiter TEXT;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS interview_notes TEXT;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_status TEXT;
    ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_date TIMESTAMPTZ;
  `);
};

exports.down = async () => {};
