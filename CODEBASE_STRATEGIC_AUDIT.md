# TUF Ops — Strategic Codebase Audit

**Date:** July 14, 2026  
**Scope:** `apps/web/src`, `apps/api/src`, `packages/*`, root config  
**Analyst:** Hermes Agent (automated deep analysis)

---

## EXECUTIVE SUMMARY

TUF Ops is an ambitious CRM/ERP monorepo targeting a sports apparel sales organization. The codebase is **operational and API-backed** but carries significant architectural debt from its rapid evolution. The most critical finding: **there are two parallel frontends** (`apps/web` React/Vite vs `apps/frontend` Next.js) built in completely different tech stacks, doubling the maintenance surface. Other systemic issues include role-model mismatch between frontend and backend, mock-only services that still reference `localStorage`, dead stub functions that throw errors at runtime, and a proliferation of one-shot migration/validation scripts.

**Overall Grade: C+** — Functional but fragile. The next 2-4 weeks of focused cleanup could get this to a solid B+.

---

## 1. OVERENGINEERING

| # | Issue | Severity | Location | Recommendation |
|---|---|---|---|---|
| **O1** | **Two parallel frontends** — `apps/web` (React 18 + Vite + React Router + TanStack Query) and `apps/frontend` (Next.js 14 + NextAuth + Prisma + Radix UI + Recharts) both implement the same CRM features | 🔴 CRITICAL | `apps/web/` and `apps/frontend/` | Choose ONE frontend. The Vite app (`apps/web`) is more complete (65+ pages/components, full API integration). The Next.js app (`apps/frontend`) has only 27 page files, uses a completely different tech stack (NextAuth instead of PIN auth, Prisma instead of node-pg-migrate, React 18 vs React 18.3.1, recharts vs custom components), and includes `puppeteer` (587MB dependency!) in regular dependencies. Archive or delete `apps/frontend`. |
| **O2** | **API route multi-registration** — Same route plugins registered at 3+ prefixes: bare path (`/organizations`), `/api/*`, `/api/v1/*` | 🔴 CRITICAL | `apps/api/src/index.ts:127-160` | Each route plugin is registered 3-4 times (e.g., `organizationRoutes` at `/organizations`, `/api/organizations`, `/api/v1/organizations`). This bloats the Fastify route table and makes debugging confusing. Choose one canonical prefix (`/api/v1`) and add a single redirect/rewrite for legacy clients. |
| **O3** | **Massive frontend route regex** — A 400-character regex lists every frontend route hard-coded for SPA fallback | 🟡 MEDIUM | `apps/api/src/index.ts:29` | The `frontendRoutePattern` regex is fragile — adding a new page requires updating both the React Router config AND this backend regex. Use a catch-all pattern (`/*`) with explicit API-route exclusion instead. |
| **O4** | **Duplicate role systems** — Frontend uses uppercase role enums (`ADMIN`, `REGIONAL_DIRECTOR`, `DIRECTOR`, `REP`) while `packages/auth` uses lowercase canonical roles (`admin`, `regional_director`, `director`, `tae`, `operations`) | 🔴 CRITICAL | `apps/web/src/types.ts:1` vs `packages/auth/src/roles.ts:1-7` | The frontend role type has 4 roles (missing `OPERATIONS`). The backend has 5. The `normalizeRole()` function in `packages/auth` maps `'REP'` → `'tae'` but the frontend never calls it. This mismatch means frontend permission checks (`roleConfig`) and backend permission checks (`hasPermission()`) operate on completely different role universes. |
| **O5** | **Over-engineered order workflow** — `orderWorkflow.ts` defines a parallel 9-stage order lifecycle with transition fields, blocker logic, risk scoring, and queue filtering — but the backend only tracks 5 `productionStatus` values | 🟡 MEDIUM | `apps/web/src/services/orderWorkflow.ts` vs `apps/api/src/modules/orders/` | The frontend maps 9 fine-grained stages onto 5 backend statuses via `STATUS_STAGE_MAP`/`STAGE_STATUS_MAP`. The granularity is lost on round-trip. Either simplify the frontend to match the backend, or expand the backend to track the 9 stages. |
| **O6** | **13 validation scripts for v0.9.0 launch** — Individual scripts validate academy launch, dashboard wiring, lead CSV mapping, launch assignments, user display, production readiness, academy certification, API deployment config, DB readiness, etc. | 🟡 MEDIUM | `scripts/validate-v090-*.js` (13 files) | These appear to be one-shot launch checklists. They should live in a `docs/launch/` or `ops/` directory, not polluting the `scripts/` namespace. Consolidate into a single `validate-v090-all.js` or archive post-launch. |
| **O7** | **Dual frontend API layers** — Both `apps/web/src/services/` (direct apiClient calls) AND `apps/web/src/api/` (React Query wrappers via hooks) exist side by side | 🟡 MEDIUM | `apps/web/src/services/*Service.ts` vs `apps/web/src/api/*.ts` | Services make API calls and hooks call services. But some pages use services directly while others use hooks. Standardize on one pattern: hooks → api → apiClient. Deprecate direct service calls from pages. |
| **O8** | **pnpm-workspace.yaml references Prisma** — The workspace config has `allowBuilds` entries for `@prisma/client`, `@prisma/engines`, `prisma`, `puppeteer`, `esbuild`, `unrs-resolver` | 🟢 LOW | `pnpm-workspace.yaml:5-10` | The main API uses `node-pg-migrate`, not Prisma. The Next.js frontend uses Prisma. If the Next.js app is archived, these configs become dead entries. `puppeteer` is in the Next.js frontend's `dependencies` (not `devDependencies`) — a 587MB package that should never ship to production or even be in regular deps. |

