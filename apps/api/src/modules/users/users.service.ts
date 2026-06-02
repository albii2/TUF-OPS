import { pool } from '@packages/database';
import { generateTemporaryCredential, hashCredential, validatePermanentCredential, validateTemporaryCredential, verifyCredential } from './credentials';
import type { ChangeCredentialPayload, CreateUserPayload, CredentialAuditAction, LoginPayload, SafeUser, UserRole } from './users.interface';

const SENSITIVE_FIELDS = new Set(['password', 'password_hash', 'credential_hash']);
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function sanitizeUser(row: any): SafeUser {
  const safe: any = {};
  Object.keys(row).forEach((key) => {
    if (!SENSITIVE_FIELDS.has(key)) safe[key] = row[key];
  });
  return safe as SafeUser;
}

function assertAdmin(actor?: SafeUser | null) {
  if (!actor || !['OWNER', 'ADMIN'].includes(actor.role)) throw new Error('Only Owner/Admin users can manage credentials');
}

async function audit(action: CredentialAuditAction, targetUserId: number | null, actorUserId?: number | null, metadata: Record<string, unknown> = {}) {
  const scrubbed = Object.fromEntries(Object.entries(metadata).filter(([key]) => !key.toLowerCase().includes('credential') && !key.toLowerCase().includes('password') && !key.toLowerCase().includes('pin')));
  await pool.query(
    'INSERT INTO credential_audit_logs (action, target_user_id, actor_user_id, metadata) VALUES ($1, $2, $3, $4)',
    [action, targetUserId, actorUserId ?? null, JSON.stringify(scrubbed)],
  );
}

export async function getSafeUserById(id: number): Promise<SafeUser | null> {
  const result = await pool.query('SELECT id, name, email, role, territory, assigned_director_id, status, must_change_credential, created_at, updated_at FROM users WHERE id = $1', [id]);
  return result.rows[0] ? sanitizeUser(result.rows[0]) : null;
}

async function getUserWithCredentialById(id: number) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

async function getUserWithCredentialByEmail(email: string) {
  const result = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  return result.rows[0] ?? null;
}

export async function listUsers(): Promise<SafeUser[]> {
  const result = await pool.query('SELECT id, name, email, role, territory, assigned_director_id, status, must_change_credential, created_at, updated_at FROM users ORDER BY name');
  return result.rows.map(sanitizeUser);
}

export async function createUserWithTemporaryCredential(payload: CreateUserPayload, actorUserId: number) {
  const actor = await getSafeUserById(actorUserId);
  assertAdmin(actor);
  const temporaryCredential = payload.temporary_credential || generateTemporaryCredential();
  validateTemporaryCredential(temporaryCredential);
  if (!payload.name?.trim()) throw new Error('Name is required');
  if (!payload.email?.trim()) throw new Error('Email is required');
  const credentialHash = await hashCredential(temporaryCredential);
  const result = await pool.query(
    `INSERT INTO users (name, email, role, territory, assigned_director_id, credential_hash, must_change_credential, status)
     VALUES ($1, lower($2), $3, $4, $5, $6, true, 'ACTIVE')
     RETURNING id, name, email, role, territory, assigned_director_id, status, must_change_credential, created_at, updated_at`,
    [payload.name.trim(), payload.email.trim(), payload.role, payload.territory ?? null, payload.assigned_director_id ?? null, credentialHash],
  );
  const user = sanitizeUser(result.rows[0]);
  await audit('USER_CREATED', user.id, actorUserId, { role: user.role });
  await audit('TEMPORARY_CREDENTIAL_GENERATED', user.id, actorUserId, { reason: 'create_user' });
  return { user, temporaryCredential };
}

export async function resetUserCredential(targetUserId: number, actorUserId: number, temporaryCredential = generateTemporaryCredential()) {
  const actor = await getSafeUserById(actorUserId);
  assertAdmin(actor);
  validateTemporaryCredential(temporaryCredential);
  const credentialHash = await hashCredential(temporaryCredential);
  const result = await pool.query(
    `UPDATE users SET credential_hash = $1, must_change_credential = true, failed_credential_attempts = 0, locked_until = NULL, updated_at = NOW()
     WHERE id = $2 RETURNING id, name, email, role, territory, assigned_director_id, status, must_change_credential, created_at, updated_at`,
    [credentialHash, targetUserId],
  );
  if (!result.rows[0]) throw new Error('User not found');
  const user = sanitizeUser(result.rows[0]);
  await audit('CREDENTIAL_RESET', user.id, actorUserId, { reason: 'admin_reset' });
  await audit('TEMPORARY_CREDENTIAL_GENERATED', user.id, actorUserId, { reason: 'reset' });
  return { user, temporaryCredential };
}

export async function loginWithCredential(payload: LoginPayload) {
  const credential = payload.credential || '';
  const email = payload.email || '';
  const user = await getUserWithCredentialByEmail(email);
  if (!user || user.status !== 'ACTIVE') {
    await audit('FAILED_CREDENTIAL_ATTEMPT', user?.id ?? null, null, { email });
    return null;
  }
  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    await audit('FAILED_CREDENTIAL_ATTEMPT', user.id, null, { email, reason: 'locked' });
    return null;
  }
  const ok = await verifyCredential(credential, user.credential_hash || user.password || '');
  if (!ok) {
    const attempts = Number(user.failed_credential_attempts ?? 0) + 1;
    const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null;
    await pool.query('UPDATE users SET failed_credential_attempts = $1, locked_until = $2 WHERE id = $3', [attempts, lockedUntil, user.id]);
    await audit('FAILED_CREDENTIAL_ATTEMPT', user.id, null, { email, attempts });
    return null;
  }
  await pool.query('UPDATE users SET failed_credential_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1', [user.id]);
  await audit('SUCCESSFUL_LOGIN', user.id, user.id, {});
  return sanitizeUser(user);
}

export async function changeOwnCredential(userId: number, payload: ChangeCredentialPayload) {
  validatePermanentCredential(payload.new_credential);
  const user = await getUserWithCredentialById(userId);
  if (!user || user.status !== 'ACTIVE') throw new Error('User not found');
  const currentOk = await verifyCredential(payload.current_credential || '', user.credential_hash || user.password || '');
  if (!currentOk) {
    await audit('FAILED_CREDENTIAL_ATTEMPT', user.id, user.id, { reason: 'change_credential' });
    throw new Error('Current credential is invalid');
  }
  const nextHash = await hashCredential(payload.new_credential);
  const result = await pool.query(
    `UPDATE users SET credential_hash = $1, must_change_credential = false, failed_credential_attempts = 0, locked_until = NULL, updated_at = NOW()
     WHERE id = $2 RETURNING id, name, email, role, territory, assigned_director_id, status, must_change_credential, created_at, updated_at`,
    [nextHash, userId],
  );
  await audit('CREDENTIAL_CHANGED', userId, userId, {});
  return sanitizeUser(result.rows[0]);
}

export async function seedInitialOwnerIfEmpty(initialCredential = process.env.INITIAL_OWNER_CREDENTIAL || '0000') {
  const count = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  if (count.rows[0]?.count > 0) return;
  validateTemporaryCredential(initialCredential);
  await pool.query(
    `INSERT INTO users (name, email, role, credential_hash, must_change_credential, status)
     VALUES ($1, $2, $3, $4, true, 'ACTIVE')`,
    ['Coach Bradshaw', 'owner@tuf.local', 'OWNER' satisfies UserRole, await hashCredential(initialCredential)],
  );
}

export const __test = { sanitizeUser, audit };
