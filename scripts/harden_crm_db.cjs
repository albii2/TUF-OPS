// Harden CRM at database level — ensure assigned_rep_name is ALWAYS correct.
// This makes it impossible for org/opp creation to show wrong rep names,
// regardless of whether the application code fix is deployed.
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // 1. Fix all existing NULL assigned_rep_name values
  const fixNulls = await c.query(`
    UPDATE organizations 
    SET assigned_rep_name = u.name,
        assigned_rep_email = u.email
    FROM users u 
    WHERE organizations.assigned_rep_id = u.id 
    AND (organizations.assigned_rep_name IS NULL OR organizations.assigned_rep_name != u.name)
  `);
  console.log(`Fixed assigned_rep_name for ${fixNulls.rowCount} orgs`);

  // 2. Fix assigned_director_name
  const fixDirNulls = await c.query(`
    UPDATE organizations 
    SET assigned_director_name = u.name,
        assigned_director_email = u.email
    FROM users u 
    WHERE organizations.assigned_director_id = u.id 
    AND (organizations.assigned_director_name IS NULL OR organizations.assigned_director_name != u.name)
  `);
  console.log(`Fixed assigned_director_name for ${fixDirNulls.rowCount} orgs`);

  // 3. Create trigger — auto-populate assigned_rep_name on INSERT or UPDATE
  await c.query(`
    CREATE OR REPLACE FUNCTION sync_org_rep_name()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.assigned_rep_id IS NOT NULL THEN
        SELECT name, email INTO NEW.assigned_rep_name, NEW.assigned_rep_email
        FROM users WHERE id = NEW.assigned_rep_id;
      END IF;
      IF NEW.assigned_director_id IS NOT NULL THEN
        SELECT name, email INTO NEW.assigned_director_name, NEW.assigned_director_email
        FROM users WHERE id = NEW.assigned_director_id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  console.log('Created sync_org_rep_name() trigger function');

  // Drop old trigger if exists, then create
  await c.query('DROP TRIGGER IF EXISTS trg_sync_org_rep_name ON organizations');
  await c.query(`
    CREATE TRIGGER trg_sync_org_rep_name
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION sync_org_rep_name()
  `);
  console.log('Created BEFORE INSERT/UPDATE trigger on organizations');

  // 4. Verify — try to insert an org WITHOUT assigned_rep_name and see if trigger populates it
  await c.query('BEGIN');
  const testInsert = await c.query(`
    INSERT INTO organizations (name, state, assigned_rep_id, assigned_director_id, created_by, updated_by)
    VALUES ('TRIGGER_TEST', 'MN', 59, 55, 54, 54)
    RETURNING id, assigned_rep_name, assigned_director_name
  `);
  console.log('\nTrigger test:');
  console.log('  Inserted without names → got:', JSON.stringify(testInsert.rows[0]));
  
  // Cleanup
  await c.query('DELETE FROM organizations WHERE name = $1', ['TRIGGER_TEST']);
  await c.query('COMMIT');

  // 5. Final verification
  const stillNull = await c.query("SELECT COUNT(*) FROM organizations WHERE assigned_rep_id IS NOT NULL AND assigned_rep_name IS NULL");
  console.log(`\nOrgs with rep_id set but name NULL: ${stillNull.rows[0].count}`);

  await c.end();
  console.log('\nDone — CRM org creation is now database-hardened');
})().catch(e => { console.error(e.message); process.exit(1); });