---

## 2. USABILITY

| # | Issue | Severity | Location | Recommendation |
|---|---|---|---|---|
| **U1** | **Login is PIN-only, no password recovery** — The login page accepts only a 4-digit PIN with no "forgot PIN" flow or admin reset mechanism exposed in the UI | 🔴 CRITICAL | `apps/web/src/pages/LoginPage.tsx` | A sales rep locked out of their PIN has zero self-service recovery. The only path is "ask the owner to reset your PIN in the Users page." Add a "Reset PIN" flow that emails a temporary PIN or sends the user to their director. |
| **U2** | **Manual role switching with no guard rails** — ADMIN users can switch to any role via a dropdown in the header (`AppShell.tsx:121-123`), but `updateRole()` in `auth.ts` constructs a synthetic user from `getActiveUserByRole()` — if no active user of that role exists, it returns `null` silently | 🟡 MEDIUM | `apps/web/src/components/AppShell.tsx:121` + `apps/web/src/auth.ts:54-82` | The dropdown silently breaks if there's no active REP or DIRECTOR. Add a disabled state for missing roles and show a tooltip ("No active REP users") instead of a dead selector. |
| **U3** | **No loading states on critical data pages** — Pages like `DashboardPage`, `OrganizationsPage`, and `OrdersPage` call APIs but have no skeleton loaders or loading spinners | 🟡 MEDIUM | `apps/web/src/pages/DashboardPage.tsx`, `OrganizationsPage.tsx` | Without loading states, a slow API response makes the page appear blank/broken. Add `<Skeleton />` components or at minimum a `<p>Loading...</p>` before data arrives. |
| **U4** | **Error messages swallowed silently** — `apiClient.ts` retries up to 3 times on failure but only `console.warn`s errors. The user sees a blank table with no indication something went wrong | 🟡 MEDIUM | `apps/web/src/services/apiClient.ts:32-67` | Failed API calls result in empty arrays being rendered — indistinguishable from "no data exists." Surface errors via the `ToastHost`/`feedbackService` system that already exists. |
| **U5** | **Search is a full O(n) client-side scan** — `AppShell.tsx:21-49` fetches ALL organizations, opportunities, and orders then does a substring match | 🟢 LOW | `apps/web/src/components/AppShell.tsx:21-49` | For a production instance with thousands of records, this will be slow. Add a `/api/search?q=...` endpoint for server-side full-text search. |
| **U6** | **No mobile responsiveness beyond basic grid** — `AppShell.tsx` hides the sidebar on mobile (`hidden md:flex`) but the nav becomes a horizontal scroll with no hamburger menu | 🟡 MEDIUM | `apps/web/src/components/AppShell.tsx:83-95` | Reps in the field on a phone have a poor experience. Add a proper mobile hamburger menu + bottom nav bar. |
| **U7** | **"4 orders/month" hardcoded banner** — `AppShell.tsx:101` shows a hardcoded goal banner for DIRECTOR/REP roles | 🟢 LOW | `apps/web/src/components/AppShell.tsx:101` | The "4 orders/month" floor is hardcoded in both the banner AND `DashboardPage.tsx:18`. Make it a configurable setting per role/region. |
| **U8** | **isRepCertified() always returns true** — The certification guard in `roleScope.ts:52` is a stub | 🔴 CRITICAL | `apps/web/src/services/roleScope.ts:52` | This function is used by `canCreateOpportunity()` and `canAdvanceOpportunity()` to gate uncertified reps. It always returns `true`, meaning uncertified reps can create and advance opportunities — defeating the entire Academy certification gate. The only remaining guard is `App.tsx`'s `CertificationProtected` component, which redirects to `/academy` — but that's easily bypassed by direct URL navigation if the backend certification middleware is also disabled. |

