# TUF Ops v0.2.4 Hardening Deep Dive (April 14, 2026)

## Objective

This document maps the current core system behavior so v0.2.4 can be treated as a stable baseline for the next iteration (v0.2.5).

## 1) Core Runtime and Build Health

### Monorepo build target
- Active app package: `apps/frontend`.
- Verified build path: `pnpm --filter frontend build`.

### Stabilization updates made
- Removed stale T3/tRPC scaffold files that referenced unresolved aliases and packages, which blocked compilation.
- Removed duplicate/invalid UI component tree under `apps/frontend/@/...` that introduced type/module conflicts.
- Corrected duplicate icon import and missing `cn` utility import in sidebar component.

## 2) Authentication and Login Map

### Auth provider and session strategy
- NextAuth handler route: `src/app/api/auth/[...nextauth]/route.ts`.
- Auth config: `src/lib/auth/auth-options.ts`.
- Current provider: `CredentialsProvider` with Prisma-backed user lookup.
- Password validation: `bcrypt.compare` against `users.password_hash`.
- Session mode: JWT (`session.strategy = "jwt"`).

### Session claims flow
1. User submits credentials from `/auth/signin`.
2. `authorize` validates email/password and returns `{ id, email, name, role, managerId }`.
3. `jwt` callback stores `id`, `role`, `managerId` in token.
4. `session` callback projects those claims onto `session.user`.

### Route protection helpers
- `requireSession()` enforces sign-in and redirects unauthenticated users to `/auth/signin`.
- `requireRole()` enforces role gates and redirects unauthorized users to `/forbidden`.

## 3) Registration Flow (Fixed in v0.2.4)

### Previous risk
- Registration page posted to `/api/auth/register`, but no API route existed.
- Client payload used invalid role label (`sales_rep`) not present in Prisma enum.

### Implemented flow
- Added `POST /api/auth/register` route.
- Validates email/password presence and minimum password length.
- Normalizes email to lowercase.
- Rejects duplicate email.
- Hashes password with bcrypt.
- Creates user with default role `rep`.
- Returns only safe user profile fields.

## 4) Database URL and Data Access Map

### Connection source
- Prisma client instantiation: `src/lib/prisma.ts`.
- Database URL comes from `DATABASE_URL` (Prisma schema datasource + runtime env).

### Expected env keys (effective runtime)
- `DATABASE_URL` (required for db-backed operations).
- `NEXTAUTH_SECRET` (used by NextAuth config).
- `NEXTAUTH_URL` (recommended for local and deployed callback consistency).

### Access layer shape
- Most server code directly uses `prisma` (query/mutation functions and route handlers).
- Role-filtered opportunity visibility is centralized in `src/lib/auth/visibility.ts`.

## 5) Core Business Workflow Map

### A) Login-to-app workflow
1. Root `/` checks `getServerSession`.
2. Authenticated user -> `/dashboard`; anonymous user -> `/auth/signin`.

### B) Organization workflow
- List/create API: `GET/POST /api/organizations` (session required).
- Detail API: `GET /api/organizations/[id]` now session-protected in v0.2.4.
- Server actions update ownership and details, then revalidate:
  - `/organizations`
  - `/organizations/[id]`
  - `/dashboard`

### C) Opportunity workflow
- Create: server action validates with Zod then inserts Prisma record.
- Update: server action validates, confirms record exists, updates key fields, revalidates related pages.
- Visibility:
  - `admin`: all opportunities.
  - `director`: own + subordinates + unassigned.
  - `rep`: own opportunities only.

### D) Dashboard workflow
- `getDashboardData()` requires session.
- Pulls opportunities + organizations and computes:
  - focus metrics
  - next actions
  - pipeline snapshot
  - revenue summary
  - near-close deals
  - recent activity

## 6) Hardening Notes and Outstanding Follow-ups for v0.2.5

1. Add explicit API auth checks to all mutable endpoints (some already protected, continue full audit).
2. Add input schema validation to every API route (uniform Zod patterns).
3. Add integration tests for registration, login, organization read/write authorization.
4. Separate unit tests and e2e test execution pipelines by default scripts.
5. Optional: centralize auth guards in shared wrappers to reduce per-route drift.

## 7) Versioning

- Package version set to `0.2.4` in `apps/frontend/package.json`.
- This document is the audit baseline for moving to v0.2.5.
