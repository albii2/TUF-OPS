import { Pool } from 'pg';

const connectionString = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/tuf_test'
  : process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
});
