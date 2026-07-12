exports.up = async (pgm) => {
  await pgm.db.query(`
    CREATE TABLE IF NOT EXISTS people_pipeline (
      id SERIAL PRIMARY KEY,
      candidate_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'REP',
      territory TEXT,
      current_stage TEXT NOT NULL DEFAULT 'application',
      stage_entered_at TIMESTAMP DEFAULT NOW(),
      
      -- Stage timestamps
      application_date TIMESTAMP DEFAULT NOW(),
      interview_date TIMESTAMP,
      offer_date TIMESTAMP,
      acceptance_date TIMESTAMP,
      documents_completed_date TIMESTAMP,
      account_created_date TIMESTAMP,
      academy_start_date TIMESTAMP,
      academy_complete_date TIMESTAMP,
      certified_date TIMESTAMP,
      territory_assigned_date TIMESTAMP,
      pipeline_assigned_date TIMESTAMP,
      first_appointment_date TIMESTAMP,
      first_proposal_date TIMESTAMP,
      first_order_date TIMESTAMP,
      
      -- Ownership
      assigned_hr TEXT DEFAULT 'Brittany',
      assigned_director TEXT,
      notes TEXT,
      
      -- Status
      status TEXT NOT NULL DEFAULT 'active',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    -- Pipeline stage history
    CREATE TABLE IF NOT EXISTS pipeline_stage_history (
      id SERIAL PRIMARY KEY,
      pipeline_id INTEGER NOT NULL REFERENCES people_pipeline(id) ON DELETE CASCADE,
      stage TEXT NOT NULL,
      entered_at TIMESTAMP DEFAULT NOW(),
      notes TEXT
    );
  `);
};

exports.down = async (pgm) => {
  await pgm.db.query(`
    DROP TABLE IF EXISTS pipeline_stage_history;
    DROP TABLE IF EXISTS people_pipeline;
  `);
};
