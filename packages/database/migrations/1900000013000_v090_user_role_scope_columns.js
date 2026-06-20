exports.up = async (pgm) => {
  pgm.sql(`
    DO $$
    DECLARE
      primeau_id integer;
    BEGIN
      IF to_regclass('public.users') IS NULL THEN
        RETURN;
      END IF;

      ALTER TABLE users ADD COLUMN IF NOT EXISTS rank varchar(80);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS tier varchar(80);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS region varchar(120);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS state_market varchar(80);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS division varchar(120);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS territory varchar(160);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subterritory varchar(160);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS sport_focus varchar(120);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reports_to_user_id integer;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_reports_to_user_id_fkey'
      ) THEN
        ALTER TABLE users
          ADD CONSTRAINT users_reports_to_user_id_fkey
          FOREIGN KEY (reports_to_user_id) REFERENCES users(id) ON DELETE SET NULL;
      END IF;

      SELECT id INTO primeau_id
      FROM users
      WHERE lower(email) = 'primeau.hill@tufsports.us' OR lower(name) = 'primeau hill'
      ORDER BY id
      LIMIT 1;

      UPDATE users
      SET role = 'ADMIN',
          rank = 'Admin',
          region = 'National',
          territory = 'National',
          division = 'All',
          subterritory = 'All',
          sport_focus = 'All',
          updated_at = COALESCE(updated_at, current_timestamp)
      WHERE lower(email) IN ('abradshaw@tufsports.us', 'owner@tuf.local', 'coach@tuf.local')
         OR lower(name) IN ('a bradshaw vp', 'bradshaw vp')
         OR lower(name) LIKE '%bradshaw%';

      UPDATE users
      SET role = 'DIRECTOR',
          rank = 'Director',
          region = 'Midwest',
          state_market = 'MN',
          division = 'General',
          territory = 'Minnesota',
          subterritory = 'Metro + North',
          sport_focus = 'All',
          reports_to_user_id = NULL,
          updated_at = COALESCE(updated_at, current_timestamp)
      WHERE lower(email) = 'primeau.hill@tufsports.us'
         OR lower(name) = 'primeau hill';

      UPDATE users
      SET role = 'REP',
          rank = 'Senior TAE',
          tier = 'Senior TAE',
          region = 'Midwest',
          state_market = 'MN',
          division = 'General',
          territory = 'Minnesota',
          subterritory = 'South / Southwest Metro',
          sport_focus = 'All',
          reports_to_user_id = primeau_id,
          assigned_director_id = COALESCE(assigned_director_id, primeau_id),
          updated_at = COALESCE(updated_at, current_timestamp)
      WHERE lower(email) = 'jvmulder@gmail.com'
         OR lower(name) = 'jason mulder';

      UPDATE users
      SET role = 'REP',
          rank = 'Senior TAE',
          tier = 'Senior TAE',
          region = 'Midwest',
          state_market = 'MN',
          division = 'General',
          territory = 'Minnesota',
          subterritory = 'North / Outstate / Remote',
          sport_focus = 'All',
          reports_to_user_id = primeau_id,
          assigned_director_id = COALESCE(assigned_director_id, primeau_id),
          updated_at = COALESCE(updated_at, current_timestamp)
      WHERE lower(email) = 'lundbergdave18@gmail.com'
         OR lower(name) = 'david lundberg';

      UPDATE users
      SET role = 'REP',
          rank = 'TAE',
          tier = 'TAE',
          region = 'Midwest',
          state_market = 'MN',
          division = 'General',
          territory = 'Minnesota',
          subterritory = 'West Metro / Minneapolis Inner Ring',
          sport_focus = 'All',
          reports_to_user_id = primeau_id,
          assigned_director_id = COALESCE(assigned_director_id, primeau_id),
          updated_at = COALESCE(updated_at, current_timestamp)
      WHERE lower(email) = 'jhoffman@kipsu.com'
         OR lower(name) = 'josh hoffman';

      UPDATE users
      SET role = 'REP',
          rank = 'TAE',
          tier = 'TAE',
          region = 'Midwest',
          state_market = 'MN',
          division = 'General',
          territory = 'Minnesota',
          subterritory = 'Northwest / North Metro',
          sport_focus = 'All',
          reports_to_user_id = primeau_id,
          assigned_director_id = COALESCE(assigned_director_id, primeau_id),
          updated_at = COALESCE(updated_at, current_timestamp)
      WHERE lower(email) = 'shaylahilliard17@gmail.com'
         OR lower(name) = 'shayla hilliard';
      CREATE INDEX IF NOT EXISTS users_reports_to_user_id_idx ON users (reports_to_user_id);
      CREATE INDEX IF NOT EXISTS users_role_scope_idx ON users (role, region, state_market, territory);
    END $$;
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS users_role_scope_idx;
    DROP INDEX IF EXISTS users_reports_to_user_id_idx;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_reports_to_user_id_fkey;
  `);
};
