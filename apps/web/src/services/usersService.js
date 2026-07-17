import { apiClient } from './apiClient';
import { getApiBaseUrl } from './apiBaseUrl';
const TRAINING_API_BASE_URL = `${getApiBaseUrl()}/training`;
const COLORS = ['#1FB6FF', '#22C55E', '#F59E0B', '#A855F7', '#EF4444', '#14B8A6'];
function initials(name) {
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}
// ============================================================================
// USER LIST — API-backed
// ============================================================================
let cachedUsers = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 30_000;
function normalizeApiUser(raw) {
    return {
        id: String(raw.id),
        firstName: raw.first_name || raw.firstName || '',
        lastName: raw.last_name || raw.lastName || '',
        displayName: raw.display_name || raw.name || `${raw.first_name || ''} ${raw.last_name || ''}`.trim(),
        email: raw.email || '',
        role: (raw.role === 'OWNER' ? 'ADMIN' : raw.role === 'OPS' ? 'OPERATIONS' : raw.role),
        rank: raw.rank || null,
        tier: raw.tier || null,
        region: raw.region || null,
        state_market: raw.state_market || null,
        division: raw.division || null,
        territory: raw.territory || '',
        subterritory: raw.subterritory || null,
        sport_focus: raw.sport_focus || null,
        assignedDirectorId: raw.assigned_director_id ? String(raw.assigned_director_id) : undefined,
        reports_to_user_id: raw.reports_to_user_id ? String(raw.reports_to_user_id) : null,
        status: raw.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        avatarColor: COLORS[Number(raw.id) % COLORS.length],
        mustChangeCredential: Boolean(raw.must_change_credential),
        hrDocsCompleted: Boolean(raw.hr_docs_completed),
        directorSignedOff: Boolean(raw.director_signed_off),
        practicalExerciseCompleted: Boolean(raw.practical_exercise_completed),
        isCertified: Boolean(raw.is_certified),
    };
}
async function fetchUsersFromApi() {
    try {
        const raw = await apiClient('/users');
        const list = Array.isArray(raw) ? raw : (raw?.users || []);
        return list.map(normalizeApiUser);
    }
    catch {
        console.warn('[usersService] Failed to fetch users from API');
        return [];
    }
}
export async function listUsersAsync() {
    const now = Date.now();
    if (cachedUsers && now < cacheExpiry)
        return cachedUsers;
    cachedUsers = await fetchUsersFromApi();
    cacheExpiry = now + CACHE_TTL_MS;
    return cachedUsers;
}
// Sync wrapper for components that can't easily become async
let syncUserCache = [];
let syncCacheLoading = false;
export function listUsers() {
    if (!syncCacheLoading && syncUserCache.length === 0) {
        syncCacheLoading = true;
        listUsersAsync().then((users) => {
            syncUserCache = users;
            syncCacheLoading = false;
        }).catch(() => {
            syncCacheLoading = false;
        });
    }
    return syncUserCache;
}
// ============================================================================
// AUTHENTICATION — API only
// ============================================================================
export async function authenticateWithPin(pin) {
    try {
        const result = await apiClient('/auth/login', {
            method: 'POST',
            body: { credential: pin },
        });
        const backendUser = result.user;
        const appUser = {
            id: String(backendUser.id),
            name: String(backendUser.name || ''),
            email: String(backendUser.email || ''),
            role: (backendUser.role === 'OWNER' ? 'ADMIN' : backendUser.role === 'OPS' ? 'OPERATIONS' : String(backendUser.role)),
            rank: (backendUser.rank || null),
            tier: (backendUser.tier || null),
            region: (backendUser.region || null),
            state_market: (backendUser.state_market || null),
            division: (backendUser.division || null),
            territory: (backendUser.territory || null),
            subterritory: (backendUser.subterritory || null),
            sport_focus: (backendUser.sport_focus || null),
            assigned_director_id: typeof backendUser.assigned_director_id === 'number' ? backendUser.assigned_director_id : null,
            reports_to_user_id: typeof backendUser.reports_to_user_id === 'number' ? backendUser.reports_to_user_id : null,
            mustChangeCredential: Boolean(backendUser.must_change_credential),
            hrDocsCompleted: Boolean(backendUser.hr_docs_completed),
            directorSignedOff: Boolean(backendUser.director_signed_off),
            practicalExerciseCompleted: Boolean(backendUser.practical_exercise_completed),
            isCertified: Boolean(backendUser.is_certified),
        };
        appUser.token = result.token;
        return appUser;
    }
    catch {
        console.error('[auth] Backend login failed');
        return null;
    }
}
// Stub — credential-based auth is not supported in API mode
export async function authenticateWithCredential(_emailOrName, _credential) {
    return null;
}
// ============================================================================
// ROLE / TERRITORY HELPERS
// ============================================================================
export function getActiveUserByRole(role) {
    return syncUserCache.find((u) => u.role === role && u.status === 'ACTIVE');
}
export function getManagedRepNamesForDirector(directorName) {
    const users = syncUserCache;
    const director = users.find((u) => u.displayName === directorName && u.role === 'DIRECTOR');
    if (!director)
        return [];
    return users
        .filter((u) => u.role === 'REP' && u.status === 'ACTIVE' && u.assignedDirectorId === director.id)
        .map((u) => u.displayName);
}
export function getManagedTerritoriesForDirector(directorName) {
    const users = syncUserCache;
    const director = users.find((u) => u.displayName === directorName && u.role === 'DIRECTOR');
    if (!director?.territory)
        return [];
    return director.territory
        .split(/[\\/,]/)
        .map((territory) => territory.trim().toLowerCase())
        .filter((territory) => ['metro', 'north', 'west', 'south'].includes(territory));
}
// ============================================================================
// TRAINING TOGGLES — API only
// ============================================================================
export async function toggleUserHrDocs(id, hrDocsCompleted) {
    const response = await fetch(`${TRAINING_API_BASE_URL}/reps/${id}/hr-docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hrDocsCompleted }),
    });
    if (!response.ok) {
        throw new Error(`Failed to toggle HR docs: ${response.status}`);
    }
}
export async function toggleUserPracticalExercise(id, practicalExerciseCompleted) {
    const response = await fetch(`${TRAINING_API_BASE_URL}/reps/${id}/practical-exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ practicalExerciseCompleted }),
    });
    if (!response.ok) {
        throw new Error(`Failed to toggle practical exercise: ${response.status}`);
    }
}
export async function toggleUserDirectorSignoff(id, directorSignedOff) {
    const response = await fetch(`${TRAINING_API_BASE_URL}/reps/${id}/director-signoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directorSignedOff }),
    });
    if (!response.ok) {
        throw new Error(`Failed to toggle director signoff: ${response.status}`);
    }
}
// ============================================================================
// STUBS — wired to API above, kept for reference
// ============================================================================
export async function createUser(input, _actor) {
    const payload = {
        name: `${input.firstName} ${input.lastName}`.trim(),
        role: input.role,
    };
    if (input.email)
        payload.email = input.email;
    if (input.territory)
        payload.territory = input.territory;
    if (input.assignedDirectorId)
        payload.assigned_director_id = Number(input.assignedDirectorId);
    if (input.status)
        payload.status = input.status;
    const result = await apiClient('/users', {
        method: 'POST',
        body: payload,
    });
    return { user: normalizeApiUser(result.user), temporaryCredential: result.temporaryCredential };
}
export async function updateUser(id, patch, _actor) {
    return apiClient(`/users/${id}`, {
        method: 'PUT',
        body: patch,
    });
}
export async function resetUserCredential(id, _actor) {
    const result = await apiClient(`/users/${id}/reset-credential`, {
        method: 'POST',
    });
    return { user: normalizeApiUser(result.user), temporaryCredential: result.temporaryCredential };
}
export async function changeOwnCredential(userId, currentCredential, newCredential) {
    const result = await apiClient('/users/me/change-credential', {
        method: 'POST',
        body: { current_credential: currentCredential, new_credential: newCredential },
    });
    return { mustChangeCredential: result.user.must_change_credential };
}
export function generateTemporaryCredential() {
    return String(Math.floor(1000 + Math.random() * 9000));
}
// ============================================================================
// FORMAT HELPERS
// ============================================================================
export function avatarInitials(displayName) { return initials(displayName); }
export function formatUserDisplay(user) {
    if (user.role === 'ADMIN') {
        return `Admin · ${user.region || 'National'}`;
    }
    if (user.role === 'REGIONAL_DIRECTOR') {
        return `Regional Director · ${user.region || 'Midwest'}`;
    }
    if (user.role === 'DIRECTOR') {
        const parts = ['Director'];
        if (user.state_market) {
            if (user.division) {
                parts.push(`${user.state_market} ${user.division}`);
            }
            else {
                parts.push(user.state_market);
            }
        }
        if (user.subterritory)
            parts.push(user.subterritory);
        return parts.join(' · ');
    }
    if (user.role === 'OPERATIONS') {
        return `Operations · ${user.region || 'National'}`;
    }
    // REP:
    const parts = ['Rep'];
    if (user.state_market) {
        if (user.division) {
            parts.push(`${user.state_market} ${user.division}`);
        }
        else {
            parts.push(user.state_market);
        }
    }
    const territoryPart = user.subterritory || user.territory;
    if (territoryPart)
        parts.push(territoryPart);
    return parts.join(' · ');
}
export function seedBaselineUsers() {
    // No-op in API mode
}
//# sourceMappingURL=usersService.js.map