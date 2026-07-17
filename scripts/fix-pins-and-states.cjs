// Fix PIN classes, territory scoping, and org state assignment
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

  // 1. Fix PIN classes
  console.log('=== PIN CLASSES ===');
  
  // Josh Hoffman: 5080 → 6080 (TAE=6000s)
  const joshHash = await hashPin('6080');
  await c.query("UPDATE users SET credential_hash='" + joshHash + "', credential_version=COALESCE(credential_version,0)+1 WHERE id=56");
  console.log("Josh Hoffman (REP) PIN: 5080 → 6080");
  
  // Brandon Myers: 1000 → 7088 (DIRECTOR=7000s)
  const brandonHash = await hashPin('7088');
  await c.query("UPDATE users SET credential_hash='" + brandonHash + "', credential_version=COALESCE(credential_version,0)+1 WHERE id=65");
  console.log("Brandon Myers (DIRECTOR) PIN: 1000 → 7088");
  
  // 2. William Denzer: Western Wisconsin → sees MN + WI
  await c.query("UPDATE users SET territory='wi,mn', region='Western Wisconsin & Minnesota', state_market='WI,MN' WHERE id=58");
  console.log("William Denzer: state_market=WI,MN (sees both states)");
  
  // 3. Verify/Set Primeau's state_market
  await c.query("UPDATE users SET state_market='MN' WHERE id=55 AND state_market IS NULL");
  const pm = await c.query("SELECT name, state_market FROM users WHERE id=55");
  console.log("Primeau Hill: state_market=" + pm.rows[0].state_market);
  
  // 4. Set all orgs with empty state to 'MN'
  const orgs = await c.query("UPDATE organizations SET state='MN' WHERE state IS NULL OR state=''");
  console.log("Organizations updated to state=MN: " + orgs.rowCount);
  
  // 5. Verify counts
  const counts = await c.query("SELECT state, COUNT(*) FROM organizations GROUP BY state ORDER BY count DESC");
  console.log("Org state distribution:");
  counts.rows.forEach(r => console.log("  " + r.state + ": " + r.count));
  
  // 6. Verify all users
  const users = await c.query("SELECT id, name, role, territory, state_market FROM users WHERE status='ACTIVE' ORDER BY id");
  console.log("\nActive users:");
  users.rows.forEach(u => console.log("  " + u.id + " " + u.name + " " + u.role + " territory=" + u.territory + " state=" + u.state_market));
  
  await c.end();
  console.log("\nDone");
})().catch(e => { console.error(e.message); process.exit(1); });
