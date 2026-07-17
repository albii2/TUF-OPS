const { Client } = require('pg');
const { randomBytes, scrypt } = require('crypto');
const { promisify } = require('util');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  
  const salt = randomBytes(16).toString('base64url');
  const key = await promisify(scrypt)('1000', salt, 32, { N: 16384, r: 8, p: 1 });
  const hash = 'scrypt$16384$8$1$' + salt + '$' + key.toString('base64url');
  
  await c.query(
    `INSERT INTO users (name, email, role, status, credential_hash, must_change_credential,
      hr_docs_completed, director_signed_off, is_certified, practical_exercise_completed,
      territory, region, state_market, certification_source)
     VALUES ('Brandon Myers', 'bc00lmyers@gmail.com', 'DIRECTOR', 'ACTIVE',
      '${hash}', true, false, false, false, false,
      'il', 'Illinois', 'IL', 'manual')`
  );
  
  const r = await c.query("SELECT id FROM users WHERE name='Brandon Myers'");
  console.log('Brandon Myers created, id:', r.rows[0].id, 'PIN: 1000');
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