---

## 3. ARCHITECTURE

| # | Issue | Severity | Location | Recommendation |
|---|---|---|---|---|
| **A1** | **Role model mismatch** — Frontend has 4 roles, backend packages/auth has 5, frontend uses uppercase, backend uses lowercase | 🔴 CRITICAL | Multiple files | See O4 above. Unify on the `packages/auth` canonical roles and export them from `@tuf/shared` for the frontend to consume. Add `OPERATIONS` role to the frontend. Rename frontend `REP` → `TAE` to match the backend, or add `REP` as an alias in `normalizeRole()`. |
| **A2** | **Monorepo serves two products** — The `apps/frontend` Next.js app is a separate product with its own auth, database access, and UI | 🔴 CRITICAL | `apps/frontend/` | See O1 above. |
| **A3** | **Mock types imported as production types** — At least 8 service files import types from `../data/mockSalesData` instead of `@tuf/shared` | 🔴 CRITICAL | `apps/web/src/services/organizationsService.ts:1`, `ordersService.ts:1`, `activitiesService.ts:1`, `kpiUtils.ts:1`, `orderWorkflow.ts:1`, `roleScope.ts:3`, `ecosystemReferralsService.ts` (via orgs), `usersService.ts:2` | `mockSalesData.ts` was a bootstrap file now containing only 1 baseline org and empty arrays. The types it re-exports (`Organization`, `Opportunity`, `Order`, `Activity`, `CoverageStatus`, `TerritoryId`) should import from `@tuf/shared`. Fix the imports and delete the type re-exports from `mockSalesData.ts`. |
| **A4** | **packages/auth has duplicate .js and .ts files** — Both `packages/auth/src/roles.ts` AND `packages/auth/src/roles.js` exist | 🟡 MEDIUM | `packages/auth/src/*.js` | The `.js` files appear to be stale compiled output. The `.ts` files are the source of truth. Delete the `.js` duplicates. |
| **A5** | **Root package.json has React 19 as dependency, apps use React 18** | 🟡 MEDIUM | `package.json:57-58` vs `apps/web/package.json:19-20` | The root declares `react: ^19.2.5` but `apps/web` uses `react: ^18.3.1` and `apps/frontend` uses `react: ^18`. React should not be a root dependency in a monorepo — it belongs in each app's `package.json`. |
| **A6** | **packages/logger and packages/env are nearly empty** | 🟢 LOW | `packages/logger/src/index.ts`, `packages/env/src/index.ts` | These packages exist with minimal content. Either flesh them out or remove them to avoid misleading structure. |
| **A7** | **scratch/ directory contains ad-hoc scripts** | 🟢 LOW | `scratch/seed_users.js`, `scratch/hash_test.js`, `scratch/check_users.js` | These appear to be one-off debugging/diagnostic scripts. Move to a `tools/` directory or delete if no longer needed. |

