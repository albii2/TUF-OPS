exports.up = async (pgm) => {
  // Ensure column exists (but do NOT try to recreate it)
  pgm.sql(`
    ALTER TABLE opportunities
    ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50);
  `);

  // Backfill nulls
  pgm.sql(`
    UPDATE opportunities
    SET channel_type = 'UNIFORM'
    WHERE channel_type IS NULL;
  `);

  // Enforce NOT NULL + default
  pgm.sql(`
    ALTER TABLE opportunities
    ALTER COLUMN channel_type SET DEFAULT 'UNIFORM',
    ALTER COLUMN channel_type SET NOT NULL;
  `);

  // Allowed values constraint (safe)
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'opportunities_channel_type_allowed'
      ) THEN
        ALTER TABLE opportunities
        ADD CONSTRAINT opportunities_channel_type_allowed
        CHECK (channel_type IN ('UNIFORM','TRAVEL_GEAR','TEAM_STORE','LETTERMAN'));
      END IF;
    END
    $$;
  `);

  // Unique constraint (safe)
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'opportunities_org_channel_unique'
      ) THEN
        CREATE UNIQUE INDEX opportunities_org_channel_unique
        ON opportunities (organization_id, channel_type);
      END IF;
    END
    $$;
  `);
};

exports.down = async () => {
  // No destructive rollback for safety
};