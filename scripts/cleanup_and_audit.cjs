const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  
  // Delete all test orgs and their opps
  const delOpps = await c.query("DELETE FROM opportunities WHERE name LIKE 'HT-%' OR name LIKE 'VERIFY-%' OR name LIKE 'SMOKE-%' OR name LIKE 'REGRESSION-%' OR name LIKE 'STAGE-TEST%' OR name LIKE 'Lifecycle%'");
  console.log(`Deleted ${delOpps.rowCount} test opportunities`);
  
  const delOrgs = await c.query("DELETE FROM organizations WHERE name LIKE 'HT-%' OR name LIKE 'VERIFY-%' OR name LIKE 'SMOKE-%' OR name LIKE 'REGRESSION-%' OR name LIKE 'DIRECT-CHECK%'");
  console.log(`Deleted ${delOrgs.rowCount} test organizations`);
  
  // Show remaining real data
  const orgs = await c.query("SELECT id, name, assigned_rep_name, assigned_rep_id, coverage_status, updated_at != created_at as was_updated FROM organizations ORDER BY id LIMIT 10");
  console.log('\nReal organizations:');
  orgs.rows.forEach(o => console.log(`  #${o.id}: ${o.name} | rep=${o.assigned_rep_name}(${o.assigned_rep_id}) | updated=${o.was_updated}`));
  
  const opps = await c.query("SELECT id, name, organization_id, stage, assigned_rep_name FROM opportunities ORDER BY id");
  console.log('\nReal opportunities:');
  opps.rows.forEach(o => console.log(`  #${o.id}: ${o.name} | org=${o.organization_id} | stage=${o.stage} | rep=${o.assigned_rep_name}`));
  
  // Check what coverageStatus values exist
  const coverage = await c.query("SELECT coverage_status, COUNT(*) FROM organizations GROUP BY coverage_status ORDER BY coverage_status");
  console.log('\nCoverage status distribution:');
  coverage.rows.forEach(r => console.log(`  ${r.coverage_status || 'NULL'}: ${r.count}`));
  
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
