const crypto = require('crypto');

function scryptHash(credential) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const key = crypto.scryptSync(credential, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString('base64url')}`;
}

// PIN → email → name mapping
const users = [
  { email: 'abradshaw@tufsports.us', name: 'A Bradshaw', pin: '8188' },
  { email: 'jhoffman@kipsu.com', name: 'Josh Hoffman', pin: '5080' },
  { email: 'lundbergdave18@gmail.com', name: 'David Lundberg', pin: '6243' },
  { email: 'primeau@tufsports.us', name: 'Primeau Hill', pin: '7288' },
];

exports.up = async (pgm) => {
  for (const { email, pin } of users) {
    const hash = scryptHash(pin);
    await pgm.db.query(
      "UPDATE users SET credential_hash = $1 WHERE lower(email) = $2 AND status = 'ACTIVE'",
      [hash, email]
    );
  }
};

exports.down = async (pgm) => {
  // Reset to PIN 9999
  const hash = scryptHash('9999');
  await pgm.db.query("UPDATE users SET credential_hash = $1", [hash]);
};