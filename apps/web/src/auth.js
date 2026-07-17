import { authenticateWithCredential, authenticateWithPin, getActiveUserByRole } from './services/usersService';
import { seedExecutiveProfile } from './lib/achievements';
const TOKEN_KEY = 'tuf_ops_token_v1';
const LEGACY_USER_KEY = 'tuf_ops_user_v3';
const ALLOWED_ROLES = ['ADMIN', 'REGIONAL_DIRECTOR', 'DIRECTOR', 'REP', 'OPERATIONS'];
// ── In-memory cache (volatile, rebuilt from server on each page load) ──
let cachedUser = null;
// ── Token management ──
export function getStoredToken() {
    return localStorage.getItem(TOKEN_KEY);
}
function persistToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
    // Migrate from legacy key on first successful login
    if (localStorage.getItem(LEGACY_USER_KEY)) {
        localStorage.removeItem(LEGACY_USER_KEY);
    }
}
export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    cachedUser = null;
}
// ── Synchronous user access (from in-memory cache only) ──
export function getStoredUser() {
    return cachedUser;
}
// ── Server-authoritative identity ──
export async function fetchCurrentUser() {
    const token = getStoredToken();
    if (!token) {
        cachedUser = null;
        return null;
    }
    try {
        const res = await fetch('/api/auth/me', {
            headers: { ['Authorization']: 'Bearer ' + token },
        });
        if (!res.ok) {
            cachedUser = null;
            clearToken();
            return null;
        }
        const data = await res.json();
        const user = data.user || data;
        const appUser = {
            id: String(user.id),
            name: user.name || '',
            email: user.email || '',
            role: user.role === 'OWNER' ? 'ADMIN' : user.role,
            rank: user.rank ?? null,
            tier: user.tier ?? null,
            region: user.region ?? null,
            state_market: user.state_market ?? null,
            division: user.division ?? null,
            territory: user.territory ?? null,
            subterritory: user.subterritory ?? null,
            sport_focus: user.sport_focus ?? null,
            assigned_director_id: user.assigned_director_id ?? null,
            reports_to_user_id: user.reports_to_user_id ?? null,
            mustChangeCredential: Boolean(user.must_change_credential ?? user.mustChangeCredential),
            hrDocsCompleted: Boolean(user.hr_docs_completed ?? user.hrDocsCompleted),
            directorSignedOff: Boolean(user.director_signed_off ?? user.directorSignedOff),
            practicalExerciseCompleted: Boolean(user.practical_exercise_completed ?? user.practicalExerciseCompleted),
            isCertified: Boolean(user.is_certified ?? user.isCertified),
        };
        cachedUser = appUser;
        window.dispatchEvent(new CustomEvent('tuf:user-updated', { detail: appUser }));
        return appUser;
    }
    catch {
        cachedUser = null;
        return null;
    }
}
// ── Login ──
export async function loginWithPin(pin) {
    try {
        const result = await authenticateWithPin(pin);
        if (!result)
            return null;
        // Store token, not user object
        if (result.token)
            persistToken(result.token);
        // Also populate in-memory cache from the result
        cachedUser = result;
        if (result.role === 'ADMIN')
            seedExecutiveProfile(result.id);
        window.dispatchEvent(new CustomEvent('tuf:user-updated', { detail: result }));
        return result;
    }
    catch {
        return null;
    }
}
export async function loginWithCredential(emailOrName, credential) {
    const matched = await authenticateWithCredential(emailOrName, credential);
    if (!matched)
        return null;
    if (matched.token)
        persistToken(matched.token);
    cachedUser = matched;
    window.dispatchEvent(new CustomEvent('tuf:user-updated', { detail: matched }));
    return matched;
}
// ── Role switching ──
export function updateRole(role) {
    const existing = cachedUser;
    if (!existing)
        return null;
    if (existing.role === role)
        return existing;
    const active = getActiveUserByRole(role);
    if (!active)
        return null;
    const updated = {
        id: active.id,
        name: active.displayName,
        email: active.email,
        role,
        rank: active.rank ?? null,
        tier: active.tier ?? null,
        region: active.region ?? null,
        state_market: active.state_market ?? null,
        division: active.division ?? null,
        territory: active.territory ?? null,
        subterritory: active.subterritory ?? null,
        sport_focus: active.sport_focus ?? null,
        assigned_director_id: active.assignedDirectorId ? Number(active.assignedDirectorId.replace(/\D/g, '')) : null,
        reports_to_user_id: active.reports_to_user_id ? Number(active.reports_to_user_id.replace(/\D/g, '')) : null,
        mustChangeCredential: active.mustChangeCredential,
        hrDocsCompleted: active.hrDocsCompleted,
        directorSignedOff: active.directorSignedOff,
        practicalExerciseCompleted: active.practicalExerciseCompleted,
        isCertified: active.isCertified,
    };
    cachedUser = updated;
    window.dispatchEvent(new CustomEvent('tuf:user-updated', { detail: updated }));
    return updated;
}
export function updateStoredUser(user) {
    cachedUser = user;
    window.dispatchEvent(new CustomEvent('tuf:user-updated', { detail: user }));
    return user;
}
export function logout() {
    clearToken();
    cachedUser = null;
    window.dispatchEvent(new CustomEvent('tuf:user-updated', { detail: null }));
}
//# sourceMappingURL=auth.js.map