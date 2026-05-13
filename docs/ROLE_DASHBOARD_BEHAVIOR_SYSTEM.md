# ROLE DASHBOARD BEHAVIOR SYSTEM

## KPI mapping
- **Activity:** next actions executed, stage movement queue, stale follow-ups.
- **Pipeline:** near-close count, stuck deals, territory exposure (untouched accounts), lane penetration.
- **Revenue:** open pipeline value, payment-pending value, blocked handoff value, closed-won value.
- **Culture:** momentum state, movement streak, assignment ownership visibility.

## Momentum system
Momentum states are derived from mock signals:
- **HOT:** near-close volume + low stale pressure + recent activity present.
- **BUILDING:** moderate movement with manageable stale queue.
- **STALLED:** stale pressure rising and low stage advancement.
- **CRITICAL:** high stale/blocked pressure and weak movement.

Displayed language is tactical/professional (no gamification) and appears via mission/pressure cards.

## Territory pressure system
Uses existing `metro/north/west/south` model:
- coverage pressure from untouched organizations
- active opportunities
- near-close opportunities
- stuck deals
- lane penetration counts
- top expansion targets from next-action/stuck queues

Health labels:
- Weak Coverage
- Building
- Active
- Dominating

## Execution queue logic
Every sales-facing dashboard surfaces mission queues from:
- stuck deals (`nextAction` + stale pressure)
- near-close opportunities
- payment-pending opportunities
- territory exposure (untouched accounts)

Queue intent: force immediate behavior, not passive analytics.

## Stale / at-risk logic
- **Stale:** last activity/movement aged 14+ days (mock-safe threshold).
- **At-risk:** invoice/late-stage inactivity and blocked handoff pressure.
- **Untouched:** organizations with untouched coverage status.

These are promoted above informational widgets.

## Owner dashboard logic
Owner view emphasizes command and intervention:
- Deals Need Action
- Near Close
- Payments Pending
- Territory Exposure
- Pipeline/Revenue/Lane pressure
- Territory visibility and activity feed

Psychological outcome: intervention urgency + performance accountability across all territories/reps/directors.

## Director dashboard logic
Director view emphasizes coaching + closing:
- stuck deals
- near close
- territory exposure
- team next actions
- pipeline snapshot
- activity feed

Psychological outcome: coach weak reps, close personal/team opportunities, attack weak territory zones.

## Rep dashboard logic
Rep view is ordered for mobile execution:
1. Today’s Mission
2. Next Actions
3. Near Close
4. Payments Pending
5. Ticker module
6. My Pipeline Snapshot
7. Monthly Progress
8. Recent Activity

Rep incentives shown professionally:
- monthly 4-order standard progress
- lane penetration pressure
- mission-first queue

## Ops dashboard logic
Ops view remains fulfillment-command oriented:
- needs review
- blocked orders
- ready for vendor
- in production
- blocker queue / production command list

Psychological outcome: clear blockers, maintain throughput, prevent handoff delay.

## Incentive visibility logic
Subtle competitive signals only:
- monthly standard gap
- lane penetration pressure
- territory exposure count
- movement/momentum status

No trophies/badges/cartoon UI.

## Intended psychological outcomes
- Increase follow-up velocity
- Increase stage movement consistency
- Reduce stale/untouched territory exposure
- Increase lane penetration behavior
- Improve ownership/accountability by role
