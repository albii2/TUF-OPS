exports.up = async (pgm) => {
  await pgm.db.query(`
    CREATE TABLE daily_activities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
      calls INTEGER NOT NULL DEFAULT 0,
      emails INTEGER NOT NULL DEFAULT 0,
      texts INTEGER NOT NULL DEFAULT 0,
      linkedin_msgs INTEGER NOT NULL DEFAULT 0,
      conversations INTEGER NOT NULL DEFAULT 0,
      meetings INTEGER NOT NULL DEFAULT 0,
      quotes INTEGER NOT NULL DEFAULT 0,
      follow_ups INTEGER NOT NULL DEFAULT 0,
      new_opps INTEGER NOT NULL DEFAULT 0,
      next_actions TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, activity_date)
    );
  `);
};

exports.down = async (pgm) => {
  await pgm.db.query('DROP TABLE IF EXISTS daily_activities');
};