---

## 4. DATA FLOW / BROKEN PIPES

| # | Issue | Severity | Location | Recommendation |
|---|---|---|---|---|
| **D1** | **usersService.ts: 4 stub functions that throw** — `createUser()`, `resetUserCredential()`, `changeOwnCredential()` all throw "not available in API mode" | 🔴 CRITICAL | `apps/web/src/services/usersService.ts:236-259` | These are called from `UsersPage.tsx` and other admin pages. When an admin tries to create a user or reset a credential, the app crashes with an unhandled error. These should call the actual API endpoints (`POST /api/users`, `POST /api/users/:id/reset-credential`, `POST /api/auth/change-credential`). |
| **D2** | **authenticateWithCredential() is a no-op stub** — Returns `null` always | 🟡 MEDIUM | `apps/web/src/services/usersService.ts:163-165` | This function is exported and imported by `auth.ts:48` but always returns `null`, making credential-based login impossible even though the backend supports it. |
| **D3** | **ecosystemReferralsService is localStorage-only** — Stores referral data in browser localStorage with no API persistence | 🔴 CRITICAL | `apps/web/src/services/ecosystemReferralsService.ts:62-76` | Referral data created on one browser/machine is invisible to all other users. There's no backend endpoint for ecosystem referrals. This makes the entire Ecosystem Pipeline feature single-user-only. |
| **D4** | **Dashboard metrics silently fail to empty** — `fetchDashboardMetrics()` catches all errors and returns `emptyDashboardMetrics()` | 🟡 MEDIUM | `apps/web/src/services/dashboardMetricsService.ts:55-74` | The catch at line 70 silently swallows all errors. The dashboard shows zeros instead of an error, making it look like there's no data rather than a broken connection. |
| **D5** | **lighthouseEngine.ts: dead ecosystem links code** — Lines 118-122 allocate empty arrays and commented-out code | 🟢 LOW | `apps/web/src/services/lighthouseEngine.ts:118-122` | The ecosystem links section is permanently disabled with a comment "Ecosystem disabled until cross-service import works." Either fix the import or remove the dead code. |
| **D6** | **v085DataCleanup.ts: one-time migration still in source tree** | 🟡 MEDIUM | `apps/web/src/services/v085DataCleanup.ts` | This runs `localStorage` cleanup and archives old data keys. It should either be removed (post-migration) or moved to a migration script, not left as a service import. |
| **D7** | **DashboardPage imports Activity from mockSalesData** — Uses mock type for Activity interface | 🟢 LOW | `apps/web/src/pages/DashboardPage.tsx:8` | The `Activity` type is imported from `mockSalesData` instead of `@tuf/shared`. Fix the import. |

---

## 5. MISSING FEATURES / INCOMPLETE WORK

