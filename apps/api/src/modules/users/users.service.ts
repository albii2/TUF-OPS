import { createHmac, timingSafeEqual } from 'crypto';
import { pool } from '@packages/database';
import { generateTemporaryCredential, hashCredential, validatePermanentCredential, validateTemporaryCredential, verifyCredential } from './credentials';
import type { AuthSession, ChangeCredentialPayload, CreateUserPayload, CredentialAuditAction, LoginPayload, SafeUser, UserRole } from './users.interface';

const SENSITIVE_FIELDS = new Set(['password', 'password_hash', 'credential_hash']);
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
function isLocalRuntime() {
  return ['development', 'test'].includes(process.env.NODE_ENV || '') || process.env.ALLOW_INSECURE_DEV_AUTH_SECRET === 'true';
}

function getAuthTokenSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET || process.env.SESSION_SECRET;
  if (secret) return secret;
  if (isLocalRuntime()) return 'dev-only-change-me';
  throw new Error('AUTH_TOKEN_SECRET or SESSION_SECRET is required outside local development');
}

export function assertAuthTokenSecretConfigured() {
  getAuthTokenSecret();
}

function requireInitialOwnerCredential() {
  const credential = process.env.INITIAL_OWNER_CREDENTIAL;
  if (!credential) throw new Error('INITIAL_OWNER_CREDENTIAL is required to bootstrap or promote an owner account');
  validateTemporaryCredential(credential);
  return credential;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

function signPayload(payload: string) {
  return createHmac('sha256', getAuthTokenSecret()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createAuthToken(user: SafeUser): string {
  const session: AuthSession = { userId: user.id, expiresAt: Date.now() + TOKEN_TTL_MS };
  const payload = encodeBase64Url(JSON.stringify(session));
  return `${payload}.${signPayload(payload)}`;
}

export async function verifyAuthToken(token?: string): Promise<SafeUser | null> {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, signPayload(payload))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AuthSession;
    if (!session.userId || !session.expiresAt || session.expiresAt < Date.now()) return null;
    const user = await getSafeUserById(session.userId);
    return user?.status === 'ACTIVE' ? user : null;
  } catch {
    return null;
  }
}

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

export async function listUsers(actor?: SafeUser | null): Promise<SafeUser[]> {
  assertAdmin(actor);
  const result = await pool.query('SELECT id, name, email, role, territory, assigned_director_id, status, must_change_credential, created_at, updated_at FROM users ORDER BY name');
  return result.rows.map(sanitizeUser);
}

export async function createUserWithTemporaryCredential(payload: CreateUserPayload, actor: SafeUser) {
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
  await audit('USER_CREATED', user.id, actor.id, { role: user.role });
  await audit('TEMPORARY_CREDENTIAL_GENERATED', user.id, actor.id, { reason: 'create_user' });
  return { user, temporaryCredential };
}

export async function resetUserCredential(targetUserId: number, actor: SafeUser, temporaryCredential = generateTemporaryCredential()) {
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
  await audit('CREDENTIAL_RESET', user.id, actor.id, { reason: 'admin_reset' });
  await audit('TEMPORARY_CREDENTIAL_GENERATED', user.id, actor.id, { reason: 'reset' });
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
  const safeUser = sanitizeUser(user);
  return { user: safeUser, token: createAuthToken(safeUser) };
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

export async function seedInitialOwnerIfEmpty(initialCredential?: string) {
  const ownerCount = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role IN ('OWNER', 'ADMIN') AND status = 'ACTIVE'");
  if (ownerCount.rows[0]?.count > 0) return;

  const count = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  const credential = initialCredential || requireInitialOwnerCredential();
  const credentialHash = await hashCredential(credential);
  if (count.rows[0]?.count > 0) {
    await pool.query(
      `UPDATE users
       SET role = 'OWNER', credential_hash = $1, must_change_credential = true, status = 'ACTIVE', failed_credential_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = (SELECT id FROM users ORDER BY CASE WHEN lower(email) IN ('owner@tuf.local', 'coach@tuf.local') OR lower(name) LIKE '%bradshaw%' THEN 0 ELSE 1 END, id LIMIT 1)`,
      [credentialHash],
    );
    return;
  }

  await pool.query(
    `INSERT INTO users (name, email, role, credential_hash, must_change_credential, status)
     VALUES ($1, $2, $3, $4, true, 'ACTIVE')`,
    ['Coach Bradshaw', 'owner@tuf.local', 'OWNER' satisfies UserRole, credentialHash],
  );
}

export const __test = { sanitizeUser, audit, createAuthToken, verifyAuthToken, getAuthTokenSecret, requireInitialOwnerCredential };
