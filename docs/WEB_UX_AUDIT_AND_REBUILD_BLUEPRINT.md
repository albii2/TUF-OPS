# TUF Ops Web UX Audit and Rebuild Blueprint

**Date:** April 29, 2026  
**Scope:** `apps/web` frontend only (mock-data mode)  
**Role:** Senior Product Engineer + UX Systems Architect

---

## Executive Summary

The current `apps/web` beta is a **functional technical scaffold** with working routes, mock-backed data services, and role-aware access controls. It is useful for navigation and basic click-throughs, but it does **not yet operate like a high-output sales execution system**.

Primary gaps:
- Visual hierarchy is too flat/dim for rapid scanning under pressure.
- Role-specific workflow intent is weak (OWNER/DIRECTOR/REP/OPS should feel operationally distinct).
- Table-driven pages are mechanically functional but not optimized for action sequencing, urgency, accountability, or coaching loops.
- Dashboard state is partially generic and insufficiently tied to lane expansion and close velocity.

The next phase should be a **controlled UX systems rebuild**, preserving route surface area while upgrading information architecture, scanability, action hierarchy, and role-native operating rhythms.

---

## Current-State Critique

### Strengths
- Clear route map and app shell structure with protected routing.
- Service/hook adapter layer exists, so page data can migrate to APIs without wholesale rewrites.
- Core sales objects and lane/stage models are typed and centralized in mock data.

### Weaknesses
1. **Dark UI contrast imbalance**
   - Too many layers sit near similar luminance values (card/body/table backgrounds), reducing visual separation.
2. **Weak action hierarchy**
   - Important actions are visually similar to non-critical controls.
3. **Generic layout feel**
   - Reads like a standard admin interface, not a territory domination cockpit.
4. **Role psychology under-modeled**
   - Role-based permission exists, but role-based *decision framing* is shallow.
5. **Page purpose drift**
   - Several pages present data but do not strongly answer the decision question that role needs in that moment.

---

## Role-by-Role UX Goals

### OWNER
Must answer in under 60 seconds:
- Where are we winning/losing by lane and territory?
- Which reps/directors need intervention today?
- What expansion bets produce highest marginal revenue this week?

### DIRECTOR
Must answer in under 60 seconds:
- Which reps are late on follow-up and stage progression?
- Which accounts are stalled by lane and why?
- What coaching actions move near-close deals this week?

### REP
Must answer in under 30 seconds:
- Who do I contact first right now?
- Which deals are closest to close and what is the exact next action?
- Am I on pace for monthly target/commission?

### OPS
Must answer in under 30 seconds:
- What orders are blocked or missing data?
- What can be routed to vendor immediately?
- What handoffs are at risk of SLA slippage?

---

## Current Route Audit

## `/login`
- **Currently does:** PIN login with minimal UI.
- **Should do:** Fast, confidence-building entry with unmistakable environment identity.
- **Missing:** Session clarity (role badge), quick switch for test personas in non-prod.
- **Remove:** None.
- **Redesign:** Slightly stronger contrast and clearer microcopy for beta mode.

## `/dashboard`
- **Currently does:** REP has focused card set; other roles use generic widgets.
- **Should do:** Fully role-native command views with operational narratives.
- **Missing:** Lane penetration momentum, risk alerts, owner/director coaching queue quality.
- **Remove:** Randomized generic metric placeholders.
- **Redesign:** Distinct dashboard templates per role with deterministic metrics and urgency stack.

## `/organizations`
- **Currently does:** Search/filter/paginated table with lane status badges.
- **Should do:** Territory account command board; lane expansion opportunity scan.
- **Missing:** Priority scoring, stale account highlighting, lane whitespace opportunities.
- **Remove:** Non-informative “Open” action redundancy where row click exists.
- **Redesign:** Density-optimized table row anatomy + urgency indicators + last-touch decay signal.

## `/organizations/:id`
- **Currently does:** Header, lane cards, active opportunities, activity.
- **Should do:** “How much can we extract and what’s next lane move?” decisively.
- **Missing:** Expansion play recommendation confidence and blockers by lane.
- **Remove:** Placeholder CTA language.
- **Redesign:** Lane playbook row per lane with explicit move-to-next-state controls.

