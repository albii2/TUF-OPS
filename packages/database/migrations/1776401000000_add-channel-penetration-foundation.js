exports.up = (pgm) => {
  pgm.addColumns('opportunities', {
    channel_type: { type: 'varchar(50)' },
  });

  pgm.sql(`
    ALTER TABLE opportunities
    ADD CONSTRAINT opportunities_channel_type_allowed
    CHECK (channel_type IS NULL OR channel_type IN ('UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN'))
  `);

  pgm.alterColumn('opportunities', 'stage', {
    type: 'varchar(50)',
    notNull: true,
    default: 'NOT_STARTED',
  });

  pgm.sql(`
    WITH ranked AS (
      SELECT
        id,
        organization_id,
        CASE
          WHEN deal_type IN ('UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN') THEN deal_type
          ELSE NULL
        END AS inferred_channel,
        ROW_NUMBER() OVER (
          PARTITION BY organization_id,
          CASE
            WHEN deal_type IN ('UNIFORM', 'TRAVEL_GEAR', 'TEAM_STORE', 'LETTERMAN') THEN deal_type
            ELSE NULL
          END
          ORDER BY created_at, id
        ) AS channel_rank
      FROM opportunities
    )
    UPDATE opportunities o
    SET channel_type = r.inferred_channel
    FROM ranked r
    WHERE o.id = r.id
      AND r.inferred_channel IS NOT NULL
      AND r.channel_rank = 1
  `);

  pgm.sql(`
    INSERT INTO opportunities (
      name,
      organization_id,
      status,
      value,
      created_by,
      updated_by,
      stage,
      last_activity_date,
      assigned_rep_id,
      assigned_director_id,
      deal_type,
      channel_type
    )
    SELECT
      CONCAT(org.name, ' - ', channels.channel_type),
      org.id,
      'open',
      0.00,
      org.created_by,
      org.updated_by,
      'NOT_STARTED',
      current_timestamp,
      org.assigned_rep_id,
      org.assigned_director_id,
      channels.channel_type,
      channels.channel_type
    FROM organizations org
    CROSS JOIN (
      VALUES ('UNIFORM'), ('TRAVEL_GEAR'), ('TEAM_STORE'), ('LETTERMAN')
    ) AS channels(channel_type)
    WHERE NOT EXISTS (
      SELECT 1
      FROM opportunities o
      WHERE o.organization_id = org.id
        AND o.channel_type = channels.channel_type
    )
  `);

  pgm.sql(`
    CREATE UNIQUE INDEX opportunities_org_channel_unique
    ON opportunities (organization_id, channel_type)
    WHERE channel_type IS NOT NULL
  `);
};

exports.down = (pgm) => {
  pgm.dropIndex('opportunities', ['organization_id', 'channel_type'], {
    name: 'opportunities_org_channel_unique',
  });

  pgm.dropConstraint('opportunities', 'opportunities_channel_type_allowed');

  pgm.dropColumns('opportunities', ['channel_type']);

  pgm.alterColumn('opportunities', 'stage', {
    type: 'varchar(50)',
    notNull: true,
    default: 'LEAD_ASSIGNED',
  });
};
