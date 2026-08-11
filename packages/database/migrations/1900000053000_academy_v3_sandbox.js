// ─── Academy v3: Sandbox-Based Training (Addresses Red Team Findings 1-7) ───
// Created: 2026-07-29
//
// RED TEAM FINDINGS ADDRESSED:
// 1. NO SANDBOX → Sandbox schemas per-TAE, isolated from production
// 2. DIRECTOR BOTTLENECK → Mentors, sampling, automated quality gates
// 3. TEACHES DATA ENTRY NOT SELLING → Phase 4: Sales Execution
// 4. QUANTITATIVE-ONLY GATES → Quality checks (min fields, citations, dedup)
// 5. 296 EXISTING LEADS → Lead taxonomy, dedup scan, claim-or-create flow
// 6. SCALE → Staggered cohorts (max 5), territory locking, batch review
// 7. UNVERIFIED RESEARCH → Source citations, random audits, verification mission

exports.up = async (pgm) => {
  // ── Phase 1 Quizzes (enhanced) ──
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_v3_quiz_attempts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quiz_id VARCHAR(50) NOT NULL,
      score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
      passed BOOLEAN NOT NULL DEFAULT false,
      answers JSONB NOT NULL DEFAULT '[]',
      attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, quiz_id, attempted_at)
    )
  `);

  // ── Phase 2 CRM Walkthrough Progress ──
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_v3_walkthroughs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      step_id VARCHAR(100) NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT false,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, step_id)
    )
  `);

  // ── SANDBOX INFRASTRUCTURE (Red Team #1) ──
  // Each TAE gets an isolated sandbox using user_id as the isolation key.
  // All sandbox tables mirror production but include user_id FK for isolation.
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_v3_sandbox_orgs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      website VARCHAR(500),
      physical_address TEXT,
      enrollment INTEGER,
      sports_programs TEXT[] DEFAULT '{}',
      current_provider VARCHAR(255),
      research_notes TEXT,
      source_url VARCHAR(1000),
      source_citation TEXT,
      verified BOOLEAN NOT NULL DEFAULT false,
      lead_status VARCHAR(50) NOT NULL DEFAULT 'unclaimed'
        CHECK (lead_status IN ('unclaimed', 'claimed', 'active', 'closed', 'stale')),
      promoted_to_production BOOLEAN NOT NULL DEFAULT false,
      promoted_at TIMESTAMPTZ,
      promoted_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_v3_sandbox_contacts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sandbox_org_id INTEGER NOT NULL REFERENCES academy_v3_sandbox_orgs(id) ON DELETE CASCADE,
      full_name VARCHAR(255) NOT NULL,
      title VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      is_decision_maker BOOLEAN NOT NULL DEFAULT false,
      source_citation TEXT,
      verified BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_v3_sandbox_opportunities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sandbox_org_id INTEGER NOT NULL REFERENCES academy_v3_sandbox_orgs(id) ON DELETE CASCADE,
      sandbox_contact_id INTEGER REFERENCES academy_v3_sandbox_contacts(id),
      name VARCHAR(255) NOT NULL,
      estimated_value DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (estimated_value > 0),
      target_close_date DATE,
      lane VARCHAR(50) NOT NULL
        CHECK (lane IN ('Uniforms', 'Travel Gear', 'Team Store', 'Letterman')),
      stage VARCHAR(50) NOT NULL DEFAULT 'LEAD'
        CHECK (stage IN ('LEAD', 'LEAD_ENGAGED', 'CONTACTED', 'DISCOVERY', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST')),
      sport VARCHAR(100),
      notes TEXT,
      source_citation TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_v3_sandbox_activities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sandbox_org_id INTEGER REFERENCES academy_v3_sandbox_orgs(id) ON DELETE SET NULL,
      sandbox_opp_id INTEGER REFERENCES academy_v3_sandbox_opportunities(id) ON DELETE SET NULL,
      activity_type VARCHAR(50) NOT NULL
        CHECK (activity_type IN ('call', 'email', 'meeting', 'visit', 'role_play', 'pitch')),
      description TEXT,
      notes TEXT,
      template_used VARCHAR(255),
      scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_v3_sales_executions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      execution_type VARCHAR(50) NOT NULL
        CHECK (execution_type IN ('phone_call', 'email_pitch', 'objection_handling', 'role_play', 'shadow_session')),
      sandbox_org_id INTEGER REFERENCES academy_v3_sandbox_orgs(id),
      sandbox_opp_id INTEGER REFERENCES academy_v3_sandbox_opportunities(id),
      notes TEXT NOT NULL,
      objection_handled VARCHAR(255),
      feedback TEXT,
      mentor_id INTEGER REFERENCES users(id),
      score INTEGER CHECK (score BETWEEN 0 AND 100),
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // ── Quality Gates (Red Team #4) ──
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_v3_quality_checks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entity_type VARCHAR(50) NOT NULL
        CHECK (entity_type IN ('org', 'contact', 'opportunity', 'activity', 'sales_execution')),
      entity_id INTEGER NOT NULL,
      check_type VARCHAR(50) NOT NULL
        CHECK (check_type IN ('min_fields', 'source_citation', 'duplicate_detection', 'research_depth', 'verification')),
      passed BOOLEAN NOT NULL DEFAULT false,
      details JSONB DEFAULT '{}',
      checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // ── Lead Taxonomy (Red Team #5) ──
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_v3_lead_taxonomy (
      id SERIAL PRIMARY KEY,
      existing_lead_id INTEGER,
      lead_name VARCHAR(255) NOT NULL,
      lead_status VARCHAR(50) NOT NULL DEFAULT 'unclaimed'
        CHECK (lead_status IN ('unclaimed', 'claimed', 'active', 'closed', 'stale')),
      claimed_by INTEGER REFERENCES users(id),
      claimed_at TIMESTAMPTZ,
      territory_locked_at TIMESTAMPTZ,
      duplicate_cluster_id VARCHAR(100),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // ── Cohorts & Territory Locking (Red Team #6) ──
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_v3_cohorts (
      id SERIAL PRIMARY KEY,
      cohort_name VARCHAR(100) NOT NULL UNIQUE,
      max_size INTEGER NOT NULL DEFAULT 5 CHECK (max_size <= 5),
      territory_zone VARCHAR(100) NOT NULL,
      starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ends_at TIMESTAMPTZ,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_v3_cohort_members (
      id SERIAL PRIMARY KEY,
      cohort_id INTEGER NOT NULL REFERENCES academy_v3_cohorts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(cohort_id, user_id)
    )
  `);

  // ── Verification Missions (Red Team #7) ──
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_v3_verification_audits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entity_type VARCHAR(50) NOT NULL
        CHECK (entity_type IN ('org', 'contact', 'opportunity')),
      entity_id INTEGER NOT NULL,
      auditor_id INTEGER NOT NULL REFERENCES users(id),
      audit_type VARCHAR(50) NOT NULL DEFAULT 'random'
        CHECK (audit_type IN ('random', 'targeted', 'graduation')),
      passed BOOLEAN,
      findings TEXT,
      audited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // ── Graduation (Enhanced v3) ──
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS academy_v3_graduation (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      phase1_completed BOOLEAN NOT NULL DEFAULT false,
      phase2_completed BOOLEAN NOT NULL DEFAULT false,
      phase3_completed BOOLEAN NOT NULL DEFAULT false,
      phase4_completed BOOLEAN NOT NULL DEFAULT false,
      phase5_completed BOOLEAN NOT NULL DEFAULT false,
      orgs_quality_count INTEGER NOT NULL DEFAULT 0,
      contacts_quality_count INTEGER NOT NULL DEFAULT 0,
      opps_quality_count INTEGER NOT NULL DEFAULT 0,
      activities_quality_count INTEGER NOT NULL DEFAULT 0,
      sales_executions_count INTEGER NOT NULL DEFAULT 0,
      all_gates_passed BOOLEAN NOT NULL DEFAULT false,
      director_approved BOOLEAN NOT NULL DEFAULT false,
      approved_by INTEGER REFERENCES users(id),
      approved_at TIMESTAMPTZ,
      mentor_id INTEGER REFERENCES users(id),
      data_promoted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // ── Indexes ──
  pgm.sql(`
    CREATE INDEX IF NOT EXISTS idx_v3_sandbox_orgs_user ON academy_v3_sandbox_orgs(user_id);
    CREATE INDEX IF NOT EXISTS idx_v3_sandbox_contacts_user ON academy_v3_sandbox_contacts(user_id);
    CREATE INDEX IF NOT EXISTS idx_v3_sandbox_opps_user ON academy_v3_sandbox_opportunities(user_id);
    CREATE INDEX IF NOT EXISTS idx_v3_sandbox_activities_user ON academy_v3_sandbox_activities(user_id);
    CREATE INDEX IF NOT EXISTS idx_v3_sales_executions_user ON academy_v3_sales_executions(user_id);
    CREATE INDEX IF NOT EXISTS idx_v3_quality_checks_user ON academy_v3_quality_checks(user_id);
    CREATE INDEX IF NOT EXISTS idx_v3_lead_taxonomy_status ON academy_v3_lead_taxonomy(lead_status);
    CREATE INDEX IF NOT EXISTS idx_v3_cohort_members_user ON academy_v3_cohort_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_v3_verification_audits_user ON academy_v3_verification_audits(user_id);
    CREATE INDEX IF NOT EXISTS idx_v3_quiz_attempts_user ON academy_v3_quiz_attempts(user_id);
  `);

  // ── Seed 296 existing leads into lead taxonomy (dedup scan as part of migration) ──
  // Insert leads from existing organizations table into the taxonomy for claim-or-create flow
  pgm.sql(`
    INSERT INTO academy_v3_lead_taxonomy (existing_lead_id, lead_name, lead_status, duplicate_cluster_id, created_at, updated_at)
    SELECT o.id, o.name, 'unclaimed', md5(lower(o.name)), NOW(), NOW()
    FROM organizations o
    WHERE NOT EXISTS (
      SELECT 1 FROM academy_v3_lead_taxonomy lt WHERE lt.existing_lead_id = o.id
    )
    ON CONFLICT DO NOTHING
  `);

  // ── Seed an initial cohort ──
  pgm.sql(`
    INSERT INTO academy_v3_cohorts (cohort_name, max_size, territory_zone, created_at, updated_at)
    VALUES ('Alpha Squad', 5, 'default', NOW(), NOW())
    ON CONFLICT (cohort_name) DO NOTHING
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS academy_v3_verification_audits CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS academy_v3_cohort_members CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS academy_v3_cohorts CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS academy_v3_lead_taxonomy CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS academy_v3_quality_checks CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS academy_v3_sales_executions CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS academy_v3_sandbox_activities CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS academy_v3_sandbox_opportunities CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS academy_v3_sandbox_contacts CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS academy_v3_sandbox_orgs CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS academy_v3_walkthroughs CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS academy_v3_quiz_attempts CASCADE`);
  pgm.sql(`DROP TABLE IF EXISTS academy_v3_graduation CASCADE`);
};
