# TUF Ops 1.0 Foundation — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Convert TUF Ops from a prototype with mock-mode fallbacks into a production operating system where PostgreSQL is the single source of truth, the frontend owns zero business logic, and every page works against live data.

**Architecture:** React → TanStack Query → API Client → Fastify API → Service Layer → Prisma → PostgreSQL. No mock data. No localStorage. No DATA_MODE switches. One shared types package consumed by both frontend and backend.

**Tech Stack:** React + TypeScript (Vite), Fastify + TypeScript, Prisma ORM, PostgreSQL, TanStack Query (React Query v5), pnpm monorepo

---

## Phase 0 — Prep: Git Cleanup & Safety Net

Before any code changes, get the repo into a clean state so we're not fighting reverted commits.

### Task 0.1: Verify current git state

**Objective:** Confirm we're starting from a known-good commit with no dirty files.

**Files:** None

**Step 1:** Check status
```bash
cd /Users/bradshaw/.gemini/antigravity/scratch/TUF-OPS
git status
git log --oneline -5
```

Expected: clean working tree, HEAD at latest commit.

**Step 2:** Note all untracked files that should be gitignored
```bash
git ls-files --others --exclude-standard
```

**Step 3:** Add dist/ to .gitignore if missing
```bash
echo "apps/*/dist/" >> .gitignore
echo "tsconfig.tsbuildinfo" >> .gitignore
git add .gitignore
git commit -m "chore: gitignore dist and tsbuildinfo"
```

---

## Phase 1 — Shared Types Package

Eliminate duplicate model definitions. Every type lives in `packages/shared/` and is imported by both `apps/api` and `apps/web`.

### Task 1.1: Create packages/shared scaffold

**Objective:** Create the shared types package with proper tsconfig and package.json.

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`

**package.json:**
```json
{
  "name": "@tuf/shared",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {},
  "dependencies": {}
}
```

**tsconfig.json:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**Step 1:** Verify the package is importable
```bash
cd packages/shared && npx tsc --noEmit
```
Expected: PASS

**Step 2:** Commit
```bash
git add packages/shared/
git commit -m "feat: scaffold @tuf/shared types package"
```

### Task 1.2: Define core shared types — Organization, Opportunity

**Objective:** Move Organization and Opportunity type definitions from `apps/web/src/data/mockSalesData.ts` to `packages/shared/src/`.

**Files:**
- Create: `packages/shared/src/types/organization.ts`
- Create: `packages/shared/src/types/opportunity.ts`
- Create: `packages/shared/src/types/common.ts`
- Modify: `packages/shared/src/index.ts`

**organization.ts:**
```typescript
export type TerritoryId = 'metro' | 'north' | 'west' | 'south';
export type CoverageStatus = 'UNTOUCHED' | 'CONTACTED' | 'ENGAGED' | 'NEGOTIATING' | 'CLOSED';
export type RevenueLane = 'UNIFORM' | 'TRAVEL_GEAR' | 'TEAM_STORE' | 'LETTERMAN';
export type LaneStatus = 'OPEN' | 'ACTIVE' | 'WON' | 'LOST';
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type LeadTier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'UNASSIGNED';
export type OrgStatus = 'ACTIVE' | 'WATCH' | 'NEW';

export interface LaneStatusEntry {
  status: LaneStatus;
  estimatedValue: number;
  activeOpportunityCount: number;
  nextAction: string;
}

export interface Organization {
  id: string;
  name: string;
  city: string;
  state: string;
  assignedRep: string;
  assignedRepId?: number | null;
  assignedDirector: string;
  assignedDirectorId?: number | null;
  territory: TerritoryId;
  schoolPhone?: string;
  coverageStatus: CoverageStatus;
  priority: Priority;
  pipelineValue: number;
  status: OrgStatus;
  nextAction: string;
  lastActivity: string;
  leadTier?: LeadTier;
  laneStatuses: Record<RevenueLane, LaneStatusEntry>;
  expansionRecommendation: string;
}
```

**opportunity.ts:**
```typescript
import type { RevenueLane } from './organization';

