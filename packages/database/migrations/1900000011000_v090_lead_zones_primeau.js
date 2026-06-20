exports.up = async (pgm) => {
  pgm.sql(`
    DO $$
    DECLARE
      primeau_id integer;
    BEGIN
      IF to_regclass('public.organizations') IS NOT NULL THEN
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city varchar(128);
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address_line1 text;
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS postal_code varchar(32);
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tuf_zone varchar(32);
        CREATE INDEX IF NOT EXISTS organizations_tuf_zone_idx ON organizations (tuf_zone);
        CREATE INDEX IF NOT EXISTS organizations_assigned_director_id_idx ON organizations (assigned_director_id);

        SELECT id INTO primeau_id
        FROM users
        WHERE lower(email) = 'primeau.hill@tufsports.us'
           OR lower(name) = 'primeau hill'
        ORDER BY id
        LIMIT 1;

        IF primeau_id IS NOT NULL THEN
          UPDATE organizations
          SET assigned_director_id = primeau_id,
              updated_at = CASE WHEN EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'updated_at'
              ) THEN NOW() ELSE updated_at END
          WHERE lower(coalesce(tuf_zone, '')) IN ('tuf metro', 'metro', 'tuf north', 'north');
        END IF;
      END IF;
    END $$;
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS organizations_assigned_director_id_idx;
    DROP INDEX IF EXISTS organizations_tuf_zone_idx;
  `);
};
