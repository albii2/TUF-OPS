const { Client } = require('pg');
const { scrypt, timingSafeEqual, randomBytes } = require('crypto');
const { promisify } = require('util');

async function verifyCredential(raw, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length < 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, keyB64] = parts;
  const key = await promisify(scrypt)(raw, saltB64, 32, { N: parseInt(N), r: parseInt(r), p: parseInt(p) });
  const storedKey = Buffer.from(keyB64, 'base64url');
  return key.length === storedKey.length && timingSafeEqual(key, storedKey);
}

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const u = await c.query("SELECT id, name, credential_hash FROM users WHERE id = 58");
  const row = u.rows[0];
  console.log('Hash present:', !!row.credential_hash);
  console.log('Hash prefix:', row.credential_hash?.substring(0, 50));
  
  // Test verification
  const result = await verifyCredential('7188', row.credential_hash);
  console.log('PIN 7188 verifies:', result);
  
  // Check login API response body for debugging
  const loginResult = await c.query("SELECT role, status, is_certified, credential_version FROM users WHERE id = 58");
  console.log('User status:', JSON.stringify(loginResult.rows[0]));
  
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
