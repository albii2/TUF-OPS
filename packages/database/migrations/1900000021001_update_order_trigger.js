exports.up = (pgm) => {
  pgm.sql(`
    -- TUF-004: Update order trigger to accept canonical lowercase stage value
    DROP TRIGGER IF EXISTS orders_closed_won_opportunity_trigger ON orders;

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

      -- Accept both legacy uppercase and canonical lowercase closed_won
      IF opp_stage NOT IN ('CLOSED_WON', 'closed_won') THEN
        RAISE EXCEPTION 'Only CLOSED_WON opportunities can be converted to orders' USING ERRCODE = '23514';
      END IF;

      IF NEW.organization_id IS DISTINCT FROM opp_org_id THEN
        RAISE EXCEPTION 'Order organization must match opportunity organization' USING ERRCODE = '23514';
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER orders_closed_won_opportunity_trigger
      BEFORE INSERT OR UPDATE OF opportunity_id, organization_id ON orders
      FOR EACH ROW EXECUTE FUNCTION enforce_order_closed_won_opportunity();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TRIGGER IF EXISTS orders_closed_won_opportunity_trigger ON orders;

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

    CREATE TRIGGER orders_closed_won_opportunity_trigger
      BEFORE INSERT OR UPDATE OF opportunity_id, organization_id ON orders
      FOR EACH ROW EXECUTE FUNCTION enforce_order_closed_won_opportunity();
  `);
};
