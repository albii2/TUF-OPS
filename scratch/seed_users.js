const { Pool } = require('pg');
const crypto = require('crypto');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });

function hashCredential(credential) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const key = crypto.scryptSync(credential, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString('base64url')}`;
}

async function seed() {
  await pool.query('DELETE FROM users');
  console.log('Cleared existing users.');

  // 1. A Bradshaw VP (Owner)
  const ownerHash = hashCredential('8188');
  const ownerRes = await pool.query(
    `INSERT INTO users (name, email, role, credential_hash, must_change_credential, status, hr_docs_completed, director_signed_off, is_certified)
     VALUES ($1, lower($2), $3, $4, false, 'ACTIVE', true, true, true) RETURNING id`,
    ['A Bradshaw VP', 'abradshaw@tufsports.us', 'OWNER', ownerHash]
  );
  console.log('Seeded Owner (A Bradshaw VP):', ownerRes.rows[0].id);

  // 2. Primeau Hill (Minnesota State Director)
  const primeauHash = hashCredential('7428');
  const pIdRes = await pool.query(
    `INSERT INTO users (name, email, role, credential_hash, must_change_credential, status, hr_docs_completed, director_signed_off, is_certified)
     VALUES ($1, lower($2), $3, $4, false, 'ACTIVE', true, true, true) RETURNING id`,
    ['Primeau Hill', 'primeau.hill@tufsports.us', 'DIRECTOR', primeauHash]
  );
  const primeauId = pIdRes.rows[0].id;
  console.log('Seeded State Director (Primeau Hill):', primeauId);

  // 3. Jason Mulder (Senior TAE)
  const jasonHash = hashCredential('6187');
  const jasonRes = await pool.query(
    `INSERT INTO users (name, email, role, territory, assigned_director_id, credential_hash, must_change_credential, status, hr_docs_completed, director_signed_off, is_certified)
     VALUES ($1, lower($2), $3, $4, $5, $6, false, 'ACTIVE', false, false, false) RETURNING id`,
    ['Jason Mulder', 'jvmulder@gmail.com', 'REP', 'Prior Lake / Shakopee / Burnsville / Savage', primeauId, jasonHash]
  );
  console.log('Seeded Senior TAE (Jason Mulder):', jasonRes.rows[0].id);

  // 4. David Lundberg (Senior TAE)
  const lundbergHash = hashCredential('6243');
  const lundbergRes = await pool.query(
    `INSERT INTO users (name, email, role, territory, assigned_director_id, credential_hash, must_change_credential, status, hr_docs_completed, director_signed_off, is_certified)
     VALUES ($1, lower($2), $3, $4, $5, $6, false, 'ACTIVE', false, false, false) RETURNING id`,
    ['David Lundberg', 'lundbergdave18@gmail.com', 'REP', 'Bloomington / Richfield / Minnetonka', primeauId, lundbergHash]
  );
  console.log('Seeded Senior TAE (David Lundberg):', lundbergRes.rows[0].id);

  // 5. Shayla Hilliard (TAE)
  const shaylaHash = hashCredential('5219');
  const shaylaRes = await pool.query(
    `INSERT INTO users (name, email, role, territory, assigned_director_id, credential_hash, must_change_credential, status, hr_docs_completed, director_signed_off, is_certified)
     VALUES ($1, lower($2), $3, $4, $5, $6, false, 'ACTIVE', false, false, false) RETURNING id`,
    ['Shayla Hilliard', 'shaylahilliard17@gmail.com', 'REP', 'Elk River / Anoka / Champlin', primeauId, shaylaHash]
  );
  console.log('Seeded TAE (Shayla Hilliard):', shaylaRes.rows[0].id);

  // 6. Josh Hoffman (TAE)
  const hoffmanHash = hashCredential('5080');
  const hoffmanRes = await pool.query(
    `INSERT INTO users (name, email, role, territory, assigned_director_id, credential_hash, must_change_credential, status, hr_docs_completed, director_signed_off, is_certified)
     VALUES ($1, lower($2), $3, $4, $5, $6, false, 'ACTIVE', false, false, false) RETURNING id`,
    ['Josh Hoffman', 'jhoffman@kipsu.com', 'REP', 'Minneapolis / St. Paul Metro', primeauId, hoffmanHash]
  );
  console.log('Seeded TAE (Josh Hoffman):', hoffmanRes.rows[0].id);

  console.log('All correct user accounts seeded successfully!');
  await pool.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
