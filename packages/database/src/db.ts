import { Pool } from 'pg';

const connectionString = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/tuf_test'
  : process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'test') {
  // Temporary diagnostic to confirm Jest DB target.
  console.log('[TEST DB]', connectionString);
}

export const pool = new Pool({
  connectionString,
});
