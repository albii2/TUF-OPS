const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  // Delete the test org we created for Ryan (id=460)
  await c.query('DELETE FROM organizations WHERE name LIKE $1', ['Test School Ryan%']);
  const remaining = await c.query("SELECT COUNT(*) FROM organizations WHERE name LIKE 'Test School Ryan%'");
  console.log('Cleaned up test orgs:', remaining.rows[0].count, 'remaining');
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
