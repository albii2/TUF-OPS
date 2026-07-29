const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  
  // Josh Hoffman (id=56)
  const josh = await c.query("SELECT id, name, role FROM users WHERE id=56");
  console.log('Josh:', JSON.stringify(josh.rows[0]));
  
  // What opps does the API return for Josh?
  // Check the assigned_rep_id on all opps
  const opps = await c.query("SELECT id, name, assigned_rep_id, stage FROM opportunities ORDER BY id");
  console.log('\nAll opportunities:');
  opps.rows.forEach(o => console.log('  #'+o.id+': '+o.name+' | rep_id='+o.assigned_rep_id+' | stage='+o.stage));
  
  // What does the organizations controller return for REP filtering?
  // Check orgs assigned to Josh
  const joshOrgs = await c.query("SELECT id, name, assigned_rep_id, assigned_rep_name FROM organizations WHERE assigned_rep_id=56 LIMIT 5");
  console.log('\nJosh orgs:', joshOrgs.rowCount);
  
  // Check Josh's orgs from the opps perspective
  const joshOpps = await c.query("SELECT COUNT(*) FROM opportunities WHERE assigned_rep_id=56");
  console.log('Josh opp count:', joshOpps.rows[0].count);
  
  // What does Josh see when he queries opportunities via API?
  // Let's check the controller logic - does it filter by assigned_rep_id for REPs?
  
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
