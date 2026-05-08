# Beta Business Logic Function Map

Date: May 8, 2026

Scope: `apps/web` organizational beta in mock mode.

| Business Logic | Route | Component/Page | Status | Beta Readiness Notes |
| --- | --- | --- | --- | --- |
| Lead import | `/organizations` | `OrganizationImportPanel` | WORKING MOCK | CSV parsing, preview, validation, duplicate summary, and local mock import. |
| Account normalization | `/organizations`, `/organizations/new` | `leadImport.ts`, `NewPages.tsx` | WORKING MOCK | Names, state, territory, duplicate keys, and required fields normalized. |
| Territory assignment | `/organizations`, `/territory` | `OrganizationsPage`, `TerritoryPage` | WORKING MOCK | Bulk selected rows update local mock territory; territory dashboards reflect scoped data. |
| Director assignment | `/organizations`, `/organizations/:id` | `OrganizationsPage`, `OrganizationDetailPage` | WORKING MOCK | Bulk selected rows update assigned director in local mock state. |
| Rep assignment | `/organizations`, `/organizations/:id` | `OrganizationsPage`, `OrganizationDetailPage` | WORKING MOCK | Bulk selected rows update assigned rep in local mock state. |
| Coverage status | `/organizations`, `/organizations/:id` | `OrganizationsPage`, `OrganizationDetailPage` | WORKING MOCK | Table filters and bulk status changes are available. |
| Sport-scoped lanes | `/organizations/:id`, `/territory` | `OrganizationDetailPage`, `TerritoryPage` | WORKING MOCK | Lane coverage appears by sport and by territory. |
| Opportunity naming | `/opportunities/new` | `OpportunityNewPage`, `naming.ts` | WORKING MOCK | Program level + sport + season + lane preview creates local mock opportunity. |
| Opportunity stage progression | `/opportunities/:id` | `OpportunityDetailPage` | WORKING MOCK | Advance-stage, stage CTA, closed won, and closed lost controls update local mock state. |
| My Opportunities | `/my-opportunities` | `MyOpportunitiesPage`, `OpportunitiesPage` | WORKING MOCK | Rep and Director personal scope work in seeded mock data. |
| Team/director visibility | `/dashboard`, `/team-opportunities`, `/team-performance` | `DashboardPage`, `TeamOpportunitiesPage`, `TeamPerformancePage` | WORKING MOCK | Director sees team and coaching surfaces. |
| Next action | `/dashboard`, `/opportunities`, `/organizations/:id` | `DashboardPage`, `OpportunitiesPage`, `OrganizationDetailPage` | WORKING MOCK | Next actions appear in dashboard, table, and lane cards. |
| Near close | `/dashboard`, `/opportunities`, `/team-opportunities` | `businessSelectors.ts`, pipeline pages | WORKING MOCK | Near-close stages are prioritized and filterable. |
| Payment pending | `/dashboard`, `/opportunities/:id` | `DashboardPage`, `OpportunityDetailPage` | WORKING MOCK | INVOICE_SENT deals roll up as pending invoices/payment follow-up. |
| Mockup request | `/opportunities/:id` | `OpportunityDetailPage`, `creativeRequestsService` | WORKING MOCK | Creative request form persists local mock requests. |
| Sample tracking | `/opportunities/:id` | `OpportunityDetailPage` | COMING SOON | Beta shows creative/mockup task tracking; dedicated sample lifecycle is post-beta. |
| Invoice status | `/dashboard`, `/opportunities/:id` | `DashboardPage`, `OpportunityDetailPage` | WORKING MOCK | Invoice status is stage-driven in mock mode. |
| Closed won order handoff | `/orders`, `/orders/:id` | `OrdersPage`, `OrderDetailPage` | WORKING MOCK | Existing closed-won/invoice/decision deals seed order handoff views. |
| Blocked order reason | `/orders`, `/ops-workspace`, `/orders/:id` | Order and ops pages | WORKING MOCK | BLOCKED orders show missing info and vendor notes. |
| Missing info checklist | `/orders/:id`, `/ops-workspace` | `OrderDetailPage`, `OpsWorkspacePage` | WORKING MOCK | Detail page shows missing item count and list. |
| Territory health | `/territory` | `TerritoryPage` | WORKING MOCK | Coverage health, workload, stale and untouched account pressure are visible. |
| Territory map | `/territory/map` | `TerritoryMapPage` | WORKING MOCK | Four zones only: Metro, North, West, South. No East zone. |
| Reports | `/reports` | `ReportsPage` | WORKING MOCK | Weekly/monthly, lane, rep summaries and mock export feedback. |
| Settings/theme/accent | `/settings` | `SettingsPage` | WORKING MOCK | Saves profile, role context, theme, compact mode, notifications, default view, PIN field. |

## Non-Blocking Post-Beta Notes

- Dedicated sample lifecycle objects are not modeled yet.
- Report export produces beta-safe feedback instead of a downloadable file.
- Create Order is intentionally routed through Closed Won handoff in beta; standalone order creation remains post-beta.