export type OpportunityStage =
  | 'LEAD_ENGAGED' | 'DISCOVERY' | 'MOCKUP_STAGE'
  | 'INVOICE_SENT' | 'CLOSED_WON' | 'CLOSED_LOST'
  | 'LEAD_ASSIGNED' | 'CONTACTED' | 'MOCKUP_REQUESTED'
  | 'MOCKUP_DELIVERED' | 'DECISION_PENDING' | 'PAYMENT_RECEIVED';

export interface Opportunity {
  id: string;
  title: string;
  organizationId: string;
  organizationName: string;
  lanes: RevenueLane[];
  sport: string;
  season: string;
  stage: OpportunityStage;
  value: number;
  assignedRep: string;
  assignedDirector?: string;
  estimatedValue?: number;
  nextAction: string;
  closeProbability: number;
  lastActivity: string;
  createdAt: string;
}
```

**Step 1:** Typecheck
```bash
npx tsc --noEmit --project packages/shared/tsconfig.json
```
Expected: PASS

**Step 2:** Commit

### Task 1.3: Define shared User, Candidate, and Order types

**Objective:** All remaining domain types in one place.

**Files:**
- Create: `packages/shared/src/types/user.ts`
- Create: `packages/shared/src/types/candidate.ts`
- Create: `packages/shared/src/types/order.ts`

**Step 1:** Copy existing types from web/src and api/src, standardizing to camelCase
**Step 2:** Typecheck
**Step 3:** Commit

### Task 1.4: Update imports across apps/web and apps/api

**Objective:** Replace local type imports with `@tuf/shared` imports.

**Files:** Every file in `apps/web/src/` and `apps/api/src/modules/` that imports `mockSalesData` types.

**Step 1:** Search all `from '../data/mockSalesData'` imports
```bash
grep -rn "mockSalesData" apps/web/src/ apps/api/src/ | grep import
```

**Step 2:** Replace each with `from '@tuf/shared'`
```typescript
// Before
import type { Organization, Opportunity } from '../data/mockSalesData';
// After
import type { Organization, Opportunity } from '@tuf/shared';
```

**Step 3:** Typecheck both apps
```bash
npx tsc --noEmit --project apps/web/tsconfig.json
npx tsc --noEmit --project apps/api/tsconfig.json
```
Expected: PASS

**Step 4:** Commit

---

## Phase 2 — Backend: Business Logic Migration

Move all calculations, transformations, and business rules from the frontend into the API service layer.

### Task 2.1: Prisma schema — define all models

**Objective:** Create Prisma schema matching PostgreSQL tables.

**Files:**
- Create: `packages/database/prisma/schema.prisma`

**Note:** If the project already has Prisma, update existing schema. If using raw SQL, add Prisma alongside existing pool.

**Step 1:** Define models: User, Organization, Opportunity, Candidate, Order, DailyActivity
**Step 2:** Run `npx prisma generate`
**Step 3:** Commit

### Task 2.2: Organization DTO — one stable API contract

**Objective:** The `/api/organizations` endpoint returns exactly what the frontend needs. No normalization needed on the frontend.

**Files:**
- Create: `apps/api/src/modules/organizations/organization.dto.ts`
- Modify: `apps/api/src/modules/organizations/organizations.service.ts`

**organization.dto.ts:**
```typescript
import type { Organization, LaneStatusEntry, RevenueLane } from '@tuf/shared';

export interface OrganizationRow {
  id: number;
  name: string;
  city: string;
  state: string;
  assigned_rep_name: string | null;
  assigned_rep_id: number | null;
  assigned_director_name: string | null;
  assigned_director_id: number | null;
  tuf_zone: string | null;
  territory: string | null;
  school_phone: string | null;
  tuf_priority: string | null;
  updated_at: string;
  created_at: string;
}

const DEFAULT_LANES: Record<RevenueLane, LaneStatusEntry> = {
  UNIFORM: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Confirm program needs' },
  TRAVEL_GEAR: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Identify team gear needs' },
  TEAM_STORE: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Confirm store owner' },
  LETTERMAN: { status: 'OPEN', estimatedValue: 0, activeOpportunityCount: 0, nextAction: 'Review senior interest' },
};

