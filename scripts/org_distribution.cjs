const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Current org distribution by rep
  const dist = await c.query(`
    SELECT u.name, u.role, COUNT(o.id) as org_count 
    FROM users u 
    LEFT JOIN organizations o ON o.assigned_rep_id = u.id 
    WHERE u.id IN (55, 56, 58, 59) 
    GROUP BY u.id, u.name, u.role 
    ORDER BY org_count DESC
  `);
  console.log('Current distribution:');
  dist.rows.forEach(r => console.log(`  ${r.name} (${r.role}): ${r.org_count} orgs`));

  // Total orgs in MN
  const total = await c.query("SELECT COUNT(*) FROM organizations WHERE state = 'MN'");
  console.log(`\nTotal MN orgs: ${total.rows[0].count}`);

  // William's orgs by tuf_zone
  const byZone = await c.query(`
    SELECT COALESCE(tuf_zone, 'none') as zone, COUNT(*) 
    FROM organizations 
    WHERE assigned_rep_id = 58 
    GROUP BY tuf_zone 
    ORDER BY count DESC
  `);
  console.log("\nWilliam's orgs by zone:");
  byZone.rows.forEach(r => console.log(`  ${r.zone}: ${r.count}`));

  // Josh's current territory
  const josh = await c.query("SELECT name, territory FROM users WHERE id = 56");
  console.log(`\nJosh Hoffman territory: ${josh.rows[0]?.territory}`);

  // Ryan's current territory
  const ryan = await c.query("SELECT name, territory FROM users WHERE id = 59");
  console.log(`Ryan Streetar territory: ${ryan.rows[0]?.territory}`);

  // William's territory
  const will = await c.query("SELECT name, territory, state_market FROM users WHERE id = 58");
  console.log(`William Denzer territory: ${will.rows[0]?.territory}, state_market: ${will.rows[0]?.state_market}`);

  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
