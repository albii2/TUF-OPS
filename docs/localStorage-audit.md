# localStorage Audit — TUF-OPS Web App

**Scope:** `apps/web/src/`
**Date:** 2026-07-16
**Auditor:** Hermes Agent

## Summary

| Total Keys | ✅ UI State | ⚠️ Mixed | ❌ Forbidden |
|------------|------------|---------|-------------|
| 11 | 2 | 0 | 9 |

**Critical finding:** 9 of 11 localStorage keys store business data that must be migrated to server-side storage. Only 2 keys (`tuf_combine_sandbox_active`, `tuf_academy_visited_pages`) are pure UI state.

---

## Full Audit Table

### Key: `tuf_ops_token_v1`

| Key | File:Line | Value Stored | Classification | Action |
|-----|-----------|-------------|----------------|--------|
| `tuf_ops_token_v1` | `auth.ts:14` (getItem) | Auth token (JWT/session token) | ❌ Forbidden | Migrate to httpOnly cookie or in-memory-only with refresh |
| `tuf_ops_token_v1` | `auth.ts:18` (setItem) | Auth token on login | ❌ Forbidden | Migrate to httpOnly cookie or in-memory-only with refresh |
| `tuf_ops_token_v1` | `auth.ts:26` (removeItem) | Clear token on logout | ❌ Forbidden | Migrate to httpOnly cookie or in-memory-only with refresh |

### Key: `tuf_ops_user_v3` (legacy key — used for migration + direct reads elsewhere)

| Key | File:Line | Value Stored | Classification | Action |
|-----|-----------|-------------|----------------|--------|
| `tuf_ops_user_v3` | `auth.ts:20` (getItem) | Migration check — read once on login | ❌ Forbidden | Remove after migration complete |
| `tuf_ops_user_v3` | `auth.ts:21` (removeItem) | Cleanup after migration | ❌ Forbidden | Remove after migration complete |
| `tuf_ops_user_v3` | `academy.ts:1454` (getItem) | Full AppUser object to read `isCertified` | ❌ Forbidden | Read from in-memory cache or API |
| `tuf_ops_user_v3` | `academy.ts:1459` (setItem) | Mutate user object to toggle `isCertified` | ❌ Forbidden | Call server endpoint only; localStorage is not source of truth |
| `tuf_ops_user_v3` | `academy.ts:1491` (getItem) | Auth token for certify API call | ❌ Forbidden | Use in-memory token, not localStorage |
| `tuf_ops_user_v3` | `academy.ts:1556` (getItem) | Read user during cert reset | ❌ Forbidden | Read from in-memory cache or API |
| `tuf_ops_user_v3` | `academy.ts:1561` (setItem) | Reset `isCertified` flag during full reset | ❌ Forbidden | Call server endpoint only |
| `tuf_ops_user_v3` | `useTrainingEnrollment.ts:458` (getItem) | Read user role | ❌ Forbidden | Read from in-memory cache |
| `tuf_ops_user_v3` | `useTrainingEnrollment.ts:520` (getItem) | Read user role for auto-enroll | ❌ Forbidden | Read from in-memory cache |
| `tuf_ops_user_v3` | `useTrainingEnrollment.ts:601` (getItem) | Read user ID | ❌ Forbidden | Read from in-memory cache |
| `tuf_ops_user_v3` | `useTrainingEnrollment.ts:666` (getItem) | Read user for certification gate check | ❌ Forbidden | Read from in-memory cache |
| `tuf_ops_user_v3` | `useTrainingEnrollment.ts:674` (setItem) | Set `isCertified` on user when training = 100% | ❌ Forbidden | Call server endpoint; localStorage is not source of truth |

### Key: `tuf_ops_users_v7`

| Key | File:Line | Value Stored | Classification | Action |
|-----|-----------|-------------|----------------|--------|
| `tuf_ops_users_v7` | `academy.ts:1466` (getItem) | All user objects (for cert status update) | ❌ Forbidden | Server is source of truth; remove entirely |
| `tuf_ops_users_v7` | `academy.ts:1472` (setItem) | Updated users array | ❌ Forbidden | Server is source of truth; remove entirely |
| `tuf_ops_users_v7` | `academy.ts:1569` (getItem) | All users for cert reset | ❌ Forbidden | Server is source of truth; remove entirely |
| `tuf_ops_users_v7` | `academy.ts:1577` (setItem) | Reset `isCertified` on all REP users | ❌ Forbidden | Server is source of truth; remove entirely |

### Key: `tuf_academy_certification`