export function toOrganizationDto(row: OrganizationRow): Organization {
  const priority = (row.tuf_priority || '').toUpperCase();
  return {
    id: String(row.id),
    name: row.name,
    city: row.city,
    state: row.state,
    assignedRep: row.assigned_rep_name || 'Unassigned',
    assignedRepId: row.assigned_rep_id,
    assignedDirector: row.assigned_director_name || 'Unassigned',
    assignedDirectorId: row.assigned_director_id,
    territory: (row.tuf_zone || row.territory || 'metro') as Organization['territory'],
    schoolPhone: row.school_phone || undefined,
    coverageStatus: 'UNTOUCHED',
    priority: priority === 'TIER_1' ? 'HIGH' : priority === 'TIER_3' ? 'LOW' : 'MEDIUM',
    pipelineValue: 0,
    status: 'NEW',
    nextAction: 'Call primary contact and confirm sports coverage',
    lastActivity: row.updated_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    leadTier: (priority === 'TIER_1' ? 'TIER_1' : priority === 'TIER_2' ? 'TIER_2' : priority === 'TIER_3' ? 'TIER_3' : 'UNASSIGNED') as Organization['leadTier'],
    laneStatuses: { ...DEFAULT_LANES },
    expansionRecommendation: 'Start with Uniform discovery, then map Team Gear and Team Store potential by sport.',
  };
}
```

**Step 1:** Update service to use DTO
**Step 2:** Typecheck: `npx tsc --noEmit --project apps/api/tsconfig.json`
**Step 3:** Commit

### Task 2.3: Opportunity DTO

**Objective:** Same pattern — stable DTO for opportunities.

**Files:**
- Create: `apps/api/src/modules/opportunities/opportunity.dto.ts`
- Modify: `apps/api/src/modules/opportunities/opportunities.service.ts`

**Step 1:** Define `toOpportunityDto(row)` mapping snake_case DB row to camelCase frontend type
**Step 2:** Update service
**Step 3:** Typecheck
**Step 4:** Commit

### Task 2.4: Candidate DTO

**Objective:** Same pattern.

**Files:**
- Create: `apps/api/src/modules/recruiting/candidate.dto.ts`
- Modify: `apps/api/src/modules/recruiting/recruiting.service.ts`

**Step 1-4:** Same as above

### Task 2.5: Move business selectors to backend

**Objective:** `getLanePenetration`, `getOrganizationPriorityScore`, `getNearCloseOpportunities`, etc. move from `apps/web/src/services/businessSelectors.ts` to backend service layer.

**Files:**
- Create: `apps/api/src/modules/organizations/organizations.metrics.ts`
- Create: `apps/api/src/modules/opportunities/opportunities.metrics.ts`
- Modify: `apps/api/src/modules/organizations/organizations.routes.ts` (add GET /metrics)
- Modify: `apps/api/src/modules/opportunities/opportunities.routes.ts` (add GET /metrics)

**Step 1:** Create metrics endpoint: `GET /api/organizations/metrics` returns lanePenetration, untouched counts, etc.
**Step 2:** Create metrics endpoint: `GET /api/opportunities/metrics` returns near-close, stuck, pipeline value.
**Step 3:** Typecheck backend
**Step 4:** Commit

---

## Phase 3 — Kill Mock Mode

Remove every trace of mock data, localStorage, and DATA_MODE checks.

### Task 3.1: Delete mock data source

**Objective:** Remove `apps/web/src/data/mockSalesData.ts` and all references.

**Files:**
- Delete: `apps/web/src/data/mockSalesData.ts`
- Delete: `apps/web/src/data/` (entire directory if only mock data lives there)
- Modify: Every file that imported from it

**Step 1:** Find all importers
```bash
grep -rn "mockSalesData" apps/web/src/ | grep -v node_modules
```

**Step 2:** Replace each with `@tuf/shared` import or delete (if unused)
**Step 3:** Typecheck web app
**Step 4:** Commit

### Task 3.2: Remove dataMode.ts

**Objective:** Delete `apps/web/src/services/dataMode.ts` and all `DATA_MODE` references.

**Files:**
- Delete: `apps/web/src/services/dataMode.ts`
- Modify: ~16 files that reference DATA_MODE

**Step 1:** Find all references
```bash
grep -rn "DATA_MODE" apps/web/src/
```

**Step 2:** In each file, remove the `if (DATA_MODE === 'api')` branches and keep only the API code path.
```typescript
// Before
if (DATA_MODE === 'api') {
  return apiClient('/organizations', { query });
}
return listOrganizations(params);  // localStorage

