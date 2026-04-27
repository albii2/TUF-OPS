exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.dropIndex('opportunities', ['organization_id', 'channel_type'], {
    name: 'opportunities_org_channel_unique',
    ifExists: true,
  });

  pgm.dropConstraint('opportunities', 'opportunities_organization_id_channel_type_key', {
    ifExists: true,
  });

  pgm.sql(`
    ALTER TABLE opportunities
    ADD COLUMN IF NOT EXISTS sport varchar(100),
    ADD COLUMN IF NOT EXISTS season varchar(50),
    ADD COLUMN IF NOT EXISTS year integer;
  `);

  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'opportunities_org_program_channel_unique'
      ) THEN
        ALTER TABLE opportunities
        ADD CONSTRAINT opportunities_org_program_channel_unique
        UNIQUE (organization_id, sport, season, year, channel_type);
      END IF;
    END
    $$;
  `);
};

exports.down = (pgm) => {
  pgm.dropConstraint('opportunities', 'opportunities_org_program_channel_unique', {
    ifExists: true,
  });

  pgm.dropColumns('opportunities', ['sport', 'season', 'year'], {
    ifExists: true,
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
