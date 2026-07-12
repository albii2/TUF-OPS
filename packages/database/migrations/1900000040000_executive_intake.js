exports.up = async (pgm) => {
  await pgm.db.query(`
    CREATE TABLE IF NOT EXISTS executive_intake (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      source TEXT NOT NULL DEFAULT 'other',
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'open',
      owner TEXT,
      next_action TEXT,
      ai_summary TEXT,
      ai_draft TEXT,
      tags TEXT[] DEFAULT '{}',
      created_by INTEGER REFERENCES users(id),
      updated_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS intake_comments (
      id SERIAL PRIMARY KEY,
      intake_id INTEGER NOT NULL REFERENCES executive_intake(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      author TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS intake_audit_log (
      id SERIAL PRIMARY KEY,
      intake_id INTEGER NOT NULL REFERENCES executive_intake(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      changed_by TEXT,
      details JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
};

exports.down = async (pgm) => {
  await pgm.db.query(`
    DROP TABLE IF EXISTS intake_audit_log;
    DROP TABLE IF EXISTS intake_comments;
    DROP TABLE IF EXISTS executive_intake;
  `);
};
