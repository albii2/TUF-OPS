const crypto = require('crypto');

function scryptHash(credential) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const key = crypto.scryptSync(credential, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString('base64url')}`;
}

// TUF production users
const tufUsers = [
  { email: 'owner@tuf.local',           name: 'Coach Bradshaw', role: 'ADMIN',    territory: 'National', pin: '8188' },
  { email: 'primeau.hill@tufsports.us',  name: 'Primeau Hill',   role: 'DIRECTOR', territory: 'Minnesota', pin: '7288' },
  { email: 'jhoffman@kipsu.com',         name: 'Josh Hoffman',   role: 'REP',      territory: 'Minnesota', pin: '5080' },
  { email: 'lundbergdave18@gmail.com',   name: 'David Lundberg', role: 'REP',      territory: 'Minnesota', pin: '6243' },
];

exports.up = async (pgm) => {
  // Remove old test seed users (won't affect the owner)
  await pgm.db.query("DELETE FROM users WHERE lower(email) IN ('test.rep@tufsports.us', 'test.director@tufsports.us', 'test.director.west@tufsports.us')");

  for (const { email, name, role, territory, pin } of tufUsers) {
    const hash = scryptHash(pin);
    await pgm.db.query(
      `INSERT INTO users (name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, credential_hash, must_change_credential, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'TAE', 'TAE', 'Midwest', 'MN', 'General', $4, 'MN', 'All', $5, false, 'ACTIVE', NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET
         credential_hash = EXCLUDED.credential_hash,
         role = EXCLUDED.role,
         territory = EXCLUDED.territory,
         status = 'ACTIVE',
         updated_at = NOW()`,
      [name, email, role, territory, hash]
    );
  }
};

exports.down = async (pgm) => {
  for (const { email } of tufUsers) {
    await pgm.db.query("UPDATE users SET credential_hash = NULL, status = 'INACTIVE' WHERE lower(email) = $1", [email]);
  }
};