// After — just the API path
return apiClient('/organizations', { query });
```

**Step 3:** Typecheck web app
**Step 4:** Commit

### Task 3.3: Remove localStorage dependency from usersService

**Objective:** `authenticateWithPin` already hits the backend. Remove all localStorage seed data and the hybrid fallback.

**Files:**
- Modify: `apps/web/src/services/usersService.ts`

**Step 1:** Remove `seededUsers` array and all localStorage read/write functions
**Step 2:** `authenticateWithPin` calls backend, returns token. No local fallback.
**Step 3:** Remove `readStoredUsers`, `writeLocalOrganizations`, `LOCAL_*_KEY` constants
**Step 4:** Typecheck
**Step 5:** Commit

### Task 3.4: Remove localStorage from organizationsService and opportunitiesService

**Objective:** All `listOrganizations`, `createOrganization`, etc. become direct API calls. Remove sync variants.

**Files:**
- Modify: `apps/web/src/services/organizationsService.ts` — keep only `*Async` functions, rename to remove `Async` suffix
- Modify: `apps/web/src/services/opportunitiesService.ts` — same

**Step 1:** For each service file, keep only the functions that call `apiClient`. Delete sync localStorage variants.
**Step 2:** Update all callers (hooks, pages)
**Step 3:** Typecheck
**Step 4:** Commit

---

## Phase 4 — TanStack Query

Replace custom `useOrganizations`, `useOpportunities` hooks with TanStack Query.

### Task 4.1: Install TanStack Query

**Objective:** Add `@tanstack/react-query` to the web app.

**Files:**
- Modify: `apps/web/package.json`

```bash
cd apps/web && pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

**Step 1:** Verify install
```bash
ls node_modules/@tanstack/react-query
```
**Step 2:** Commit

### Task 4.2: Create query keys and API functions

**Objective:** Centralize query keys and API call functions.

**Files:**
- Create: `apps/web/src/api/organizations.ts`
- Create: `apps/web/src/api/opportunities.ts`
- Create: `apps/web/src/api/candidates.ts`
- Create: `apps/web/src/api/users.ts`
- Create: `apps/web/src/api/queryKeys.ts`

**queryKeys.ts:**
```typescript
export const queryKeys = {
  organizations: {
    all: ['organizations'] as const,
    list: (params: Record<string, unknown>) => ['organizations', 'list', params] as const,
    detail: (id: string) => ['organizations', 'detail', id] as const,
  },
  opportunities: {
    all: ['opportunities'] as const,
    list: (params: Record<string, unknown>) => ['opportunities', 'list', params] as const,
    detail: (id: string) => ['opportunities', 'detail', id] as const,
  },
  candidates: {
    all: ['candidates'] as const,
    list: () => ['candidates', 'list'] as const,
    detail: (id: string) => ['candidates', 'detail', id] as const,
  },
  users: {
    all: ['users'] as const,
    me: () => ['users', 'me'] as const,
  },
};
```

**organizations.ts:**
```typescript
import { apiClient } from '../services/apiClient';
import type { Organization } from '@tuf/shared';

export async function getOrganizations(): Promise<Organization[]> {
  return apiClient('/organizations');
}

export async function getOrganization(id: string): Promise<Organization> {
  return apiClient(`/organizations/${id}`);
}

export async function createOrganization(input: Record<string, unknown>): Promise<Organization> {
  return apiClient('/organizations', { method: 'POST', body: input });
}
```

**Step 1:** Create all API modules
**Step 2:** Typecheck
**Step 3:** Commit

### Task 4.3: Replace useOrganizations with useQuery

**Objective:** Convert `useOrganizations` to use TanStack Query.

**Files:**
- Modify: `apps/web/src/hooks/useOrganizations.ts`
- Modify: `apps/web/src/pages/OrganizationsPage.tsx`
- Modify: `apps/web/src/pages/DashboardPage.tsx`

```typescript
// useOrganizations.ts — now a thin wrapper around useQuery
import { useQuery } from '@tanstack/react-query';
import { getOrganizations } from '../api/organizations';
import { queryKeys } from '../api/queryKeys';

export function useOrganizations() {
  return useQuery({
    queryKey: queryKeys.organizations.all,
    queryFn: getOrganizations,
    staleTime: 30_000, // 30 second cache
  });
}
```

