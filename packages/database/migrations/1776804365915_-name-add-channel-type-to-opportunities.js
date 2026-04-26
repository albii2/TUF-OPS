exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE opportunities
    ALTER COLUMN channel_type TYPE varchar(50) USING channel_type::varchar(50);
  `);

  pgm.sql(`
    UPDATE opportunities
    SET channel_type = 'UNIFORM'
    WHERE channel_type IS NULL;
  `);

  pgm.alterColumn('opportunities', 'channel_type', {
    type: 'varchar(50)',
    notNull: true,
    default: 'UNIFORM',
  });

  pgm.sql(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'opportunities_channel_type_allowed'
      ) THEN
        ALTER TABLE opportunities
        ADD CONSTRAINT opportunities_channel_type_allowed
        CHECK (channel_type IN ('UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN'));
      END IF;
    END
    $$;
  `);

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
  pgm.dropConstraint('opportunities', 'opportunities_organization_id_channel_type_key', {
    ifExists: true,
  });

  pgm.dropConstraint('opportunities', 'opportunities_channel_type_allowed', {
    ifExists: true,
  });

  pgm.sql(`
    ALTER TABLE opportunities
    ALTER COLUMN channel_type DROP DEFAULT;
  `);

  pgm.alterColumn('opportunities', 'channel_type', {
    type: 'varchar(50)',
    notNull: false,
  });
};
