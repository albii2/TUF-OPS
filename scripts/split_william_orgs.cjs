// Split William Denzer's 119 orgs by territory zone:
// TUF West (27) → Josh Hoffman (56)
// TUF Metro (23) → Ryan Streetar (59)
// TUF South + North + unzoned (69) → William keeps (58)

const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await c.query('BEGIN');

  // Move TUF West orgs from William → Josh
  const west = await c.query(`
    UPDATE organizations 
    SET assigned_rep_id = 56, 
        assigned_rep_name = 'Josh Hoffman',
        assigned_rep_email = 'josh.hoffman@tufsports.us',
        assigned_director_id = 55,
        assigned_director_name = 'Primeau Hill'
    WHERE assigned_rep_id = 58 AND tuf_zone = 'TUF West'
    RETURNING id
  `);
  console.log(`TUF West → Josh Hoffman: ${west.rowCount} orgs`);

  // Move TUF Metro orgs from William → Ryan
  const metro = await c.query(`
    UPDATE organizations 
    SET assigned_rep_id = 59, 
        assigned_rep_name = 'Ryan Streetar',
        assigned_rep_email = 'ryan.streetar@tufsports.us',
        assigned_director_id = 55,
        assigned_director_name = 'Primeau Hill'
    WHERE assigned_rep_id = 58 AND tuf_zone = 'TUF Metro'
    RETURNING id
  `);
  console.log(`TUF Metro → Ryan Streetar: ${metro.rowCount} orgs`);

  // William keeps TUF South + TUF North + unzoned (no change needed)
  const remaining = await c.query("SELECT COUNT(*) FROM organizations WHERE assigned_rep_id = 58");
  console.log(`William keeps: ${remaining.rows[0].count} orgs`);

  // Verify final distribution
  const dist = await c.query(`
    SELECT u.name, COUNT(o.id) as org_count 
    FROM users u 
    LEFT JOIN organizations o ON o.assigned_rep_id = u.id 
    WHERE u.id IN (55, 56, 58, 59) 
    GROUP BY u.id, u.name 
    ORDER BY org_count DESC
  `);
  console.log('\nFinal distribution:');
  dist.rows.forEach(r => console.log(`  ${r.name}: ${r.org_count}`));

  await c.query('COMMIT');
  await c.end();
  console.log('\nDone');
})().catch(e => { console.error(e.message); process.exit(1); });
