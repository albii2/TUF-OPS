"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertAuthTokenSecretConfigured = assertAuthTokenSecretConfigured;
exports.createAuthToken = createAuthToken;
exports.verifyAuthToken = verifyAuthToken;
exports.getSafeUserById = getSafeUserById;
exports.listUsers = listUsers;
exports.createUserWithTemporaryCredential = createUserWithTemporaryCredential;
exports.resetUserCredential = resetUserCredential;
exports.setUserStatus = setUserStatus;
exports.updateUser = updateUser;
exports.loginWithCredential = loginWithCredential;
exports.changeOwnCredential = changeOwnCredential;
exports.seedInitialOwnerIfEmpty = seedInitialOwnerIfEmpty;
exports.certifyUser = certifyUser;
const crypto_1 = require("crypto");
const database_1 = require("@packages/database");
const credentials_1 = require("./credentials");
const audit_log_1 = require("../shared/audit-log");
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
    if (secret)
        return secret;
    if (isLocalRuntime())
        return 'dev-only-change-me';
    throw new Error('AUTH_TOKEN_SECRET or SESSION_SECRET is required outside local development');
}
function assertAuthTokenSecretConfigured() {
    getAuthTokenSecret();
}
function getBootstrapOwnerCredential() {
    const credential = process.env.INITIAL_OWNER_CREDENTIAL;
    if (credential) {
        (0, credentials_1.validatePin)(credential);
        return credential;
    }
    if (isProductionRuntime())
        throw new Error('INITIAL_OWNER_CREDENTIAL is required to bootstrap or promote an owner account in production');
    return '0000';
}
function encodeBase64Url(value) {
    return Buffer.from(value).toString('base64url');
}
function signPayload(payload) {
    return (0, crypto_1.createHmac)('sha256', getAuthTokenSecret()).update(payload).digest('base64url');
}
function safeEqual(a, b) {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && (0, crypto_1.timingSafeEqual)(left, right);
}
function createAuthToken(user) {
    const session = { userId: user.id, credentialVersion: user.credential_version, expiresAt: Date.now() + TOKEN_TTL_MS };
    const payload = encodeBase64Url(JSON.stringify(session));
    return `${payload}.${signPayload(payload)}`;
}
async function verifyAuthToken(token) {
    if (!token)
        return null;
    const [payload, signature] = token.split('.');
    if (!payload || !signature || !safeEqual(signature, signPayload(payload)))
        return null;
    try {
        const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!session.userId || !session.expiresAt || session.expiresAt < Date.now())
            return null;
        const user = await getSafeUserById(session.userId);
        if (!user || user.status !== 'ACTIVE')
            return null;
        // Session invalidation: if credential was reset, version won't match
        if (user.credential_version !== session.credentialVersion)
            return null;
        return user;
    }
    catch {
        return null;
    }
}
function sanitizeUser(row) {
    const safe = {};
    Object.keys(row).forEach((key) => {
        if (!SENSITIVE_FIELDS.has(key))
            safe[key] = row[key];
    });
    safe.credential_version = row.credential_version ?? 0;
    return safe;
}
function assertAdmin(actor) {
    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'DIRECTOR'))
        throw new Error('Only Owner/Admin/Director users can manage credentials');
}
async function audit(action, targetUserId, actorUserId, metadata = {}) {
    const scrubbed = Object.fromEntries(Object.entries(metadata).filter(([key]) => !key.toLowerCase().includes('credential') && !key.toLowerCase().includes('password') && !key.toLowerCase().includes('pin')));
    await database_1.pool.query('INSERT INTO credential_audit_logs (action, target_user_id, actor_user_id, metadata) VALUES ($1, $2, $3, $4)', [action, targetUserId, actorUserId ?? null, JSON.stringify(scrubbed)]);
}
async function getSafeUserById(id) {
    const result = await database_1.pool.query('SELECT id, name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, status, must_change_credential, is_certified, hr_docs_completed, director_signed_off, practical_exercise_completed, last_login_at, COALESCE(login_count, 0) as login_count, COALESCE(credential_version, 0) as credential_version, created_at, updated_at FROM users WHERE id = $1', [id]);
    return result.rows[0] ? sanitizeUser(result.rows[0]) : null;
}
async function getUserWithCredentialById(id) {
    const result = await database_1.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ?? null;
}
async function listUsers(actor) {
    assertAdmin(actor);
    const result = await database_1.pool.query('SELECT id, name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, status, must_change_credential, is_certified, hr_docs_completed, director_signed_off, practical_exercise_completed, last_login_at, COALESCE(login_count, 0) as login_count, COALESCE(credential_version, 0) as credential_version, created_at, updated_at FROM users ORDER BY name');
    return result.rows.map(sanitizeUser);
}
/**
 * Check if a raw PIN is already in use by any active user.
 */
