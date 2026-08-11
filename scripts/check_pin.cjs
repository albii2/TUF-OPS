const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const u = await c.query("SELECT id, name, email, role, credential_hash IS NOT NULL as has_pin, credential_version FROM users WHERE id = 58");
  console.log(JSON.stringify(u.rows[0], null, 2));
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
