exports.up = async (pgm) => {
  // ── Academy Progress — tracks a TAE's journey through all 3 phases ──
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      phase1_completed BOOLEAN NOT NULL DEFAULT false,
      phase2_completed BOOLEAN NOT NULL DEFAULT false,
      phase3_completed BOOLEAN NOT NULL DEFAULT false,
      graduated BOOLEAN NOT NULL DEFAULT false,
      director_approved BOOLEAN NOT NULL DEFAULT false,
      approved_by INTEGER REFERENCES users(id),
      approved_at TIMESTAMPTZ,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id)
    );
  `);

  // ── Academy Missions — each mission in Phase 3 Territory Development ──
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_missions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mission_number INTEGER NOT NULL CHECK (mission_number BETWEEN 1 AND 5),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'locked'
        CHECK (status IN ('locked', 'available', 'in_progress', 'submitted', 'approved', 'rejected')),
      started_at TIMESTAMPTZ,
      submitted_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      rejection_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, mission_number)
    );
  `);

  // ── Director Reviews — quality gates for mission submissions ──
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS director_reviews (
      id SERIAL PRIMARY KEY,
      mission_id INTEGER NOT NULL REFERENCES academy_missions(id) ON DELETE CASCADE,
      reviewer_id INTEGER NOT NULL REFERENCES users(id),
      status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
      strengths TEXT,
      corrections TEXT,
      coaching_notes TEXT,
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // ── Indexes ──
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_academy_progress_user ON academy_progress(user_id);
    CREATE INDEX IF NOT EXISTS idx_academy_missions_user ON academy_missions(user_id);
    CREATE INDEX IF NOT EXISTS idx_academy_missions_status ON academy_missions(status);
    CREATE INDEX IF NOT EXISTS idx_director_reviews_mission ON director_reviews(mission_id);
    CREATE INDEX IF NOT EXISTS idx_director_reviews_reviewer ON director_reviews(reviewer_id);
  `);

  // ── Certification Checklist Table — tracks graduation requirements ──
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_checklist (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      orgs_created INTEGER NOT NULL DEFAULT 0,
      orgs_required INTEGER NOT NULL DEFAULT 5,
      contacts_added INTEGER NOT NULL DEFAULT 0,
      contacts_required INTEGER NOT NULL DEFAULT 15,
      opportunities_created INTEGER NOT NULL DEFAULT 0,
      opportunities_required INTEGER NOT NULL DEFAULT 5,
      activities_logged INTEGER NOT NULL DEFAULT 0,
      activities_required INTEGER NOT NULL DEFAULT 15,
      all_opps_have_details BOOLEAN NOT NULL DEFAULT false,
      territory_approved BOOLEAN NOT NULL DEFAULT false,
      last_synced_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id)
    );
  `);

  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_academy_checklist_user ON academy_checklist(user_id);
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS academy_checklist CASCADE;`);
  pgm.sql(`DROP TABLE IF EXISTS director_reviews CASCADE;`);
  pgm.sql(`DROP TABLE IF EXISTS academy_missions CASCADE;`);
  pgm.sql(`DROP TABLE IF EXISTS academy_progress CASCADE;`);
};
