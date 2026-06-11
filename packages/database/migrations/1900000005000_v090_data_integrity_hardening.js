exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('organizations', {
    state: { type: 'varchar(64)', notNull: true, default: '' },
  }, { ifNotExists: true });

  pgm.sql(`
    WITH ranked AS (
      SELECT id,
             row_number() OVER (PARTITION BY lower(btrim(name)), upper(btrim(coalesce(state, ''))) ORDER BY id) AS rn
      FROM organizations
    )
    UPDATE organizations o
    SET state = concat(o.state, '-DUP-', o.id)
    FROM ranked r
    WHERE o.id = r.id AND r.rn > 1;
  `);

  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS organizations_name_state_unique
    ON organizations (lower(btrim(name)), upper(btrim(state)));
  `);

  pgm.createTable('contacts', {
    id: 'id',
    organization_id: { type: 'integer', notNull: true, references: 'organizations(id)', onDelete: 'cascade' },
    name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)' },
    phone: { type: 'varchar(64)' },
    role: { type: 'varchar(128)' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  }, { ifNotExists: true });
  pgm.createIndex('contacts', ['organization_id'], { name: 'contacts_organization_id_idx', ifNotExists: true });

  pgm.createTable('activity_audit_history', {
    id: 'id',
    activity_id: { type: 'integer', notNull: true, references: 'activities(id)', onDelete: 'cascade' },
    organization_id: { type: 'integer', notNull: true, references: 'organizations(id)', onDelete: 'cascade' },
    opportunity_id: { type: 'integer', references: 'opportunities(id)', onDelete: 'cascade' },
    action: { type: 'varchar(64)', notNull: true },
    created_by: { type: 'integer', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
  }, { ifNotExists: true });
  pgm.createIndex('activity_audit_history', ['activity_id'], { name: 'activity_audit_history_activity_idx', ifNotExists: true });
  pgm.createIndex('activity_audit_history', ['opportunity_id'], { name: 'activity_audit_history_opportunity_idx', ifNotExists: true });

  pgm.sql(`
    ALTER TABLE activities
      ALTER COLUMN organization_id SET NOT NULL;

    ALTER TABLE commissions
      ALTER COLUMN rep_user_id SET NOT NULL;

    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'commissions_non_negative_amounts_check') THEN
        ALTER TABLE commissions
          ADD CONSTRAINT commissions_non_negative_amounts_check
          CHECK (gross_profit >= 0 AND rep_rate >= 0 AND director_rate >= 0 AND rep_commission >= 0 AND director_override >= 0);
      END IF;
    END
    $$;

    CREATE OR REPLACE FUNCTION enforce_order_closed_won_opportunity()
    RETURNS trigger AS $$
    DECLARE
      opp_stage text;
      opp_org_id integer;
    BEGIN
      SELECT stage, organization_id INTO opp_stage, opp_org_id
      FROM opportunities
      WHERE id = NEW.opportunity_id;

      IF opp_stage IS NULL THEN
        RAISE EXCEPTION 'Order opportunity % does not exist', NEW.opportunity_id USING ERRCODE = '23503';
      END IF;

      IF opp_stage <> 'CLOSED_WON' THEN
        RAISE EXCEPTION 'Only CLOSED_WON opportunities can be converted to orders' USING ERRCODE = '23514';
      END IF;

      IF NEW.organization_id IS DISTINCT FROM opp_org_id THEN
        RAISE EXCEPTION 'Order organization must match opportunity organization' USING ERRCODE = '23514';
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS orders_closed_won_opportunity_trigger ON orders;
    CREATE TRIGGER orders_closed_won_opportunity_trigger
      BEFORE INSERT OR UPDATE OF opportunity_id, organization_id ON orders
      FOR EACH ROW EXECUTE FUNCTION enforce_order_closed_won_opportunity();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TRIGGER IF EXISTS orders_closed_won_opportunity_trigger ON orders;
    DROP FUNCTION IF EXISTS enforce_order_closed_won_opportunity();
    ALTER TABLE commissions DROP CONSTRAINT IF EXISTS commissions_non_negative_amounts_check;
  `);
  pgm.dropTable('activity_audit_history', { ifExists: true });
  pgm.dropTable('contacts', { ifExists: true });
  pgm.sql('DROP INDEX IF EXISTS organizations_name_state_unique');
  pgm.dropColumn('organizations', 'state', { ifExists: true });
};
