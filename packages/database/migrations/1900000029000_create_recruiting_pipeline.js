exports.up = async (pgm) => {
  // Candidates table — recruiting pipeline
  await pgm.db.query(`
    CREATE TABLE candidates (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      source TEXT NOT NULL DEFAULT 'other',
      stage TEXT NOT NULL DEFAULT 'applied'
        CHECK (stage IN (
          'applied', 'screening', 'interview_scheduled', 'interview_complete',
          'offer_extended', 'offer_accepted', 'activated', 'academy',
          'certified', 'territory_assigned', 'active_tae', 'rejected'
        )),
      assigned_director_id INTEGER REFERENCES users(id),
      territory_id INTEGER,
      resume_url TEXT,
      notes TEXT,
      interview_date TIMESTAMPTZ,
      interview_scorecard JSONB,
      offer_details JSONB,
      certification_progress JSONB,
      user_id INTEGER REFERENCES users(id),
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Candidate activity log — timeline of actions
  await pgm.db.query(`
    CREATE TABLE candidate_activities (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'note'
        CHECK (type IN (
          'note', 'email_sent', 'interview_scheduled', 'interview_completed',
          'offer_sent', 'offer_accepted', 'offer_rejected', 'activated',
          'academy_started', 'certified', 'territory_assigned', 'rejected',
          'resume_uploaded', 'stage_changed'
        )),
      description TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};

exports.down = async (pgm) => {
  await pgm.db.query('DROP TABLE IF EXISTS candidate_activities');
  await pgm.db.query('DROP TABLE IF EXISTS candidates');
};
