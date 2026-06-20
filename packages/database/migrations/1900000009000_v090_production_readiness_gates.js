exports.shorthands = undefined;

const PHASES = [
  'LEVEL_1_OPERATOR',
  'LEVEL_2_PRODUCT',
  'LEVEL_3_TERRITORY',
  'LEVEL_4_SALES',
  'LEVEL_5_EXPANSION',
  'SPECIALIZED_TRACKS',
  'LEVEL_7_DIRECTOR',
  'MARKET_MASTERY',
];

exports.up = (pgm) => {
  const phaseList = PHASES.map((phase) => `'${phase}'`).join(', ');

  pgm.sql(`
    DO $$
    BEGIN
      IF to_regclass('public.training_modules') IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'training_modules' AND column_name = 'phase'
      ) THEN
        ALTER TABLE training_modules DROP CONSTRAINT IF EXISTS training_modules_phase_check;
        UPDATE training_modules SET phase = CASE phase
          WHEN 'DAY_1' THEN 'LEVEL_1_OPERATOR'
          WHEN 'DAY_1_2' THEN 'LEVEL_2_PRODUCT'
          WHEN 'WEEK_1_2' THEN 'LEVEL_4_SALES'
          WHEN 'MONTH_1' THEN 'LEVEL_5_EXPANSION'
          ELSE phase
        END;
        ALTER TABLE training_modules ADD CONSTRAINT training_modules_phase_check CHECK (phase IN (${phaseList}));
      END IF;

      IF to_regclass('public.training_enrollments') IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'training_enrollments' AND column_name = 'current_phase'
      ) THEN
        ALTER TABLE training_enrollments DROP CONSTRAINT IF EXISTS training_enrollments_current_phase_check;
        UPDATE training_enrollments SET current_phase = CASE current_phase
          WHEN 'DAY_1' THEN 'LEVEL_1_OPERATOR'
          WHEN 'DAY_1_2' THEN 'LEVEL_2_PRODUCT'
          WHEN 'WEEK_1_2' THEN 'LEVEL_4_SALES'
          WHEN 'MONTH_1' THEN 'LEVEL_5_EXPANSION'
          ELSE current_phase
        END;
        ALTER TABLE training_enrollments ADD CONSTRAINT training_enrollments_current_phase_check CHECK (current_phase IN (${phaseList}));
      END IF;

      IF to_regclass('public.users') IS NOT NULL THEN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS practical_exercise_completed boolean NOT NULL DEFAULT false;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS certification_source varchar(32) NOT NULL DEFAULT 'DATABASE';
      END IF;

      IF to_regclass('public.activities') IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'organization_id'
      ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'activities' AND column_name = 'type'
      ) THEN
        CREATE INDEX IF NOT EXISTS activities_auditable_touch_idx ON activities (organization_id, type);
      END IF;

      IF to_regclass('public.orders') IS NOT NULL THEN
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_rep_id integer;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_director_id integer;

        CREATE INDEX IF NOT EXISTS orders_assigned_rep_id_idx ON orders (assigned_rep_id);
        CREATE INDEX IF NOT EXISTS orders_assigned_director_id_idx ON orders (assigned_director_id);

        IF to_regclass('public.opportunities') IS NOT NULL
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'opportunity_id')
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'assigned_rep_id')
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'assigned_director_id') THEN
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'updated_at') THEN
            UPDATE orders ord
            SET assigned_rep_id = COALESCE(ord.assigned_rep_id, opp.assigned_rep_id),
                assigned_director_id = COALESCE(ord.assigned_director_id, opp.assigned_director_id),
                updated_at = NOW()
            FROM opportunities opp
            WHERE opp.id = ord.opportunity_id;
          ELSE
            UPDATE orders ord
            SET assigned_rep_id = COALESCE(ord.assigned_rep_id, opp.assigned_rep_id),
                assigned_director_id = COALESCE(ord.assigned_director_id, opp.assigned_director_id)
            FROM opportunities opp
            WHERE opp.id = ord.opportunity_id;
          END IF;
        END IF;
      END IF;
    END
    $$;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS orders_assigned_director_id_idx;
    DROP INDEX IF EXISTS orders_assigned_rep_id_idx;
    DROP INDEX IF EXISTS activities_auditable_touch_idx;

    DO $$
    BEGIN
      IF to_regclass('public.users') IS NOT NULL THEN
        ALTER TABLE users DROP COLUMN IF EXISTS certification_source;
        ALTER TABLE users DROP COLUMN IF EXISTS practical_exercise_completed;
      END IF;
    END
    $$;
  `);
};
