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
  
  // Check ADMIN (id=54) credential status
  const u = await c.query("SELECT id, name, role, credential_version, credential_hash IS NOT NULL as has_hash FROM users WHERE id = 54");
  console.log('ADMIN:', JSON.stringify(u.rows[0]));
  
  // Reset PIN to 8188
  const hash = await hashPin('8188');
  await c.query("UPDATE users SET credential_hash='" + hash + "', credential_version=COALESCE(credential_version,0)+1 WHERE id=54");
  console.log('ADMIN PIN reset to 8188');
  
  // Verify
  const { scrypt: sc, timingSafeEqual } = require('crypto');
  async function verify(raw, stored) {
    const parts = stored.split('$');
    if (parts.length < 6) return false;
    const [, N, r, p, saltB64, keyB64] = parts;
    const key = await promisify(sc)(raw, saltB64, 32, { N: parseInt(N), r: parseInt(r), p: parseInt(p) });
    return key.length === Buffer.from(keyB64, 'base64url').length && timingSafeEqual(key, Buffer.from(keyB64, 'base64url'));
  }
  const check = await c.query("SELECT credential_hash FROM users WHERE id = 54");
  const ok = await verify('8188', check.rows[0].credential_hash);
  console.log('Verify 8188:', ok);
  
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