## `/opportunities`
- **Currently does:** Pipeline table with filter set.
- **Should do:** Close-velocity execution board.
- **Missing:** Aging-in-stage visualization and urgency ranking.
- **Remove:** Neutral presentation of late-stage and early-stage deals as equals.
- **Redesign:** Near-close sorting defaults + stage SLA breach badges.

## `/opportunities/:id`
- **Currently does:** Stage progress, next action, activity, placeholders.
- **Should do:** “Money page” with explicit close plan and handoff readiness.
- **Missing:** Stage exit criteria checklist, confidence trajectory, close blockers.
- **Remove:** Generic placeholders without operational intent labels.
- **Redesign:** Decision cockpit: stage criteria, win plan, and order handoff readiness strip.

## `/orders`
- **Currently does:** Order queue table with status filter.
- **Should do:** SLA risk and handoff completion monitor.
- **Missing:** SLA age, blocker severity, ownership signals.
- **Remove:** Low-signal static wording.
- **Redesign:** Queue defaults to “Needs Review + Blocked”; explicit missing-info urgency.

## `/orders/:id`
- **Currently does:** Header, linked opportunity, notes/checklist/activity.
- **Should do:** Resolution workspace for unblocking and vendor readiness.
- **Missing:** Missing-info completion state machine and ownership accountability.
- **Remove:** Passive placeholder-only sections.
- **Redesign:** Checklist-first remediation flow with status transitions.

## `/ops-workspace`
- **Currently does:** Column queue by production status.
- **Should do:** Throughput and bottleneck control center.
- **Missing:** Queue aging and WIP limits.
- **Remove:** Equal visual weight for all queues.
- **Redesign:** Bottleneck-first ordering and triage emphasis.

## `/reports`
- **Currently does:** Summary cards and lane/rep breakdown.
- **Should do:** Decision-ready performance insight by role.
- **Missing:** Time-comparison and exception-driven narratives.
- **Remove:** Flat repeated metric blocks.
- **Redesign:** Delta-driven summaries (WoW/MoM) and outlier surfacing.

## `/settings`
- **Currently does:** Placeholder panels.
- **Should do:** Personal operating preferences + role defaults (eventually).
- **Missing:** Actual preference semantics.
- **Remove:** None yet.
- **Redesign:** Keep lightweight until functional settings exist.

---

## Separation-of-Concerns Findings

1. **Data still composed in pages**
   - Hooks/services exist, but some pages perform additional cross-entity filtering inline.
2. **Role logic scattered**
   - Access and role display logic split across auth, route guards, shell, and dashboard.
3. **Component taxonomy underdeveloped**
   - Primitives exist but “sales semantics” components (UrgencyBadge, StageAgeChip, LanePotentialMeter) are absent.
4. **Mixed presentational/domain language**
   - Placeholder copy and domain logic coexist in production route components.

---

## UX Problem Inventory

### Readability
- Subtle text/ground contrast on dense panels slows scanning.

### Spacing and density
- Some screens underutilize space for key data while overusing generic card padding.

### Table scanability
- Strong filters exist; row hierarchy and urgency semantics are weak.

### Action hierarchy
- Critical actions visually resemble secondary actions.

### Mobile readiness
- Baseline responsive behavior exists but action-first mobile execution patterns remain incomplete.

---

## Proposed New App Architecture (No route changes)

1. Keep route map as-is.
2. Introduce semantic UI layer on top of primitives:
   - `MetricCard`, `UrgencyBadge`, `StageTimeline`, `ActionQueueList`, `LaneStackCard`, `RiskPanel`.
3. Move page-level derived calculations into domain selectors/services.
4. Keep hooks as page data boundary; no direct data imports in pages.

---

## Proposed Role Navigation

### OWNER Nav Emphasis
Dashboard, Organizations, Pipeline, Ops Workspace, Reports, Settings.

### DIRECTOR Nav Emphasis
Dashboard, Organizations, Pipeline, Reports, Settings.

### REP Nav Emphasis
Dashboard, Organizations, Pipeline, Orders, Settings.

### OPS Nav Emphasis
Dashboard, Orders, Ops Workspace, Organizations, Settings.

(Underlying route availability remains controlled and unchanged where needed.)

