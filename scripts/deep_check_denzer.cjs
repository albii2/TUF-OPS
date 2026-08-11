const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Full user data
  const u = await c.query("SELECT * FROM users WHERE id = 58");
  const user = u.rows[0];
  console.log('USER:', JSON.stringify({id: user.id, name: user.name, email: user.email, role: user.role, state_market: user.state_market, territory: user.territory, status: user.status, credential_version: user.credential_version}, null, 2));

  // Check organizations table columns
  const cols = await c.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organizations' ORDER BY ordinal_position");
  console.log('\nOrganizations columns:', cols.rows.map(r => r.column_name).join(', '));

  // Org count by state and assigned_rep_id
  const counts = await c.query("SELECT state, assigned_rep_id IS NOT NULL as has_rep, COUNT(*) FROM organizations GROUP BY state, assigned_rep_id IS NOT NULL ORDER BY count DESC");
  console.log('\nOrg distribution:', JSON.stringify(counts.rows));
  
  // Sample orgs - check if assigned_rep_name exists
  const sample = await c.query("SELECT * FROM organizations WHERE state='MN' LIMIT 2");
  console.log('\nSample MN org:', JSON.stringify(sample.rows[0]));
  
  // Check if there's a territory_id column in organizations
  const orgWithTerritory = await c.query("SELECT id, name, state, territory_id, assigned_rep_id, assigned_director_id FROM organizations WHERE territory_id IS NOT NULL LIMIT 5");
  console.log('\nOrgs with territory_id:', JSON.stringify(orgWithTerritory.rows));

  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
