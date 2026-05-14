# CTA Role Audit

## Dashboard CTAs
- OWNER
  - Deals Need Action -> `/team-opportunities`
  - Near Close -> `/team-opportunities`
  - Payments Pending -> `/orders`
  - Territory Exposure -> `/territory`
- DIRECTOR
  - Stuck Deals -> `/team-opportunities`
  - Reps Needing Coaching -> `/team-performance`
  - Near Close -> `/team-opportunities`
  - Territory Coverage -> `/territory`
- REP
  - Today's Mission -> `/my-opportunities`
  - Near Close -> `/my-opportunities`
  - Payments Pending -> `/orders`
  - Momentum Status -> `/my-opportunities`
- OPS
  - Needs Review -> `/ops-workspace`
  - Blocked Orders -> `/orders`
  - Ready for Vendor -> `/ops-workspace`
  - In Production -> `/ops-workspace`

## Users Page
- OWNER and DIRECTOR only
- REP/OPS hidden by route visibility and page guard.

## Outstanding follow-ups
- Add automated CTA route guard checks in smoke test harness.
