# TUF Ops Web Data Adapter Plan

**Date:** April 28, 2026  
**Scope:** transition `apps/web` from mock-data mode to live API without scattering fetch logic

## Objective
Keep page components focused on presentation and interaction while moving all data access into a thin adapter/service layer.

## Principles
1. Keep mock data isolated in `apps/web/src/data/mockSalesData.ts`.
2. Add service modules for each domain (organizations, opportunities, orders, reports, activities).
3. Add hook layer for route components (`useOrganizations`, `useOpportunities`, `useOrders`, `useReports`).
4. Avoid direct `fetch`/`axios` calls inside page components.
5. Replace data source endpoint-by-endpoint with minimal UI churn.

## Actual Files Created (Current State)
- `apps/web/src/services/dataMode.ts`
- `apps/web/src/services/apiClient.ts`
- `apps/web/src/services/organizationsService.ts`
- `apps/web/src/services/opportunitiesService.ts`
- `apps/web/src/services/ordersService.ts`
- `apps/web/src/services/reportsService.ts`
- `apps/web/src/services/activitiesService.ts`
- `apps/web/src/hooks/useOrganizations.ts`
- `apps/web/src/hooks/useOpportunities.ts`
- `apps/web/src/hooks/useOrders.ts`
- `apps/web/src/hooks/useReports.ts`

## How Pages Consume Data Now
- `/organizations` → `useOrganizations` (list and filters)
- `/organizations/:id` → `useOrganizationById`, `useOpportunities`, `useOrders`, `useActivities`
- `/opportunities` → `useOpportunities`, `useOpportunityStages`, `useRevenueLanes`
- `/opportunities/:id` → `useOpportunityById`, `useOpportunityStages`, `useActivities`
- `/orders` → `useOrders`
- `/orders/:id` → `useOrderById`, `useOpportunityById`, `useActivities`
- `/ops-workspace` → `useOpsWorkspaceQueues`
- `/reports` → `useReports`

## Adapter Strategy

### Phase A — Mock adapter baseline (DONE)
- Service interfaces return current mock shapes.
- Mock-backed service methods implemented first.
- Route components consume hooks/services only.

### Phase B — API adapter introduction (NEXT)
- Use `apiClient.ts` as shared base URL + request helper.
- Swap service implementation from mock provider to HTTP provider endpoint-by-endpoint.
- Preserve service return types so page components stay unchanged.

### Phase C — Incremental endpoint migration order (RECOMMENDED)
1. Organizations list/detail
2. Opportunities list/detail
3. Orders list/detail + ops workspace queues
4. Reports summary
5. Activity feed

### Phase D — Runtime hardening
- Add standard loading state handling per hook.
- Add standard empty-state and error-state handling.
- Add retry policy for transient failures where appropriate.

## Guardrails
- Do not import `mockSalesData` directly in page components.
- Keep filter/query param names consistent with API contract plan document.
- Keep one source of truth for domain types to avoid drift between mock and API adapters.

## Cutover Readiness Checklist
- [x] Hook layer exists for organizations/opportunities/orders/reports routes.
- [x] Pages no longer import mock dataset directly.
- [x] API services can be toggled in place of mock services.
- [ ] Loading/error/empty states validated in each route for live mode.
- [ ] Pagination metadata fully driven by API responses.