async function isPinTaken(pin) {
    const result = await database_1.pool.query('SELECT credential_hash FROM users WHERE status = $1', ['ACTIVE']);
    for (const row of result.rows) {
        if (await (0, credentials_1.verifyCredential)(pin, row.credential_hash))
            return true;
    }
    return false;
}
async function createUserWithTemporaryCredential(payload, actor) {
    assertAdmin(actor);
    if (!payload.name?.trim())
        throw new Error('Name is required');
    if (!payload.role)
        throw new Error('Role is required');
    const pin = await (0, credentials_1.generateUniquePin)(isPinTaken);
    (0, credentials_1.validatePin)(pin);
    const credentialHash = await (0, credentials_1.hashCredential)(pin);
    const email = payload.email?.trim() || `${payload.name.trim().toLowerCase().replace(/\s+/g, '.')}@tufsports.us`;
    const result = await database_1.pool.query(`INSERT INTO users (name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, credential_hash, credential_version, must_change_credential, status)
     VALUES ($1, lower($2), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 1, false, 'ACTIVE')
     RETURNING id, name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, status, must_change_credential, created_at, updated_at`, [
        payload.name.trim(),
        email,
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
        credentialHash,
    ]);
    const user = sanitizeUser(result.rows[0]);
    await audit('USER_CREATED', user.id, actor.id, { role: user.role });
    return { user, temporaryCredential: pin };
}
async function resetUserCredential(targetUserId, actor) {
    assertAdmin(actor);
    const pin = await (0, credentials_1.generateUniquePin)(isPinTaken);
    (0, credentials_1.validatePin)(pin);
    const credentialHash = await (0, credentials_1.hashCredential)(pin);
    // Invalidate existing sessions by bumping credential_version
    const result = await database_1.pool.query(`UPDATE users SET credential_hash = $1, credential_version = credential_version + 1, must_change_credential = false, failed_credential_attempts = 0, locked_until = NULL, updated_at = NOW()
     WHERE id = $2 RETURNING id, name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, status, must_change_credential, created_at, updated_at`, [credentialHash, targetUserId]);
    if (!result.rows[0])
        throw new Error('User not found');
    const user = sanitizeUser(result.rows[0]);
    await audit('CREDENTIAL_RESET', user.id, actor.id, { reason: 'admin_reset' });
    return { user, temporaryCredential: pin };
}
async function setUserStatus(targetUserId, status, actor) {
    assertAdmin(actor);
    const result = await database_1.pool.query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, status', [status, targetUserId]);
    if (!result.rows[0])
        throw new Error('User not found');
    await audit('CREDENTIAL_RESET', targetUserId, actor.id, { reason: `status_${status.toLowerCase()}` });
    return result.rows[0];
}
async function updateUser(targetUserId, patch, actor) {
    assertAdmin(actor);
    const allowed = ['assigned_director_id', 'territory', 'region', 'state_market', 'division', 'subterritory', 'sport_focus', 'reports_to_user_id', 'rank', 'tier'];
    const updates = [];
    const values = [];
    let i = 1;
    for (const key of allowed) {
        if (patch[key] !== undefined) {
            updates.push(`${key} = $${i++}`);
            values.push(patch[key]);
        }
    }
    if (updates.length === 0)
        return null;
    updates.push('updated_at = NOW()');
    values.push(targetUserId);
    await database_1.pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${i}`, values);
    const result = await database_1.pool.query('SELECT * FROM users WHERE id = $1', [targetUserId]);
    return sanitizeUser(result.rows[0]);
}
async function loginWithCredential(payload) {
    const credential = payload.credential || '';
    const email = payload.email || '';
    let user = null;
    if (email) {
        const result = await database_1.pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
        user = result.rows[0] ?? null;
    }
    else {
        // PIN-only login — search all ACTIVE users
        const result = await database_1.pool.query('SELECT * FROM users WHERE status = $1', ['ACTIVE']);
        for (const row of result.rows) {
            if (await (0, credentials_1.verifyCredential)(credential, row.credential_hash || row.password || '')) {
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
    const ok = await (0, credentials_1.verifyCredential)(credential, user.credential_hash || user.password || '');
    if (!ok) {
        const attempts = Number(user.failed_credential_attempts ?? 0) + 1;
        const lockedUntil = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null;
        await database_1.pool.query('UPDATE users SET failed_credential_attempts = $1, locked_until = $2 WHERE id = $3', [attempts, lockedUntil, user.id]);
        await audit('FAILED_CREDENTIAL_ATTEMPT', user.id, null, { email, attempts });
        return null;
    }
    await database_1.pool.query('UPDATE users SET failed_credential_attempts = 0, locked_until = NULL, last_login_at = NOW(), login_count = COALESCE(login_count, 0) + 1 WHERE id = $1', [user.id]);
    await audit('SUCCESSFUL_LOGIN', user.id, user.id, {});
    const safeUser = sanitizeUser(user);
    return { user: safeUser, token: createAuthToken(safeUser) };
}
async function changeOwnCredential(userId, payload) {
    (0, credentials_1.validatePin)(payload.new_credential);
    const user = await getUserWithCredentialById(userId);
    if (!user || user.status !== 'ACTIVE')
        throw new Error('User not found');
    const currentOk = await (0, credentials_1.verifyCredential)(payload.current_credential || '', user.credential_hash || user.password || '');
    if (!currentOk) {
        await audit('FAILED_CREDENTIAL_ATTEMPT', user.id, user.id, { reason: 'change_credential' });
        throw new Error('Current credential is invalid');
    }
    const nextHash = await (0, credentials_1.hashCredential)(payload.new_credential);
    const result = await database_1.pool.query(`UPDATE users SET credential_hash = $1, must_change_credential = false, failed_credential_attempts = 0, locked_until = NULL, updated_at = NOW()
     WHERE id = $2 RETURNING id, name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, status, must_change_credential, created_at, updated_at`, [nextHash, userId]);
    await audit('CREDENTIAL_CHANGED', userId, userId, {});
    return sanitizeUser(result.rows[0]);
}
async function seedInitialOwnerIfEmpty(initialCredential) {
    const ownerCount = await database_1.pool.query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'");
    if (ownerCount.rows[0]?.count > 0)
        return;
    const count = await database_1.pool.query('SELECT COUNT(*)::int AS count FROM users');
    const credential = initialCredential || getBootstrapOwnerCredential();
    const credentialHash = await (0, credentials_1.hashCredential)(credential);
    if (count.rows[0]?.count > 0) {
        await database_1.pool.query(`UPDATE users
       SET role = 'ADMIN', rank = 'Admin', region = 'National', division = 'All', territory = 'National', subterritory = 'All', sport_focus = 'All', credential_hash = $1, credential_version = 1, must_change_credential = false, status = 'ACTIVE', failed_credential_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = (SELECT id FROM users ORDER BY CASE WHEN lower(email) IN ('owner@tuf.local', 'coach@tuf.local') OR lower(name) LIKE '%bradshaw%' THEN 0 ELSE 1 END, id LIMIT 1)`, [credentialHash]);
        return;
    }
    await database_1.pool.query(`INSERT INTO users (name, email, role, rank, region, division, territory, subterritory, sport_focus, credential_hash, credential_version, must_change_credential, status)
     VALUES ($1, $2, 'ADMIN', 'Admin', 'National', 'All', 'National', 'All', 'All', $3, 1, false, 'ACTIVE')`, ['Coach Bradshaw', 'owner@tuf.local', credentialHash]);
}
/**
 * Certify a user as having completed Academy training.
 * Only callable by users with INVITE_USER permission (Director+).
 */
async function certifyUser(userId, actor) {
    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'DIRECTOR' && actor.role !== 'REGIONAL_DIRECTOR')) {
        throw new Error('Only Director/Admin users can certify reps');
    }
    const result = await database_1.pool.query(`UPDATE users SET is_certified = true, director_signed_off = true, updated_at = NOW()
     WHERE id = $1 AND (role = 'REP' OR role = 'sales_rep')
     RETURNING id, name, email, role, rank, tier, region, state_market, division, territory, subterritory, sport_focus, assigned_director_id, reports_to_user_id, status, must_change_credential, is_certified, hr_docs_completed, director_signed_off, practical_exercise_completed, created_at, updated_at`, [userId]);
    if (!result.rows[0])
        throw new Error('User not found or cannot be certified');
    const certifiedUser = sanitizeUser(result.rows[0]);
    (0, audit_log_1.auditLog)({
        action: 'UPDATE',
        user_id: actor.id,
        resource_type: 'user',
        resource_id: userId,
        metadata: { action: 'certify_user' },
    }).catch(() => { });
    return certifiedUser;
}
//# sourceMappingURL=users.service.js.map