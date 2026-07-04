const crypto = require('crypto');

function scryptHash(credential) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const key = crypto.scryptSync(credential, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString('base64url')}`;
}

// PIN → email → name mapping
const users = [
  { email: 'owner@tuf.local', name: 'Coach Bradshaw', pin: '8188' },
  { email: 'jhoffman@kipsu.com', name: 'Josh Hoffman', pin: '5080' },
  { email: 'lundbergdave18@gmail.com', name: 'David Lundberg', pin: '6243' },
  { email: 'primeau.hill@tufsports.us', name: 'Primeau Hill', pin: '7288' },
];

exports.up = async (pgm) => {
  for (const { email, name, pin } of users) {
    const hash = scryptHash(pin);
    // Upsert: update hash if user exists, insert if not
    await pgm.db.query(
      `INSERT INTO users (name, email, role, rank, region, division, territory, subterritory, sport_focus, credential_hash, must_change_credential, status, created_at, updated_at)
       VALUES ($1, $2, 'REP', 'TAE', 'Midwest', 'General', 'Minnesota', 'MN', 'All', $3, false, 'ACTIVE', NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET credential_hash = EXCLUDED.credential_hash`,
      [name, email, hash]
    );
  }
  // Ensure the owner stays ADMIN
  await pgm.db.query(
    "UPDATE users SET role = 'ADMIN', rank = 'Admin', region = 'National', division = 'All', territory = 'National', subterritory = 'All', sport_focus = 'All' WHERE lower(email) = 'owner@tuf.local'"
  );
};

exports.down = async (pgm) => {
  // Reset to PIN 9999
  const hash = scryptHash('9999');
  await pgm.db.query("UPDATE users SET credential_hash = $1", [hash]);
};