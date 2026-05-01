# TUF Ops Web API Contract Plan

**Date:** April 28, 2026  
**Scope:** API contracts required to replace `apps/web/src/data/mockSalesData.ts`

## Conventions
- Base path: `/api/v1`
- Response wrapper (suggested):
  - `{ data: ..., meta?: ..., error?: ... }`
- Pagination params:
  - `page` (number, 1-based)
  - `pageSize` (number)
- Sorting params:
  - `sortBy` (string)
  - `sortDir` (`asc` | `desc`)

---

## 1) Organizations list
- **Method:** `GET`
- **Path:** `/api/v1/organizations`
- **Query params:**
  - `search?: string`
  - `status?: ACTIVE|WATCH|NEW`
  - `rep?: string`
  - `page?: number`
  - `pageSize?: number`
  - `sortBy?: name|pipelineValue|lastActivity`
  - `sortDir?: asc|desc`
- **Response shape:**
  - `data: OrganizationListItem[]`
  - `meta: { total: number, page: number, pageSize: number }`
- **Frontend page consuming:** `/organizations`
- **Mock source replaced:** `organizations` in `apps/web/src/data/mockSalesData.ts`

## 2) Organization detail
- **Method:** `GET`
- **Path:** `/api/v1/organizations/:organizationId`
- **Query params:** none
- **Response shape:**
  - `data: { organization, laneStatuses, activeOpportunities, ordersSummary, expansionRecommendation, recentActivities }`
- **Frontend page consuming:** `/organizations/:id`
- **Mock source replaced:** `organizations`, filtered `opportunities`, filtered `orders`, filtered `activities`

## 3) Opportunities list
- **Method:** `GET`
- **Path:** `/api/v1/opportunities`
- **Query params:**
  - `search?: string`
  - `stage?: LEAD_ASSIGNED|CONTACTED|DISCOVERY|MOCKUP_REQUESTED|MOCKUP_DELIVERED|INVOICE_SENT|DECISION_PENDING|CLOSED_WON|CLOSED_LOST`
  - `lane?: UNIFORM|TRAVEL_GEAR|TEAM_STORE|LETTERMAN`
  - `rep?: string`
  - `sport?: string`
  - `page?: number`
  - `pageSize?: number`
  - `sortBy?: value|closeProbability|lastActivity`
  - `sortDir?: asc|desc`
- **Response shape:**
  - `data: OpportunityListItem[]`
  - `meta: { total, page, pageSize }`
- **Frontend page consuming:** `/opportunities`
- **Mock source replaced:** `opportunities`

## 4) Opportunity detail
- **Method:** `GET`
- **Path:** `/api/v1/opportunities/:opportunityId`
- **Query params:** none
- **Response shape:**
  - `data: { opportunity, organizationSummary, stageProgress, nextAction, stageCtaKey, activities, filesSummary, invoiceSummary }`
- **Frontend page consuming:** `/opportunities/:id`
- **Mock source replaced:** `opportunities`, filtered `activities`

## 5) Orders list
- **Method:** `GET`
- **Path:** `/api/v1/orders`
- **Query params:**
  - `search?: string`
  - `productionStatus?: NEEDS_REVIEW|READY_FOR_VENDOR|IN_PRODUCTION|BLOCKED|COMPLETED`
  - `page?: number`
  - `pageSize?: number`
  - `sortBy?: createdDate|value|productionStatus`
  - `sortDir?: asc|desc`
- **Response shape:**
  - `data: OrderListItem[]`
  - `meta: { total, page, pageSize }`
- **Frontend page consuming:** `/orders`
- **Mock source replaced:** `orders`

## 6) Order detail
- **Method:** `GET`
- **Path:** `/api/v1/orders/:orderId`
- **Query params:** none
- **Response shape:**
  - `data: { order, linkedOpportunity, itemsSummary, rosterSummary, vendorNotes, missingInfo, activities }`
- **Frontend page consuming:** `/orders/:id`
- **Mock source replaced:** `orders`, filtered `opportunities`, filtered `activities`

## 7) Ops workspace queues
- **Method:** `GET`
- **Path:** `/api/v1/ops-workspace/queues`
- **Query params:**
  - `includeCompleted?: boolean`
- **Response shape:**
  - `data: { NEEDS_REVIEW: OrderListItem[], READY_FOR_VENDOR: OrderListItem[], IN_PRODUCTION: OrderListItem[], BLOCKED: OrderListItem[], COMPLETED: OrderListItem[] }`
- **Frontend page consuming:** `/ops-workspace`
- **Mock source replaced:** `opsWorkspaceQueue`

## 8) Reports summary
- **Method:** `GET`
- **Path:** `/api/v1/reports/summary`
- **Query params:**
  - `range?: weekly|monthly|quarterly`
  - `territory?: string`
  - `rep?: string`
- **Response shape:**
  - `data: { weeklySummary, monthlySummary, lanePerformance, repPerformance }`
- **Frontend page consuming:** `/reports`
- **Mock source replaced:** `reportsSummary`

## 9) Activity feed
- **Method:** `GET`
- **Path:** `/api/v1/activities`
- **Query params:**
  - `entityType?: ORGANIZATION|OPPORTUNITY|ORDER`
  - `entityId?: string`
  - `limit?: number`
- **Response shape:**
  - `data: Activity[]`
- **Frontend page consuming:**
  - `/organizations/:id`
  - `/opportunities/:id`
  - `/orders/:id`
- **Mock source replaced:** `activities`

---

## Integration Notes
- Keep route-level query params aligned with backend API query names to avoid mapping drift.
- Prefer stable IDs over display names for filters where possible.
- Return `meta.total` on all list endpoints to support existing frontend pagination UI.
