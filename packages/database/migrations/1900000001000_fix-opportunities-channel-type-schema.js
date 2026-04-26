exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type') THEN
        CREATE TYPE channel_type AS ENUM ('UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN');
      END IF;
    END
    $$;
  `);

  pgm.sql(`
    ALTER TABLE opportunities
    ADD COLUMN IF NOT EXISTS channel_type channel_type;
  `);

  pgm.sql(`
    UPDATE opportunities
    SET channel_type = 'UNIFORM'::channel_type
    WHERE channel_type IS NULL;
  `);

  pgm.alterColumn('opportunities', 'channel_type', {
    notNull: true,
    default: 'UNIFORM',
  });

  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'opportunities_organization_id_channel_type_key'
      ) THEN
        ALTER TABLE opportunities
        ADD CONSTRAINT opportunities_organization_id_channel_type_key
        UNIQUE (organization_id, channel_type);
      END IF;
    END
    $$;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE opportunities
    ALTER COLUMN channel_type DROP DEFAULT;
  `);

  pgm.alterColumn('opportunities', 'channel_type', {
    notNull: false,
  });

  pgm.dropConstraint('opportunities', 'opportunities_organization_id_channel_type_key', {
    ifExists: true,
  });

  pgm.dropColumn('opportunities', 'channel_type', {
    ifExists: true,
  });

  pgm.sql(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type') THEN
        DROP TYPE channel_type;
      END IF;
    END
    $$;
  `);
};