| Key | File:Line | Value Stored | Classification | Action |
|-----|-----------|-------------|----------------|--------|
| `tuf_academy_certification` | `academy.ts:1238` (getItem) | `Record<userId, CertificationRecord>` — certification truth | ❌ Forbidden | **CRITICAL.** This is certification truth data. Must be server-authoritative. Migrate to DB. |
| `tuf_academy_certification` | `academy.ts:1252` (getItem) | Certification records for save operation | ❌ Forbidden | Migrate to server API |
| `tuf_academy_certification` | `academy.ts:1265` (setItem) | Persist certification record (including `isLevel1Certified`) | ❌ Forbidden | Migrate to server API |
| `tuf_academy_certification` | `academy.ts:1273` (getItem) | Get all certification records | ❌ Forbidden | Migrate to server API |

### Key: `tuf_academy_submission`

| Key | File:Line | Value Stored | Classification | Action |
|-----|-----------|-------------|----------------|--------|
| `tuf_academy_submission` | `academy.ts:1306` (getItem) | `Record<userId, CertificationSubmission>` | ❌ Forbidden | Migrate to server/DB |
| `tuf_academy_submission` | `academy.ts:1348` (getItem) | All submissions (for append) | ❌ Forbidden | Migrate to server/DB |
| `tuf_academy_submission` | `academy.ts:1353` (setItem) | Save submission | ❌ Forbidden | Migrate to server/DB |
| `tuf_academy_submission` | `academy.ts:1363` (getItem) | Read all submissions (director view) | ❌ Forbidden | Migrate to server/DB |
| `tuf_academy_submission` | `academy.ts:1375` (getItem) | Check for submission existence | ❌ Forbidden | Migrate to server/DB |
| `tuf_academy_submission` | `academy.ts:1379` (setItem) | Delete one submission | ❌ Forbidden | Migrate to server/DB |

### Key: `tuf_academy_quiz_results`

| Key | File:Line | Value Stored | Classification | Action |
|-----|-----------|-------------|----------------|--------|
| `tuf_academy_quiz_results` | `academy.ts:746` (getItem) | `Record<moduleCode, QuizResult>` — quiz scores, pass/fail, attempts | ❌ Forbidden | Migrate to server/DB |
| `tuf_academy_quiz_results` | `academy.ts:763` (setItem) | Save quiz result | ❌ Forbidden | Migrate to server/DB |

### Key: `tuf_academy_coach_reviews`

| Key | File:Line | Value Stored | Classification | Action |
|-----|-----------|-------------|----------------|--------|
| `tuf_academy_coach_reviews` | `academy.ts:836` (getItem) | `Record<moduleCode, CoachReview>` — director feedback | ❌ Forbidden | Migrate to server/DB |
| `tuf_academy_coach_reviews` | `academy.ts:853` (setItem) | Save coach review | ❌ Forbidden | Migrate to server/DB |

### Key: `tuf_academy_acknowledgments`

| Key | File:Line | Value Stored | Classification | Action |
|-----|-----------|-------------|----------------|--------|
| `tuf_academy_acknowledgments` | `academy.ts:865` (getItem) | `Record<userId, moduleCode[]>` — acknowledged modules | ❌ Forbidden | Migrate to server/DB |
| `tuf_academy_acknowledgments` | `academy.ts:880` (getItem) | Read for append | ❌ Forbidden | Migrate to server/DB |
| `tuf_academy_acknowledgments` | `academy.ts:885` (setItem) | Save acknowledgment | ❌ Forbidden | Migrate to server/DB |

### Key: `tuf_academy_mission_statement`

| Key | File:Line | Value Stored | Classification | Action |
|-----|-----------|-------------|----------------|--------|
| `tuf_academy_mission_statement` | `academy.ts:806` (getItem) | `Record<userId, string>` — mission statement text | ❌ Forbidden | Migrate to server/DB |
| `tuf_academy_mission_statement` | `academy.ts:817` (getItem) | Read for save | ❌ Forbidden | Migrate to server/DB |
| `tuf_academy_mission_statement` | `academy.ts:820` (setItem) | Save mission statement | ❌ Forbidden | Migrate to server/DB |

### Key: `tuf_ops_training_v1_{userId}` (dynamic per-user key)

