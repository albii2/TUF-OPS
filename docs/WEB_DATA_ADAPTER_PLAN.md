# TUF Ops Web Data Adapter Plan

**Date:** April 28, 2026  
**Scope:** transition `apps/web` from mock-data mode to live API without scattering fetch logic

## Objective
Keep page components focused on presentation and interaction while moving all data access into a thin adapter/service layer.

## Principles
1. Keep mock data isolated in `apps/web/src/data/mockSalesData.ts`.
2. Add service modules for each domain (organizations, opportunities, orders, reports).
3. Add hook layer for route components (`useOrganizations`, `useOpportunities`, `useOrders`).
4. Avoid direct `fetch`/`axios` calls inside page components.
5. Replace data source endpoint-by-endpoint with minimal UI churn.

## Suggested Future File Structure
- `apps/web/src/data/mockSalesData.ts`
- `apps/web/src/services/apiClient.ts`
- `apps/web/src/services/organizationsService.ts`
- `apps/web/src/services/opportunitiesService.ts`
- `apps/web/src/services/ordersService.ts`
- `apps/web/src/services/reportsService.ts`
- `apps/web/src/hooks/useOrganizations.ts`
- `apps/web/src/hooks/useOpportunities.ts`
- `apps/web/src/hooks/useOrders.ts`

## Adapter Strategy

### Phase A — Mock adapter baseline
- Create service interfaces that return current mock shapes.
- Implement mock-backed service methods first.
- Route components consume hooks/services only.

### Phase B — API adapter introduction
- Introduce `apiClient.ts` for shared base URL, headers, and error mapping.
- Swap service implementation from mock provider to HTTP provider endpoint-by-endpoint.
- Preserve service return types so page components stay unchanged.

### Phase C — Incremental endpoint migration
1. Organizations list/detail
2. Opportunities list/detail
3. Orders list/detail + ops workspace
4. Reports + activities

### Phase D — Runtime hardening
- Add standard loading state handling per hook.
- Add standard empty-state and error-state handling.
- Add retry policy for transient failures where appropriate.

## Minimal Service Contract Example (Conceptual)
- `organizationsService.list(params)`
- `organizationsService.getById(id)`
- `opportunitiesService.list(params)`
- `opportunitiesService.getById(id)`
- `ordersService.list(params)`
- `ordersService.getById(id)`
- `ordersService.getOpsQueues(params)`
- `reportsService.getSummary(params)`
- `reportsService.getActivities(params)`

## Guardrails
- Do not import `mockSalesData` directly in page components once hooks are in place.
- Keep filter/query param names consistent with API contract plan document.
- Keep one source of truth for domain types to avoid drift between mock and API adapters.

## Cutover Readiness Checklist
- [ ] Hook layer exists for organizations/opportunities/orders routes.
- [ ] Pages no longer import mock dataset directly.
- [ ] API services can be toggled in place of mock services.
- [ ] Loading/error/empty states validated in each route.
- [ ] Pagination metadata fully driven by API responses.
