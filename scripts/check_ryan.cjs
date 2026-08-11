const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  
  // Ryan Streetar
  const u = await c.query("SELECT id, name, email, role, status, is_certified, state_market, territory, credential_version FROM users WHERE id = 59");
  console.log('Ryan Streetar:', JSON.stringify(u.rows[0], null, 2));
  
  // Also check org creation permission flow
  const r = await c.query("SELECT id, name, role FROM users WHERE id = 59");
  console.log('\nRole details:', r.rows[0]);
  
  // Check any recent errors
  const logs = await c.query("SELECT * FROM credential_audit_logs WHERE target_user_id = 59 ORDER BY created_at DESC LIMIT 3");
  console.log('\nRecent audit logs:', JSON.stringify(logs.rows, null, 2));
  
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