| Key | File:Line | Value Stored | Classification | Action |
|-----|-----------|-------------|----------------|--------|
| `tuf_ops_training_v1_{userId}` | `useTrainingEnrollment.ts:543` (setItem) | Full `TrainingEnrollmentWithProgress` — cached API response | ❌ Forbidden | Use SWR/React Query with in-memory cache; do not persist business data |
| `tuf_ops_training_v1_{userId}` | `useTrainingEnrollment.ts:550` (getItem) | Read cached enrollment | ❌ Forbidden | Use proper client-side cache library |
| `tuf_ops_training_v1_{userId}` | `useTrainingEnrollment.ts:556` (removeItem) | Invalidate stale cache | ❌ Forbidden | Use proper cache invalidation |
| `tuf_ops_training_v1_{userId}` | `useTrainingEnrollment.ts:559` (setItem) | Write fallback enrollment data | ❌ Forbidden | Server should be source of truth |
| `tuf_ops_training_v1_{userId}` | `useTrainingEnrollment.ts:569` (setItem) | Write fallback enrollment (no cache hit) | ❌ Forbidden | Server should be source of truth |
| `tuf_ops_training_v1_{userId}` | `useTrainingEnrollment.ts:614` (getItem) | Read for progress update | ❌ Forbidden | Use in-memory state or API |
| `tuf_ops_training_v1_{userId}` | `useTrainingEnrollment.ts:687` (setItem) | Persist updated progress | ❌ Forbidden | Save to server, not localStorage |
| `tuf_ops_training_v1_{userId}` | `useTrainingEnrollment.ts:748` (getItem) | Read for quiz grading | ❌ Forbidden | Use in-memory state or API |

### Key: `tuf_combine_sandbox_active`

| Key | File:Line | Value Stored | Classification | Action |
|-----|-----------|-------------|----------------|--------|
| `tuf_combine_sandbox_active` | `TrainingPortalPage.tsx:81` (setItem) | String `'true'` — tour/walkthrough state flag | ✅ UI state | Permitted. Controls interactive onboarding tour. |

### Key: `tuf_academy_visited_pages`

| Key | File:Line | Value Stored | Classification | Action |
|-----|-----------|-------------|----------------|--------|
| `tuf_academy_visited_pages` | `academy.ts:1511` (getItem) | `Set<string>` — page URLs visited | ✅ UI state | Permitted (marked as deprecated but harmless). |

### Bulk Removals

| Key | File:Line | Operation | Classification | Action |
|-----|-----------|----------|----------------|--------|
| ALL_CERT_KEYS (6 keys) | `academy.ts:1547` (removeItem) | Bulk clear of all cert-related keys in `resetAllCertifications()` | ❌ Forbidden | Replace with server API call to reset certs |
| ALL keys | `academy.test.ts:68` (clear) | Test teardown | — (test only) | Permitted — test isolation |

---

## Key-by-Key Migration Priority

| Priority | Key | Risk if Unaddressed |
|----------|-----|---------------------|
| 🔴 **P0** | `tuf_academy_certification` | Certification truth can be tampered with via DevTools |
| 🔴 **P0** | `tuf_ops_token_v1` | Auth token exposed to XSS; can be stolen |
| 🔴 **P0** | `tuf_ops_user_v3` | User object (including `isCertified`) is mutable client-side |
| 🔴 **P0** | `tuf_ops_users_v7` | Entire user list stored client-side |
| 🟠 **P1** | `tuf_academy_submission` | Certification submissions mutable client-side |
| 🟠 **P1** | `tuf_academy_quiz_results` | Quiz results can be forged |
| 🟠 **P1** | `tuf_academy_acknowledgments` | Module completion can be forged |
| 🟡 **P2** | `tuf_academy_coach_reviews` | Director feedback mutable client-side |
| 🟡 **P2** | `tuf_academy_mission_statement` | Exercise data mutable client-side |
| 🟡 **P2** | `tuf_ops_training_v1_{userId}` | Training progress mutable client-side |

---

## Files Requiring Changes

| File | Forbidden localStorage Calls | Primary Remediation |
|------|------------------------------|---------------------|
| `apps/web/src/auth.ts` | 3 (`tuf_ops_token_v1` set/get/remove) | Use httpOnly cookie + in-memory cache |
| `apps/web/src/lib/academy.ts` | 31 (across 9 keys) | Replace all with API calls to server |
| `apps/web/src/hooks/useTrainingEnrollment.ts` | 13 (across 2 keys) | Replace with API + in-memory cache (SWR/React Query) |

---

## Notes

- The `auth.ts` file has already been partially migrated — it now uses an in-memory `cachedUser` variable and only stores the auth token in localStorage. However, the token should move to an httpOnly cookie to prevent XSS exfiltration.
- The `tuf_ops_user_v3` key is referenced as a string literal in `academy.ts` and `useTrainingEnrollment.ts` rather than importing the constant from `auth.ts`, creating a tight coupling that will need unwinding during migration.
- `tuf_academy_visited_pages` is explicitly marked as deprecated in code comments — it can be removed entirely when the migration is done.
- The `resetAllCertifications()` function in `academy.ts` does a bulk `removeItem` across 6 cert keys AND mutates user objects — this entire function must be replaced with a server-side reset endpoint.
