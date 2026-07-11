exports.up = async (pgm) => {
  await pgm.db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS credential_version INTEGER DEFAULT 0;
    UPDATE users SET credential_version = 0 WHERE credential_version IS NULL;
  `);
};

exports.down = async () => {};
