# Beta Role User Journeys

Date: May 8, 2026

Scope: `apps/web` organizational beta in mock mode.

Status legend:
- WORKING MOCK: route renders and the visible function works with seeded or local mock state.
- NEEDS FIX: beta-critical route/function is visibly broken.
- COMING SOON: intentionally marked post-beta or future behavior.
- NOT APPLICABLE: not part of the role journey.

## Owner Journey

| Step | Route | Expected Visible Function | Status | Notes |
| --- | --- | --- | --- | --- |
| 1. Login | `/login` | PIN entry with `0000`, error feedback for invalid PIN | WORKING MOCK | Uses localStorage beta auth. |
| 2. Review dashboard | `/dashboard` | Today’s Focus, next actions, pipeline, revenue, activity, lane penetration, sports ticker | WORKING MOCK | Owner sees org-wide scope. |
| 3. Import leads/accounts | `/organizations` | CSV upload, preview, validation, duplicate count, import into mock account table | WORKING MOCK | Owner-only import panel persists local mock accounts. |
| 4. Review imported accounts | `/organizations` | Imported rows appear in search/filter/pagination | WORKING MOCK | Local mock records are merged with seeded data. |
| 5. Assign territory/director/rep | `/organizations` | Select rows and bulk update territory, director, rep, coverage | WORKING MOCK | Updates local mock copies for selected accounts. |
| 6. Review territory map | `/territory`, `/territory/map` | Map-first command view with zone selection and snapshots | WORKING MOCK | Metro, North, West, South only; no East zone. |
| 7. Review organizations | `/organizations`, `/organizations/:id` | Account table, lane cards, sport/lane coverage, next actions | WORKING MOCK | Detail route is role-scoped. |
| 8. Review opportunities | `/opportunities`, `/my-opportunities`, `/opportunities/:id` | Pipeline filters, detail, stage actions, creative requests | WORKING MOCK | Owner can view all deals. |
| 9. Review orders/blocked orders | `/orders`, `/orders/:id`, `/ops-workspace` | Production queues, blockers, missing info, handoff detail | WORKING MOCK | Owner has ops workspace access. |
| 10. Review reports | `/reports` | Weekly/monthly, lane, rep summaries, mock export feedback | WORKING MOCK | Export buttons return beta-safe mock feedback. |
| 11. Adjust settings/theme/role context | `/settings` | Profile, role context, accent, compact mode, PIN, landing page | WORKING MOCK | Save updates active beta role context. |

## Director Journey

| Step | Route | Expected Visible Function | Status | Notes |
| --- | --- | --- | --- | --- |
| 1. Login | `/login` | PIN login, then role context can switch to Director | WORKING MOCK | Beta role selector is visible in shell/settings. |
| 2. Review director dashboard | `/dashboard` | Today’s Focus, next actions, near close, pipeline, revenue, 4-order reminder, lane penetration | WORKING MOCK | Director dashboard uses director-scoped service data. |
| 3. Review My Opportunities | `/my-opportunities` | Director personal selling pipeline | WORKING MOCK | Seed data includes Director-owned opportunities. |
| 4. Review team/territory opportunities | `/team-opportunities` | Rep/stage/lane/sport/focus filters and row click | WORKING MOCK | Director can coach from team deal table. |
| 5. Review assigned organizations | `/organizations`, `/organizations/:id` | Scoped account list and detail | WORKING MOCK | Director sees assigned/team territory scope. |
| 6. Review territory/coverage | `/territory`, `/territory/map` | Map-first command view, workload table, stale account pressure | WORKING MOCK | Scope follows assigned territories. |
| 7. Identify untouched/stale accounts | `/territory`, `/organizations` | Territory pressure, untouched counts, filters | WORKING MOCK | Stale and untouched counts are visible. |
| 8. Coach reps using accountability data | `/team-performance`, `/team-opportunities`, `/dashboard`, `/earnings` | Rep workload, stuck/near-close metrics, 4-order pace, earning potential | WORKING MOCK | 4 orders/month and lane penetration are visible operating standards. |
| 9. Review reports | `/reports` | Summary and rep/lane performance | WORKING MOCK | Mock export feedback available. |

## Rep Journey

| Step | Route | Expected Visible Function | Status | Notes |
| --- | --- | --- | --- | --- |
| 1. Login | `/login` | PIN login, then role context can switch to Rep | WORKING MOCK | Beta role selector is visible in shell/settings. |
| 2. Review today's focus | `/dashboard` | Today’s Focus, next actions, near close, payment pending, 4-order pace, lane penetration | WORKING MOCK | Uses rep-scoped opportunities. |
| 3. Review assigned organizations | `/organizations`, `/organizations/:id` | Rep-scoped account table and lane detail | WORKING MOCK | Rep does not see import or bulk assignment controls. |
| 4. Create/update opportunity | `/opportunities/new`, `/opportunities/:id` | Create local mock opportunity, advance stages | WORKING MOCK | Creation persists locally and navigates to detail. |
| 5. Work My Opportunities | `/my-opportunities` | Rep-scoped list, filters, row click | WORKING MOCK | Force-scoped to current rep. |
| 6. Follow stage action flow | `/opportunities/:id` | Best next move, advance stage, close won/lost, creative request | WORKING MOCK | Updates local mock stage state. |
| 7. Review order status where relevant | `/orders`, `/orders/:id` | Rep-scoped orders and production blockers | WORKING MOCK | Detail route is scoped through order list. |
| 8. Review progress/earnings | `/earnings` | Made, can make at 4-order pace, won revenue, remaining orders | WORKING MOCK | Mock commission model only. |

## Ops Journey

| Step | Route | Expected Visible Function | Status | Notes |
| --- | --- | --- | --- | --- |
| 1. Login | `/login` | PIN login, then role context can switch to Ops | WORKING MOCK | Beta role selector is visible in shell/settings. |
| 2. Review ops dashboard/workspace | `/dashboard`, `/ops-workspace` | Needs review, blocked, ready for vendor, in-production counts | WORKING MOCK | OPS sidebar includes dashboard and workspace. |
| 3. Review new/needs-review orders | `/ops-workspace`, `/orders` | Needs Review queue and status filter | WORKING MOCK | OPS order scoping fixed. |
| 4. Review blocked orders and missing info | `/ops-workspace`, `/orders`, `/orders/:id` | Blocked queue, missing info checklist, vendor notes | WORKING MOCK | Missing info appears in table and detail. |
| 5. Review ready/vendor/production/completed queues | `/ops-workspace` | Five status columns display seeded queues | WORKING MOCK | Queue cards open order detail. |
| 6. Open order detail | `/orders/:id` | Source opportunity, stage, handoff package, blockers, activity | WORKING MOCK | Direct route is scoped through accessible order list. |
| 7. Confirm blocker reason and next production step | `/orders/:id` | Missing info checklist and current production stage | WORKING MOCK | Resolution workflow remains mock-display only for beta. |
