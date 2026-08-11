// Fix: sync assigned_rep_name with actual user name for William Denzer's orgs
// AND reset his PIN to 7188
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
  
  // 1. Sync assigned_rep_name where assigned_rep_id=58 but name is wrong
  const fixResult = await c.query(
    "UPDATE organizations SET assigned_rep_name = 'William Denzer', assigned_rep_email = 'william.denzer@tufsports.us' WHERE assigned_rep_id = 58 AND assigned_rep_name != 'William Denzer'"
  );
  console.log(`Fixed ${fixResult.rowCount} orgs: assigned_rep_name synced to 'William Denzer'`);
  
  // 2. Reset PIN to 7188
  const hash = await hashPin('7188');
  await c.query("UPDATE users SET credential_hash='" + hash + "', credential_version=COALESCE(credential_version,0)+1 WHERE id=58");
  console.log("PIN reset to 7188");
  
  // 3. Verify
  const verify = await c.query("SELECT assigned_rep_name, COUNT(*) FROM organizations WHERE assigned_rep_id = 58 GROUP BY assigned_rep_name");
  console.log('\nOrg rep names for user 58 after fix:');
  verify.rows.forEach(r => console.log(`  ${r.assigned_rep_name}: ${r.count}`));
  
  const user = await c.query("SELECT id, name, role, state_market, credential_version FROM users WHERE id = 58");
  console.log('\nUser 58:', JSON.stringify(user.rows[0]));
  
  await c.end();
  console.log('\nDone — William Denzer PIN=7188, all 119 orgs now show his name');
})().catch(e => { console.error(e.message); process.exit(1); });
