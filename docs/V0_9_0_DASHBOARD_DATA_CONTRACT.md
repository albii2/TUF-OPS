# v0.9.0 Dashboard Data Contract

v0.9 launch dashboards must use backend reporting metrics in production (`VITE_DATA_MODE=api`). Mock/local calculations remain acceptable only for local demo mode.

## Authoritative endpoints

- `GET /api/reporting/owner-dashboard` and `/api/reporting/admin-dashboard`: company-wide rollups.
- `GET /api/reporting/director-dashboard/:directorId`: director territory/team rollup.
- `GET /api/reporting/rep-dashboard/:repId`: rep-owned scope.
- `GET /api/reporting/school-coverage`: company-wide school coverage.
- `GET /api/reporting/commissions`: admin/owner commission rollup.

> Auth blocker: v0.9 Fastify reporting routes expose server-side calculations but do not yet receive a fully authenticated actor context. Production must protect these routes at the API gateway/session layer until API auth middleware injects actor id/role and stops trusting path ids.

## Metric contract

| Metric | Source | Rule | Role visibility | Status |
|---|---|---|---|---|
| assigned schools | `organizations.id`, scoped by `assigned_rep_id`/`assigned_director_id` | count scoped organizations | admin all, director assigned territory/team, rep own | production-ready with auth caveat |
| touched schools | `activities.organization_id`, `activities.type` | distinct organizations with auditable activity: call, email, text, meeting, note, opportunity activity, logged contact | same as assigned schools | production-ready with auth caveat |
| untouched schools | organizations minus touched | assigned minus touched | same as assigned schools | production-ready with auth caveat |
| active opportunities | `opportunities.stage` | count stages not `CLOSED_WON`/`CLOSED_LOST` | scoped by org assignment | production-ready with auth caveat |
| follow-ups due | `activities.completed`, `activities.due_date` | incomplete activities due now/past | scoped by org assignment | production-ready with auth caveat |
| action-needed items | `opportunities.next_action`, `expected_close_date` | next action present or expected close date due | scoped by org assignment | partial: depends on data quality |
| closed-won count | `opportunities.stage` | count `CLOSED_WON` | scoped by org assignment | production-ready with auth caveat |
| paid order count | `orders.status` | count only `DELIVERED`/`COMPLETED` | scoped by order assignment | production-ready with auth caveat |
| paid revenue | `orders.status`, `opportunities.actual_revenue` | sum actual revenue for delivered/completed orders | scoped by order assignment | production-ready with auth caveat |
| gross profit | `orders.status`, `opportunities.gross_profit` | sum gross profit for delivered/completed orders | scoped by order assignment | production-ready with auth caveat |
| rep commission estimate | `commissions.rep_commission` | sum for delivered/completed orders; hidden from directors | admin/owner and rep only | production-ready with auth caveat |
| director override estimate | `commissions.director_override` | sum for delivered/completed orders; hidden from reps | admin/owner and director only | production-ready with auth caveat |
| month-to-date activity | `activities.created_at` | count scoped activities since month start | scoped by org assignment | production-ready with auth caveat |
| 4-orders/month pacing | `paid_order_count` | rep pacing card uses backend paid order count in API mode | rep only | production-ready with auth caveat |

## Schema assumptions

Reporting assumes `organizations.assigned_rep_id`, `organizations.assigned_director_id`, `opportunities.organization_id`, `orders.opportunity_id`, `orders.assigned_rep_id`, `orders.assigned_director_id`, and `commissions.opportunity_id` exist. The v0.9 production-readiness migration adds/backfills order assignment fields where needed.