**Step 1:** Convert hook
**Step 2:** Update consumers: `const { data: organizations = [], isLoading } = useOrganizations()`
**Step 3:** Typecheck
**Step 4:** Commit

### Task 4.4: Replace useOpportunities with useQuery

**Objective:** Same pattern as Task 4.3.

**Step 1-4:** Same as above

### Task 4.5: Replace useCandidate hooks

**Objective:** Same pattern.

**Step 1-4:** Same as above

### Task 4.6: Add loading/empty/error states to all pages

**Objective:** Every page handles the three states: loading, empty, error.

```tsx
function OrganizationsPage() {
  const { data: organizations = [], isLoading, error } = useOrganizations();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load organizations" onRetry={refetch} />;
  if (organizations.length === 0) return <EmptyState message="No organizations yet" />;

  return <OrganizationList organizations={organizations} />;
}
```

**Files:** Every page component in `apps/web/src/pages/`

**Step 1:** Add loading/empty/error to each page
**Step 2:** Typecheck
**Step 3:** Commit

---

## Phase 5 — Backend Hardening

### Task 5.1: Centralize auth middleware properly

**Objective:** Every protected route uses a single `requireAuth` middleware. Permissions checked via `requirePermission(permission)`. No inline role checks.

**Files:** Audit all route files

**Step 1:** Verify every route has `requireCertification()` or `requirePermission()` preHandler
**Step 2:** Remove any inline `if (user.role === 'DIRECTOR')` logic from controllers
**Step 3:** Commit

### Task 5.2: Add audit logging to write operations

**Objective:** Every POST/PUT/DELETE logs who did what.

**Files:**
- Modify: All service files with write operations

**Step 1:** Add `auditLog(action, userId, resourceType, resourceId, metadata)` to organization, opportunity, candidate, and user services
**Step 2:** Commit

### Task 5.3: Add input validation

**Objective:** Every endpoint validates input before processing.

**Files:** All controller files

**Step 1:** Add validation for required fields, email format, enum values
**Step 2:** Return 400 with clear error messages on invalid input
**Step 3:** Commit

---

## Phase 6 — Production Readiness

### Task 6.1: Add Vercel environment validation

**Objective:** Ensure VITE_DATA_MODE is NOT set (or set to 'api') on Vercel. Add `VITE_API_URL` pointing to Railway.

**Step 1:** Update vercel.json build command to remove `VITE_DATA_MODE=api` (it's the default now)

### Task 6.2: Add health check endpoint with DB status

**Objective:** `GET /api/health` returns database connectivity status.

**Step 1:** Modify health handler to query `SELECT 1` from pool
**Step 2:** Commit

### Task 6.3: Run full smoke test

**Objective:** Verify every critical path works end-to-end.

**Test checklist:**
- [ ] Login with all 5 user PINs
- [ ] Organizations: list, create, view detail
- [ ] Opportunities: list, create, advance stage
- [ ] Daily Activity Command: log, view today
- [ ] Recruiting: list candidates, view detail, upload resume
- [ ] Territory: view lead distribution
- [ ] Sidebar: 9 items, correct for each role

---

## Summary — Task Count & Estimate

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 0. Git Cleanup | 1 | 5 min |
| 1. Shared Types | 4 | 45 min |
| 2. Backend DTOs | 5 | 1 hr |
| 3. Kill Mock Mode | 4 | 1 hr |
| 4. TanStack Query | 6 | 1.5 hr |
| 5. Backend Hardening | 3 | 45 min |
| 6. Production Readiness | 3 | 30 min |
| **Total** | **26** | **~5.5 hrs** |

---

## Risks

1. **TanStack Query learning curve** — hooks change shape. `useOrganizations(params)` becomes `useQuery({ queryKey, queryFn })`. Consumers need updating.
2. **`@tuf/shared` import resolution** — both apps need to resolve the workspace package. tsconfig paths may need adjustment.
3. **Backend DTO performance** — DTO transformations add CPU per request. Negligible at current scale (<300 orgs).
4. **Prisma migration** — if the project uses raw SQL, adding Prisma requires schema definition + migration. May be a separate phase.
