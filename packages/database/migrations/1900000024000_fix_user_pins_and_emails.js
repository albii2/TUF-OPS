const crypto = require('crypto');

function scryptHash(credential) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const key = crypto.scryptSync(credential, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString('base64url')}`;
}

exports.up = async (pgm) => {
  // Fix admin email mapping — the owner is at owner@tuf.local
  const adminHash = scryptHash('8188');
  await pgm.db.query(
    "UPDATE users SET credential_hash = $1 WHERE lower(email) = 'owner@tuf.local'",
    [adminHash]
  );

  // Insert or fix Primeau (primeau.hill@tufsports.us)
  const primeauHash = scryptHash('7288');
  await pgm.db.query(
    `INSERT INTO users (name, email, role, rank, region, division, territory, subterritory, sport_focus, credential_hash, must_change_credential, status, created_at, updated_at)
     VALUES ('Primeau Hill', 'primeau.hill@tufsports.us', 'DIRECTOR', 'Director', 'Midwest', 'General', 'Minnesota', 'MN', 'All', $1, false, 'ACTIVE', NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET credential_hash = EXCLUDED.credential_hash, role = 'DIRECTOR', rank = 'Director'`,
    [primeauHash]
  );

  // Insert or fix Josh (jhoffman@kipsu.com)
  const joshHash = scryptHash('5080');
  await pgm.db.query(
    `INSERT INTO users (name, email, role, rank, region, division, territory, subterritory, sport_focus, credential_hash, must_change_credential, status, created_at, updated_at)
     VALUES ('Josh Hoffman', 'jhoffman@kipsu.com', 'REP', 'TAE', 'Midwest', 'General', 'Minnesota', 'MN', 'All', $1, false, 'ACTIVE', NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET credential_hash = EXCLUDED.credential_hash`,
    [joshHash]
  );

  // Insert or fix David (lundbergdave18@gmail.com)
  const davidHash = scryptHash('6243');
  await pgm.db.query(
    `INSERT INTO users (name, email, role, rank, region, division, territory, subterritory, sport_focus, credential_hash, must_change_credential, status, created_at, updated_at)
     VALUES ('David Lundberg', 'lundbergdave18@gmail.com', 'REP', 'TAE', 'Midwest', 'General', 'Minnesota', 'MN', 'All', $1, false, 'ACTIVE', NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET credential_hash = EXCLUDED.credential_hash`,
    [davidHash]
  );
};

exports.down = async (pgm) => {
  await pgm.db.query("UPDATE users SET credential_hash = NULL WHERE lower(email) IN ('owner@tuf.local', 'jhoffman@kipsu.com', 'primeau.hill@tufsports.us', 'lundbergdave18@gmail.com')");
};