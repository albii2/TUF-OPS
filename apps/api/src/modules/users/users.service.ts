import { createHmac, timingSafeEqual } from 'crypto';
import { pool } from '@packages/database';
import { generateTemporaryCredential, hashCredential, validatePermanentCredential, validateTemporaryCredential, verifyCredential } from './credentials';
import type { AuthSession, ChangeCredentialPayload, CreateUserPayload, CredentialAuditAction, LoginPayload, SafeUser, UserRole } from './users.interface';
import { auditLog } from '../shared/audit-log';

const SENSITIVE_FIELDS = new Set(['password', 'password_hash', 'credential_hash']);
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

function isLocalRuntime() {
  return !isProductionRuntime() || ['development', 'test'].includes(process.env.NODE_ENV || '') || process.env.ALLOW_INSECURE_DEV_AUTH_SECRET === 'true';
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

function getBootstrapOwnerCredential() {
  const credential = process.env.INITIAL_OWNER_CREDENTIAL;
  if (credential) {
    validateTemporaryCredential(credential);
    return credential;
  }
  if (isProductionRuntime()) throw new Error('INITIAL_OWNER_CREDENTIAL is required to bootstrap or promote an owner account in production');
  return '0000';
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
  if (!actor || actor.role !== 'ADMIN') throw new Error('Only Owner/Admin users can manage credentials');
}

async function audit(action: CredentialAuditAction, targetUserId: number | null, actorUserId?: number | null, metadata: Record<string, unknown> = {}) {
  const scrubbed = Object.fromEntries(Object.entries(metadata).filter(([key]) => !key.toLowerCase().includes('credential') && !key.toLowerCase().includes('password') && !key.toLowerCase().includes('pin')));
  await pool.query(
    'INSERT INTO credential_audit_logs (action, target_user_id, actor_user_id, metadata) VALUES ($1, $2, $3, $4)',
    [action, targetUserId, actorUserId ?? null, JSON.stringify(scrubbed)],
  );
}

export async function getSafeUserById(id: number): Promise<SafeUser | null> {
  const result = await pool.query('SELECT id, name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, status, must_change_credential, is_certified, hr_docs_completed, director_signed_off, practical_exercise_completed, last_login_at, COALESCE(login_count, 0) as login_count, created_at, updated_at FROM users WHERE id = $1', [id]);
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
  const result = await pool.query('SELECT id, name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, status, must_change_credential, is_certified, hr_docs_completed, director_signed_off, practical_exercise_completed, last_login_at, COALESCE(login_count, 0) as login_count, created_at, updated_at FROM users ORDER BY name');
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
    `INSERT INTO users (name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, credential_hash, must_change_credential, status)
     VALUES ($1, lower($2), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, 'ACTIVE')
     RETURNING id, name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, status, must_change_credential, created_at, updated_at`,
    [
      payload.name.trim(),
      payload.email.trim(),
      payload.role,
      payload.rank ?? null,
      payload.tier ?? null,
      payload.region ?? null,
      payload.state_market ?? null,
      payload.division ?? null,
      payload.territory ?? null,
      payload.subterritory ?? null,
      payload.sport_focus ?? null,
      payload.assigned_director_id ?? null,
      payload.reports_to_user_id ?? null,
      credentialHash
    ],
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
     WHERE id = $2 RETURNING id, name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, status, must_change_credential, created_at, updated_at`,
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

  let user: any = null;

  if (email) {
    user = await getUserWithCredentialByEmail(email);
  } else {
    // PIN-only login — search all ACTIVE users
    const result = await pool.query('SELECT * FROM users WHERE status = $1', ['ACTIVE']);
    for (const row of result.rows) {
      if (await verifyCredential(credential, row.credential_hash || row.password || '')) {
        user = row;
        break;
      }
    }
  }
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
  await pool.query('UPDATE users SET failed_credential_attempts = 0, locked_until = NULL, last_login_at = NOW(), login_count = COALESCE(login_count, 0) + 1 WHERE id = $1', [user.id]);
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
     WHERE id = $2 RETURNING id, name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, status, must_change_credential, created_at, updated_at`,
    [nextHash, userId],
  );
  await audit('CREDENTIAL_CHANGED', userId, userId, {});
  return sanitizeUser(result.rows[0]);
}

export async function seedInitialOwnerIfEmpty(initialCredential?: string) {
  const ownerCount = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'");
  if (ownerCount.rows[0]?.count > 0) return;

  const count = await pool.query('SELECT COUNT(*)::int AS count FROM users');
  const credential = initialCredential || getBootstrapOwnerCredential();
  const credentialHash = await hashCredential(credential);
  if (count.rows[0]?.count > 0) {
    await pool.query(
      `UPDATE users
       SET role = 'ADMIN', rank = 'Admin', region = 'National', division = 'All', territory = 'National', subterritory = 'All', sport_focus = 'All', credential_hash = $1, must_change_credential = true, status = 'ACTIVE', failed_credential_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = (SELECT id FROM users ORDER BY CASE WHEN lower(email) IN ('owner@tuf.local', 'coach@tuf.local') OR lower(name) LIKE '%bradshaw%' THEN 0 ELSE 1 END, id LIMIT 1)`,
      [credentialHash],
    );
    return;
  }

  await pool.query(
    `INSERT INTO users (name, email, role, rank, region, division, territory, subterritory, sport_focus, credential_hash, must_change_credential, status)
     VALUES ($1, $2, 'ADMIN', 'Admin', 'National', 'All', 'National', 'All', 'All', $3, true, 'ACTIVE')`,
    ['Coach Bradshaw', 'owner@tuf.local', credentialHash],
  );
}

export const __test = { sanitizeUser, audit, createAuthToken, verifyAuthToken, getAuthTokenSecret, getBootstrapOwnerCredential };

/**
 * Certify a user as having completed Academy training.
 * Only callable by users with INVITE_USER permission (Director+).
 */
export async function certifyUser(userId: number, actor: SafeUser): Promise<SafeUser> {
  // Only Director+ can certify
  if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'DIRECTOR' && actor.role !== 'REGIONAL_DIRECTOR')) {
    throw new Error('Only Director/Admin users can certify reps');
  }

  const result = await pool.query(
    `UPDATE users SET is_certified = true, director_signed_off = true, updated_at = NOW()
     WHERE id = $1 AND (role = 'REP' OR role = 'sales_rep')
     RETURNING id, name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, status, must_change_credential, is_certified, hr_docs_completed, director_signed_off, practical_exercise_completed, created_at, updated_at`,
    [userId],
  );

  if (!result.rows[0]) throw new Error('User not found or cannot be certified');

  const certifiedUser = sanitizeUser(result.rows[0]);

  auditLog({
    action: 'UPDATE',
    user_id: actor.id,
    resource_type: 'user',
    resource_id: userId,
    metadata: { action: 'certify_user' },
  }).catch(() => {});

  return certifiedUser;
}
