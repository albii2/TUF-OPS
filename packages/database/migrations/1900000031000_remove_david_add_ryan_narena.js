const crypto = require('crypto');

function scryptHash(credential) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const key = crypto.scryptSync(credential, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString('base64url')}`;
}

exports.up = async (pgm) => {
  // 1. Remove David Lundberg
  await pgm.db.query("DELETE FROM users WHERE email = 'lundbergdave18@gmail.com'");

  // 2. Add Ryan Streetar — TAE, uncertified, gated, Minneapolis metro
  const ryanHash = scryptHash('6350');
  await pgm.db.query(
    `INSERT INTO users (name, email, role, credential_hash, is_certified, director_signed_off, must_change_credential, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
    ['Ryan Streetar', 'ryan.streetar@tufsports.us', 'REP', ryanHash, false, false, false, 'ACTIVE']
  );

  // 3. Add Narena Anderson — TAE, uncertified, gated, no territory yet
  const narenaHash = scryptHash('6450');
  await pgm.db.query(
    `INSERT INTO users (name, email, role, credential_hash, is_certified, director_signed_off, must_change_credential, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
    ['Narena Anderson', 'narena.anderson@tufsports.us', 'REP', narenaHash, false, false, false, 'ACTIVE']
  );
};

exports.down = async () => {
  throw new Error('Irreversible migration');
};
