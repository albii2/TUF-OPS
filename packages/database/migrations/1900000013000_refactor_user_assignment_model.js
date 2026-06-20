exports.up = async (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      -- 1. Modify CHECK constraint on users.role
      IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
      ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
      END IF;

      -- Backfill legacy OWNER/OPS roles to ADMIN before adding the constraint
      UPDATE users SET role = 'ADMIN' WHERE role IN ('OWNER', 'OPS');

      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'REGIONAL_DIRECTOR', 'DIRECTOR', 'REP'));

      -- 2. Add columns to users table
      ALTER TABLE users ADD COLUMN IF NOT EXISTS rank varchar(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tier varchar(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS region varchar(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS state_market varchar(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS division varchar(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subterritory varchar(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS sport_focus varchar(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reports_to_user_id integer REFERENCES users(id);

      -- Backfill new user columns with default values based on role/metadata
      UPDATE users
      SET rank = 'Admin',
          region = 'National',
          division = 'All',
          subterritory = 'All',
          sport_focus = 'All'
      WHERE role = 'ADMIN';

      UPDATE users
      SET rank = 'Director',
          region = 'Midwest',
          state_market = 'MN',
          division = 'General',
          territory = 'Minnesota',
          subterritory = 'Metro + North',
          sport_focus = 'All'
      WHERE role = 'DIRECTOR' AND (lower(name) LIKE '%primeau%' OR lower(email) LIKE '%primeau%');

      -- 3. Add columns to organizations table
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS region varchar(100);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS state_market varchar(50);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS division varchar(100);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS territory varchar(100);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subterritory varchar(255);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sport_focus varchar(100);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS assigned_director_name varchar(255);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS assigned_director_email varchar(255);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS assigned_rep_name varchar(255);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS assigned_rep_email varchar(255);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS assignment_pool varchar(100);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS assignment_batch varchar(100);
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS assignment_rationale text;

    END $$;
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
      ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
      END IF;
      
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('OWNER', 'ADMIN', 'DIRECTOR', 'REP', 'OPS'));

      ALTER TABLE users DROP COLUMN IF EXISTS rank;
      ALTER TABLE users DROP COLUMN IF EXISTS tier;
      ALTER TABLE users DROP COLUMN IF EXISTS region;
      ALTER TABLE users DROP COLUMN IF EXISTS state_market;
      ALTER TABLE users DROP COLUMN IF EXISTS division;
      ALTER TABLE users DROP COLUMN IF EXISTS subterritory;
      ALTER TABLE users DROP COLUMN IF EXISTS sport_focus;
      ALTER TABLE users DROP COLUMN IF EXISTS reports_to_user_id;

      ALTER TABLE organizations DROP COLUMN IF EXISTS region;
      ALTER TABLE organizations DROP COLUMN IF EXISTS state_market;
      ALTER TABLE organizations DROP COLUMN IF EXISTS division;
      ALTER TABLE organizations DROP COLUMN IF EXISTS territory;
      ALTER TABLE organizations DROP COLUMN IF EXISTS subterritory;
      ALTER TABLE organizations DROP COLUMN IF EXISTS sport_focus;
      ALTER TABLE organizations DROP COLUMN IF EXISTS assigned_director_name;
      ALTER TABLE organizations DROP COLUMN IF EXISTS assigned_director_email;
      ALTER TABLE organizations DROP COLUMN IF EXISTS assigned_rep_name;
      ALTER TABLE organizations DROP COLUMN IF EXISTS assigned_rep_email;
      ALTER TABLE organizations DROP COLUMN IF EXISTS assignment_pool;
      ALTER TABLE organizations DROP COLUMN IF EXISTS assignment_batch;
      ALTER TABLE organizations DROP COLUMN IF EXISTS assignment_rationale;
    END $$;
  `);
};
