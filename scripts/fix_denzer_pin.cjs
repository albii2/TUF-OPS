// Fix William Denzer's PIN and verify org access
const { Client } = require('pg');
const { randomBytes, scrypt } = require('crypto');
const { promisify } = require('util');

async function hashPin(pin) {
  const salt = randomBytes(16).toString('base64url');
  const key = await promisify(scrypt)(pin, salt, 32, { N: 16384, r: 8, p: 1 });
  return 'scrypt$16384$8$1$' + salt + '$' + key.toString('base64url');
}

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  
  // Fix William Denzer's PIN to 7188
  const hash = await hashPin('7188');
  await c.query("UPDATE users SET credential_hash='" + hash + "', credential_version=COALESCE(credential_version,0)+1 WHERE id=58");
  console.log("William Denzer PIN set to 7188, credential_version incremented");
  
  // Verify
  const u = await c.query("SELECT id, name, email, role, state_market, credential_version FROM users WHERE id = 58");
  console.log('Updated user:', JSON.stringify(u.rows[0]));
  
  await c.end();
  console.log('Done');
})().catch(e => { console.error(e.message); process.exit(1); });
