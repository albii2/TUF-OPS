exports.up = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF to_regclass('public.users') IS NULL THEN
        RETURN;
      END IF;

      -- Preserve existing role values for TUF-001. The compatibility layer maps
      -- ADMIN/DIRECTOR/REP/sales_rep to canonical application roles at runtime.
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar(50) NOT NULL DEFAULT 'REP';

      -- Replace the legacy role check with a compatibility check before any
      -- future normalization work. This keeps bootstrap ADMIN seeding and
      -- current sales_rep registrations valid while the runtime layer normalizes.
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check
        CHECK (role IN ('OWNER', 'ADMIN', 'REGIONAL_DIRECTOR', 'DIRECTOR', 'REP', 'sales_rep', 'OPS', 'OPERATIONS'));

      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    END $$;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_users_role;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'REGIONAL_DIRECTOR', 'DIRECTOR', 'REP'));
  `);
};
