const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  
  // Check orgs assigned to William (rep_id=58)
  const orgs = await c.query("SELECT id, name, state, assigned_rep_id, assigned_rep_name, assigned_director_id, assigned_director_name FROM organizations WHERE assigned_rep_id = 58 LIMIT 5");
  console.log('Orgs with assigned_rep_id=58:', JSON.stringify(orgs.rows));
  
  // Check if assigned_rep_name matches William's name
  const names = await c.query("SELECT DISTINCT assigned_rep_name, COUNT(*) FROM organizations WHERE assigned_rep_id = 58 GROUP BY assigned_rep_name");
  console.log('\nDistinct rep names for William:', JSON.stringify(names.rows));
  
  // Check how many orgs have his name in assigned_rep_name
  const named = await c.query("SELECT COUNT(*) FROM organizations WHERE assigned_rep_name = 'William Denzer'");
  console.log('\nOrgs with assigned_rep_name = William Denzer:', named.rows[0].count);
  
  // Check total orgs visible to director (state filter)
  const total = await c.query("SELECT COUNT(*) FROM organizations WHERE state IN ('WI','MN')");
  console.log('Total orgs in WI,MN:', total.rows[0].count);
  
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
