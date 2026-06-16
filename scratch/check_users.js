const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function check() {
  const res = await pool.query('SELECT id, name, email, role, status, credential_hash, is_certified FROM users ORDER BY id');
  console.log('--- USERS IN DATABASE ---');
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
