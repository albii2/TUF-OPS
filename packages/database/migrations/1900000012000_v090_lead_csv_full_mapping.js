exports.up = async (pgm) => {
  pgm.sql(`
    DO $$
    BEGIN
      IF to_regclass('public.organizations') IS NOT NULL THEN
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS school_url text;
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS school_colors text;
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS full_address text;
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address_line1 text;
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city varchar(128);
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS postal_code varchar(32);
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS school_phone varchar(64);
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS enrollment integer;
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS isd_number varchar(64);
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website_link text;
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tuf_zone varchar(32);
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tuf_priority varchar(32);
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS lead_source varchar(64) DEFAULT 'tuf_leads_final_enriched.csv';
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS lead_metadata jsonb DEFAULT '{}'::jsonb;
        CREATE INDEX IF NOT EXISTS organizations_tuf_zone_idx ON organizations (tuf_zone);
        CREATE INDEX IF NOT EXISTS organizations_tuf_priority_idx ON organizations (tuf_priority);
        CREATE TABLE IF NOT EXISTS organization_sports (
          id serial PRIMARY KEY,
          organization_id integer NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          sport varchar(64) NOT NULL,
          offered boolean NOT NULL DEFAULT false,
          url text,
          source varchar(64) NOT NULL DEFAULT 'tuf_leads_final_enriched.csv',
          created_at timestamp NOT NULL DEFAULT current_timestamp,
          updated_at timestamp NOT NULL DEFAULT current_timestamp,
          UNIQUE (organization_id, sport)
        );

        CREATE INDEX IF NOT EXISTS organization_sports_organization_id_idx ON organization_sports (organization_id);
        CREATE INDEX IF NOT EXISTS organization_sports_sport_idx ON organization_sports (sport);
      END IF;
    END $$;
  `);
};

exports.down = async (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS organization_sports_sport_idx;
    DROP INDEX IF EXISTS organization_sports_organization_id_idx;
    DROP TABLE IF EXISTS organization_sports;
    DROP INDEX IF EXISTS organizations_tuf_priority_idx;
    DROP INDEX IF EXISTS organizations_tuf_zone_idx;
  `);
};