---

## Proposed Dashboard Layouts

### OWNER Command Dashboard
- Revenue stack by lane + territory.
- Pipeline at risk this week.
- Director/rep accountability panel.
- Expansion opportunity heat list.

### DIRECTOR Coaching Dashboard
- Rep follow-up compliance.
- Stuck accounts by lane.
- Near-close deals by rep with next action due.

### REP Action Dashboard
- Today’s 5 critical actions.
- Near-close queue by probability and urgency.
- Monthly target pacing + commission estimate.

### OPS Throughput Dashboard
- New vs blocked vs in-production trend.
- Missing info queue with owner attribution.
- Vendor-ready handoff list.

---

## Proposed Organizations Workflow

- List defaults to high-priority sorting.
- Add “lane whitespace” indicator per account.
- Detail page: lane-by-lane playbook with explicit next move and blocker list.

---

## Proposed Opportunities Workflow

- List defaults near-close + aging-in-stage.
- Detail introduces stage exit checklist and handoff readiness.
- Make next action and due context primary above fold.

---

## Proposed Ops Workflow

- Orders list prioritizes blocked and missing-info orders.
- Ops workspace adds bottleneck signal and queue aging.
- Order detail becomes remediation-first workspace.

---

## Proposed Reports Workflow

- Shift from static summaries to exception-led insights.
- Add role toggle perspectives (owner/director/rep/ops views over same base metrics).
- Emphasize trend delta and outlier alerts.

---

## Design System Recommendations

### Contrast and palette
- Preserve dark mode but increase luminance separation between app background, panel background, and row background.
- Keep cyan/blue accents; reserve high-chroma accent only for urgent actions.

### Typography
- Define explicit hierarchy for:
  - KPI values
  - section headers
  - table metadata
  - helper text

### Card hierarchy
- Three card tiers: primary decision cards, secondary context cards, tertiary informational cards.

### Table styling
- Improve row striping/hover contrast, fixed headers on dense lists, concise metadata columns.

### Badge language
- Replace ambiguous labels with operational labels:
  - `AT_RISK`, `STALE`, `DUE_TODAY`, `BLOCKED`, `READY`.

### Status colors
- Keep restrained semantic palette:
  - Neutral slate: informational
  - Cyan/blue: active progress
  - Amber: risk/attention
  - Red only for blockers/critical failures (not brand)

### Accent usage
- Use accent as intent indicator, not decoration.

---

## Controlled Implementation Phases

### Phase 0 — UX contract alignment
- Finalize role decision questions and KPI definitions.
- Freeze route scope.

### Phase 1 — Visual system hardening
- Contrast, typography scale, card/table tokens, badge semantics.

### Phase 2 — Role dashboard rebuild
- OWNER, DIRECTOR, REP, OPS dashboard templates.

### Phase 3 — Workflow page upgrades
- Organizations + opportunities + orders + ops workspace redesign within existing routes.

### Phase 4 — Reports and settings refinement
- Reports insight layering and settings semantic cleanup.

### Phase 5 — QA and readiness
- Validate against checklist and role-based acceptance gates.

---

## Acceptance Criteria by Phase

### Phase 1 Acceptance
- All key text meets readable contrast in dark mode.
- Tables are quickly scannable at default zoom.

### Phase 2 Acceptance
- Each role dashboard answers its top 3 business questions within 60 seconds.

### Phase 3 Acceptance
- Rep can identify next-best action in under 30 seconds.
- Director can identify top coaching interventions in under 60 seconds.
- Owner can identify revenue risks and lane expansion targets in under 60 seconds.
- Ops can identify and act on blocked orders in under 30 seconds.

### Phase 4 Acceptance
- Reports highlight deltas/outliers, not just static totals.

### Phase 5 Acceptance
- Route QA checklist passes with no blocking runtime errors.
- UX sign-off from product + sales leadership for role workflows.

---

## Final Recommendation

Do **not** replace route map or underlying object model yet. Keep technical architecture stable and execute a focused UX systems rebuild emphasizing:
- role psychology
- action hierarchy
- scan speed
- accountability loops
- lane-driven revenue outcomes

This preserves engineering velocity while turning the beta from a dark admin shell into a true sales execution operating system.
