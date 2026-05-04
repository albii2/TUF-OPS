import { Pool } from 'pg';

const connectionString = 'postgresql://localhost:5432/tuf_test';

console.log('[FORCED TEST DB]', connectionString);

export const pool = new Pool({
  connectionString,
});
