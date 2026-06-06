# TUF Ops Memorial Day Internal Launch Guide

## Memorial Day readiness score
- **8.6 / 10 (Ready for internal Day 1 with controlled follow-up patches).**

## Launch blockers
1. None remaining in this patch set.

## Launch risks
1. Live sports data APIs are still placeholder-configured in the ticker architecture.
2. Director override telemetry is represented in workflows but still needs explicit event logging for production analytics.

## Post-launch improvements
1. Wire the Sports Wire score slots to approved feed providers (NBA/NFL/CFB/WNBA).
2. Add director coaching reminder automation (calendar + notifications).
3. Add owner trend charts for week-over-week zone risk and lane penetration movement.

## KPI gaps
- **Covered now in product surface:** 4 orders/month, lane penetration, stale opportunities, near-close, closed-won count, pipeline value, average deal size indicators, rep pace indicators, revenue by lane, revenue by zone prompts.
- **Partial / post-launch:** revenue by sport chart consolidation, explicit director override reporting card.

## Recommended Day 1 workflow
1. **Rep:** Open dashboard mission card → clear stale queue → push near-close invoice/payment actions → log next actions.
2. **Director:** Open coaching room → resolve stale/stuck rep queues → run near-close pressure loop by rep.
3. **Owner/Admin:** Open command center → review zone risk + cash blocked + close-this-week → assign territory pressure.

## Dashboard fixes completed before launch
1. Official zone naming aligned to doctrine (TUF NORTH/WEST/METRO/SOUTH).
2. Opportunity close path upgraded with **PAYMENT_RECEIVED** stage before Closed Won.
3. Rep dashboard now exposes a direct **Payment Received** signal.
4. Sports ticker rebuilt to **Game Day Wire** without protected third-party brand treatment.
5. Sports wire includes configurable source-link slots and league score placeholders for NBA/NFL/CFB/WNBA.

## Remaining fixes recommended after launch
1. Add revenue-by-zone visualization card in owner dashboard.
2. Add explicit payment status field rendering in opportunity tables.
3. Add director override event log + dashboard widget.

---

## TUF Ops Quick Start (Day 1)

### Rep start-of-day (5 minutes)
1. Open **Rep Mission Brief**.
2. Read **Mission Priority** and execute top CTA first.
3. Check **4 Orders/Month pace** tile and **Lane Penetration Opportunity** panel.
4. Clear stale and near-close opportunities in **Next-Action Execution Queue**.
5. Move deals forward in opportunity detail; do not leave deals parked with no next action.

### Director start-of-day (10 minutes)
1. Open **Director Coaching Room**.
2. Review **Stuck Deals**, **Reps Needing Coaching**, and **Close This Week**.
3. Use **Coaching Queue** to prioritize reps with stale + stuck risk.
4. Run same-day follow-up huddle and assign explicit next actions.

### Owner/Admin territory review (10 minutes)
1. Open **Owner Command Center**.
2. Scan **Cash Blocked**, **Close This Week**, **Territory Risk**.
3. Work **Owner Action Queue** in order: assign leads → stale accounts → blocked orders → rep balance.
4. Pressure zone-level outcomes, not single deal micromanagement.

### Enter/update an opportunity
1. Go to Opportunities, open or create target opportunity.
2. Set lane, sport, season, value, assigned rep.
3. Update stage and next action after every customer movement.

### Move a deal through close path
- Lead Assigned → Contact Initiated → Discovery/Mockup In Progress → Mockup Approved (delivered) → Invoice Sent → Decision Pending → **Payment Received** → Closed Won.

### Request mockups/creative support
1. Open opportunity detail → **Creative Requests**.
2. Submit request type/team/priority/needed items/design notes/due date.
3. Track request status from same opportunity so creative flow is tied to close path.

### Read 4-order pace and lane penetration
- **4 orders/month:** use Monthly Standard ring and close cadence.
- **Lane penetration:** after Uniform wins, expand Team Store + Travel Gear + Letterman where fit.

---

## Full Tutorial

### 1) Rep workflow
- Start at Rep Mission Brief.
- Execute mission CTA, then run Next-Action queue by urgency: stale > near-close > discovery.
- Keep opportunity stages current; use PAYMENT_RECEIVED stage when cash confirms.
- Use earnings view to track contribution where available.

### 2) Director workflow
- Use Coaching Room metrics for triage.
- Coach reps with stuck/stale concentration first.
- Inspect rep pipeline strength and near-close gaps.
- Ensure each coached deal gets a next action + date.

### 3) Owner/Admin workflow
- Command territory health via command center cards and action queue.
- Evaluate zone risk and statewide close potential daily.
- Escalate resource shifts by zone and director needs.

### 4) Opportunity management
- Opportunity detail is source of truth for stage, next action, and creative linkages.
- Close path now includes PAYMENT_RECEIVED for invoice/payment clarity.

### 5) Reporting
- Use dashboard + team views for stale/near-close/pipeline coaching loops.
- Monthly standard and lane penetration are primary behavioral levers.

### 6) Territory/zone views
- Minnesota official zone language: **TUF METRO, TUF NORTH, TUF WEST, TUF SOUTH**.
- Territory pages should be reviewed daily for untouched accounts and risk.

### 7) Creative/mockup flow
- Creative requests are opportunity-bound and should be submitted from opportunity detail.
- Mockup and creative statuses should inform stage progression.

### 8) Earnings/commission visibility
- Reps/directors/owners can use role earnings pages for close-result visibility where available.
- Keep close stages and orders synced to improve accuracy.

### 9) Daily and weekly rhythm
- **Daily:** Mission priority first, stale cleanup, near-close push, coaching loop.
- **Weekly:** Zone review, lane expansion review, blocked cash review, coaching retros.

## Verification notes
1. Zone naming updated to official TUF zone doctrine in territory mock data.
2. Close path includes PAYMENT_RECEIVED and stage progression updated.
3. Rep dashboard surfaces payment-received signal.
4. Sports/media bar rebuilt as Game Day Wire with safe placeholders and configurable links.
5. No destructive schema/database migration performed.
