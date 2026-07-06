const crypto = require('crypto');

function scryptHash(credential) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const key = crypto.scryptSync(credential, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString('base64url')}`;
}

const tufUsers = [
  { email: 'owner@tuf.local',           name: 'Coach Bradshaw', role: 'ADMIN',    territory: 'National',  pin: '8188', is_certified: true, director_signed_off: true },
  { email: 'primeau.hill@tufsports.us',  name: 'Primeau Hill',   role: 'DIRECTOR', territory: 'Minnesota', pin: '7288', is_certified: true, director_signed_off: true },
  { email: 'jhoffman@kipsu.com',         name: 'Josh Hoffman',   role: 'REP',      territory: 'Minnesota', pin: '5080', is_certified: true, director_signed_off: true },
  { email: 'lundbergdave18@gmail.com',   name: 'David Lundberg', role: 'REP',      territory: 'Minnesota', pin: '6243', is_certified: false, director_signed_off: false },
];

exports.up = async (pgm) => {
  // Delete ALL existing users except the one created by seedInitialOwnerIfEmpty
  await pgm.db.query("DELETE FROM users");
  
  // Re-insert all TUF users with correct scrypt PINs and certification flags
  for (const { email, name, role, territory, pin, is_certified, director_signed_off } of tufUsers) {
    const hash = scryptHash(pin);
    await pgm.db.query(
      `INSERT INTO users (name, email, role, credential_hash, is_certified, director_signed_off, must_change_credential, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, 'ACTIVE', NOW(), NOW())`,
      [name, email, role, hash, is_certified, director_signed_off]
    );
  }
};

exports.down = async () => {
  throw new Error('Irreversible migration');
};