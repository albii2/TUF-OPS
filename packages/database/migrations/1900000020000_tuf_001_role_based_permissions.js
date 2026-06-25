exports.up = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF to_regclass('public.users') IS NULL THEN
        RETURN;
      END IF;

      ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar(20) NOT NULL DEFAULT 'tae';

      UPDATE users
      SET role = CASE
        WHEN role IN ('ADMIN', 'DIRECTOR', 'director') THEN 'director'
        WHEN role IN ('REGIONAL_DIRECTOR', 'OPS', 'OPERATIONS', 'operations') THEN 'operations'
        ELSE 'tae'
      END;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_role_rbac_check'
      ) THEN
        ALTER TABLE users ADD CONSTRAINT users_role_rbac_check CHECK (role IN ('tae', 'director', 'operations'));
      END IF;

      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    END $$;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_users_role;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_rbac_check;
  `);
};
