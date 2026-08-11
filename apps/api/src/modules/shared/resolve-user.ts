import { pool } from '@packages/database';

/**
 * Resolve a user name string to a numeric user ID.
 * Handles common display formats: "Josh Hoffman", "Josh", "Hoffman", etc.
 * Returns null for empty names or "Unassigned".
 */
export async function resolveUserId(name: string): Promise<number | null> {
  if (!name || name === 'Unassigned') return null;
  const result = await pool.query(
    'SELECT id FROM users WHERE name ILIKE $1 LIMIT 1',
    [name]
  );
  return result.rows[0]?.id ?? null;
}