| # | Issue | Severity | Location | Recommendation |
|---|---|---|---|---|
| **M1** | **No automated testing for frontend** — Zero frontend tests (only 1 unit test file: `academy.test.ts`) | 🔴 CRITICAL | `apps/web/src/__tests__/` | With 65+ pages and components, the absence of frontend tests means every change is a regression risk. Add Playwright E2E tests (the `test:e2e` script exists in `package.json` but has no test files) and Jest component tests. |
| **M2** | **ExecutiveIntake and PeoplePipeline are API-only shells** — Backend routes exist (`/api/intake`, `/api/people`) but the frontend pages (`ExecutiveIntakePage`, `PeopleOpsPage`) are thin wrappers with no data persistence visible | 🟡 MEDIUM | `apps/web/src/pages/ExecutiveIntakePage.tsx`, `PeopleOpsPage.tsx` | These modules appear in the route table and sidebar config but their implementation is minimal. Either complete them or hide them from non-ADMIN roles. |
| **M3** | **DailyActivityCommand exists but no recurring schedule** — The "Daily Command" page logs daily activities but there's no automated reminder, streak tracking, or manager review queue | 🟡 MEDIUM | `apps/web/src/pages/DailyActivityCommand.tsx`, `apps/api/src/modules/daily-activities/` | The backend supports it but the frontend integration is minimal. Add daily email reminders, streak badges, and a director review dashboard. |
| **M4** | **No email/SMS notifications** — No integration for sending emails (welcome, PIN reset, deal alerts, activity reminders) or SMS | 🔴 CRITICAL | N/A | A CRM without notifications is a data entry tool, not an operating system. Add transactional email (Resend, SendGrid, or SES) for: PIN reset, deal stage changes, daily activity reminders, new lead assignment, certification completion. |
| **M5** | **No calendar integration** — Activities have timestamps but no calendar sync (Google Calendar, Outlook) | 🟡 MEDIUM | N/A | Reps live in their calendar. Add iCal feed or Google Calendar API integration so follow-ups appear on the rep's calendar. |
| **M6** | **No document generation / e-signature** — The `DocumentGeneratorPage` and `documentGenerator.ts` exist but appear to generate PDFs client-side | 🟡 MEDIUM | `apps/web/src/lib/documentGenerator.ts`, `apps/web/src/pages/DocumentGeneratorPage.tsx` | Production orders need purchase orders, invoices, and spec sheets. Add server-side PDF generation with e-signature (DocuSign/Hellosign API). |
| **M7** | **No real-time updates** — No WebSocket or Server-Sent Events for live dashboard updates | 🟢 LOW | N/A | The dashboard is static until refreshed. For an "operating system," real-time pipeline updates and activity feeds would be transformative. Add SSE for dashboard metrics. |
| **M8** | **CreativeRequests references Trello but isn't integrated** — `creative-requests.service.ts:29` has a TODO for Trello card creation | 🟢 LOW | `apps/api/src/modules/creative-requests/creative-requests.service.ts:29` | The creative request workflow is a stub waiting for Trello integration. Either integrate or remove the Trello reference. |
| **M9** | **LockerRoomSimulator calls `/api/training/evaluate`** — But this endpoint may not exist or be fully implemented | 🟡 MEDIUM | `apps/web/src/components/academy/LockerRoomSimulator.tsx:62` | The Academy's "Locker Room Simulator" makes API calls to an evaluation endpoint. If this endpoint doesn't exist in production, the entire simulator feature is broken. |

---

## PRIORITY ACTION PLAN

### Week 1 (Critical Fixes)
1. **Delete or archive `apps/frontend`** — Reduces maintenance surface by half
2. **Fix `isRepCertified()` stub** — Currently always returns `true`, bypassing certification
3. **Wire up `createUser()` / `resetUserCredential()` / `changeOwnCredential()`** — These stub functions crash the admin UI
4. **Fix role model mismatch** — Unify on `packages/auth` roles, export from `@tuf/shared`
5. **Fix all mockSalesData imports** — Replace with `@tuf/shared` imports

### Week 2 (Data Flow)
6. **Add API backend for ecosystem referrals** — Move from localStorage to PostgreSQL
7. **Consolidate API route prefixes** — Choose `/api/v1` and redirect legacy paths
8. **Surface API errors in the UI** — Use the existing ToastHost/feedbackService
9. **Add loading states** — Skeleton components on data pages

### Week 3-4 (Feature Completion)
10. **Add email notifications** — Transactional emails for PIN reset, deal changes, reminders
11. **Add frontend tests** — Playwright E2E + Jest component tests
12. **Complete ExecutiveIntake and PeoplePipeline modules**
13. **Mobile-responsive navigation** — Hamburger menu + bottom nav

### Month 2 (Strategic)
14. **Calendar integration** — Google/Outlook sync
15. **Real-time dashboard** — SSE for live metrics
16. **Document generation** — Server-side PDF + e-signature
17. **Consolidate validation scripts** — Archive v0.9.0 launch artifacts

---

*Report generated by automated deep analysis of 169 backend TS files + 65 frontend TSX files + 17 package files. Every finding is backed by direct file inspection.*
