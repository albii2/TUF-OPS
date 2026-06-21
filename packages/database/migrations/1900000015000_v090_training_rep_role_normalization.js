exports.up = async (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF to_regclass('public.training_modules') IS NOT NULL THEN
        ALTER TABLE training_modules DROP CONSTRAINT IF EXISTS training_modules_role_check;
        UPDATE training_modules
        SET role = 'REP', updated_at = current_timestamp
        WHERE role = 'TAE';
        ALTER TABLE training_modules
          ADD CONSTRAINT training_modules_role_check CHECK (role IN ('REP', 'TAE', 'DIRECTOR', 'ADMIN'));
      END IF;

      IF to_regclass('public.training_enrollments') IS NOT NULL THEN
        ALTER TABLE training_enrollments DROP CONSTRAINT IF EXISTS training_enrollments_role_check;
        UPDATE training_enrollments
        SET role = 'REP', updated_at = current_timestamp
        WHERE role = 'TAE';
        ALTER TABLE training_enrollments
          ADD CONSTRAINT training_enrollments_role_check CHECK (role IN ('REP', 'TAE', 'DIRECTOR', 'ADMIN'));
      END IF;
    END $$;
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF to_regclass('public.training_modules') IS NOT NULL THEN
        ALTER TABLE training_modules DROP CONSTRAINT IF EXISTS training_modules_role_check;
        ALTER TABLE training_modules
          ADD CONSTRAINT training_modules_role_check CHECK (role IN ('REP', 'TAE', 'DIRECTOR', 'ADMIN'));
      END IF;

      IF to_regclass('public.training_enrollments') IS NOT NULL THEN
        ALTER TABLE training_enrollments DROP CONSTRAINT IF EXISTS training_enrollments_role_check;
        ALTER TABLE training_enrollments
          ADD CONSTRAINT training_enrollments_role_check CHECK (role IN ('REP', 'TAE', 'DIRECTOR', 'ADMIN'));
      END IF;
    END $$;
  `);
};
