# WEB Business Logic Coverage Audit (apps/web)

## Executive summary
`apps/web` is a stable mock-backed beta shell with working role-aware routing, typed data/services/hooks, and core list/detail pages. It is usable for directional walkthroughs, but not yet complete for real internal workflow execution by Owner/Director/Rep/Ops teams.

Primary gaps are: richer order lifecycle statuses, territory + assignment tooling, owner CSV import flow, structured stage actions (mockup/sample/invoice/payment), profitability/commission logic, and role-grade reporting/export workflows.

The uploaded dashboard mockup defines the target module grid and density. The app should standardize each role dashboard to the same module skeleton and size rhythm:
1) Today’s Focus (3 pills)
2) Next Actions
3) Pipeline Snapshot
4) Revenue
5) Deals Near Close
6) Recent Activity
7) Bottom progress/goal module

---

## Route-by-route audit

### /login
- Purpose: mock auth entry.
- Current: PIN-only login (`0000`), localStorage user persistence.
- Missing: role-aware PIN presets, failed-attempt guardrails, mock org context selector.
- Roles: all.
- Beta readiness: **Partial**.
- Required additions: role quick-login presets and mock security messaging.

### /dashboard
- Purpose: role command center.
- Current: role-specific cards/queues present and mockup-like structure exists.
- Missing: strict module parity per mockup for all roles; stable card sizes/row counts per role; deeper business KPIs (profit, commissions, stale/untouched).
- Roles: Owner/Director/Rep/Ops.
- Beta readiness: **Partial**.
- Required additions: module parity matrix + exact widget sizing/rhythm lock.

### /organizations
- Purpose: account pipeline management.
- Current: searchable/filterable table, priority sorting, lane summary, next action, new org CTA.
- Missing: CSV import, bulk assign rep/director/territory, untouched/stale views.
- Roles: Owner/Director/Rep.
- Beta readiness: **Partial**.
- Required additions: bulk import UI flow and assignment actions.

### /organizations/:id
- Purpose: account growth control center.
- Current: lane cards, active opportunities, orders count, expansion recommendation, activity feed.
- Missing: territory metadata, contact metadata, lane attack playbooks, profit views.
- Roles: Owner/Director/Rep/Ops(read).
- Beta readiness: **Partial**.
- Required additions: territory and assignment edits, structured growth actions.

### /organizations/new
- Purpose: create organization record.
- Current: basic name/account type input and normalization.
- Missing: full business intake fields (territory, contacts, enrollment/classification).
- Roles: Owner/Director/Rep.
- Beta readiness: **Partial**.
- Required additions: full form schema and validation.

### /opportunities
- Purpose: sales pipeline management.
- Current: searchable/filterable list with stage/lane/rep/sport and near-close prioritization.
- Missing: stale deal views, stage action shortcuts, commission/expected margin columns.
- Roles: Owner/Director/Rep.
- Beta readiness: **Partial**.
- Required additions: stage action controls and margin/commission visibility.

### /opportunities/:id
- Purpose: close-plan execution.
- Current: stage progress, next action CTA, timeline, invoice/payment section placeholders.
- Missing: mockup request lifecycle, sample lifecycle, invoice/payment state machine.
- Roles: Owner/Director/Rep.
- Beta readiness: **Partial**.
- Required additions: explicit mock action panels per stage.

### /opportunities/new
- Purpose: structured opportunity creation.
- Current: structured naming preview from level/sport/season/lane.
- Missing: assignment defaults, close probability defaults, expected close date, mockup trigger.
- Roles: Rep/Director.
- Beta readiness: **Partial**.
- Required additions: workflow fields + draft validation.

### /orders
- Purpose: order execution queue.
- Current: searchable queue with status filters and blocker column.
- Missing: expanded order lifecycle statuses (NEW_ORDER, MISSING_INFO, QC, SHIPPED, etc.).
- Roles: Ops/Owner.
- Beta readiness: **Partial**.
- Required additions: full status taxonomy and queue tabs.

### /orders/:id
- Purpose: sales-to-ops handoff detail.
- Current: source opportunity, production status, blockers, vendor notes, activity.
- Missing: handoff checklist completeness, SLA timings, shipment milestones.
- Roles: Ops/Owner/Director(read).
- Beta readiness: **Partial**.
- Required additions: handoff completeness score + stage milestones.

### /ops-workspace
- Purpose: ops-focused queue board.
- Current: queue snapshot via mock workspace data.
- Missing: blocker resolution workflow and vendor submission flow.
- Roles: Ops/Owner.
- Beta readiness: **Partial**.
- Required additions: queue actions and reason codification.

### /reports
- Purpose: reporting and exports.
- Current: weekly/monthly + lane/rep cards + export placeholders.
- Missing: director/owner report variants, downloadable CSV/PDF placeholders by report type.
- Roles: Owner/Director.
- Beta readiness: **Partial**.
- Required additions: report presets, filters, and mock download UX.

### /settings
- Purpose: workspace preferences.
- Current: placeholder cards.
- Missing: business-relevant controls (default territory, dashboard density, targets, commission assumptions).
- Roles: all.
- Beta readiness: **Not ready**.
- Required additions: useful beta controls.

---

## Role-by-role workflow audit

## Owner
- Can: view dashboards/tables, switch roles, inspect lanes/pipeline, view reports placeholders.
- Cannot: CSV import, territory assignment, bulk rep/director assignment, COGS/profit/commission analytics.
- Needed before beta use: import + assignment tooling, owner report pack, stuck/blocked rollups.
- Can stay mock-only: persistence/export backend.
- Must be real UI now: CSV upload/preview/validation/summary flow, territory assignment UI.

## Director
- Can: inspect organizations/opportunities and dashboard summaries.
- Cannot: territory dashboard depth, stale account queue, stuck deals by rep drilldowns, downloadable weekly/monthly report UX.
- Needed before beta use: coaching and accountability surfaces by rep.
- Can stay mock-only: actual file generation.
- Must be real UI now: filtered accountability dashboard and stale queue panels.

## Rep
- Can: view assigned-looking data, create basic org/opportunity with naming preview, use pipeline filters.
- Cannot: complete daily task board with action completion states, sample tracking, invoice/payment tracking, commission estimate.
- Needed before beta use: stage action workflow and monthly target widget with commission estimate.
- Can stay mock-only: actual invoice sync/payment sync.
- Must be real UI now: stage action forms (mockup/sample/invoice/payment placeholders).

## Ops
- Can: view order queue and blockers, order details, ops workspace snapshot.
- Cannot: full order lifecycle queues and handoff checklist logic.
- Needed before beta use: all statuses from spec, blocker reason taxonomy, handoff completeness.
- Can stay mock-only: vendor API submission.
- Must be real UI now: queue actions and reason checklists.

---

## Business logic concept coverage matrix

- account type ✅ (config + new org form)
- program level ✅ (new opportunity form)
- sport ✅
- season code ✅
- lane ✅
- opportunity stage ✅
- next action ✅
- assigned rep ✅
- assigned director ✅
- territory ❌ (missing explicit field/model/ui)
- close probability ✅
- estimated value ✅
- actual revenue ⚠️ (dashboard aggregate only, no actual-vs-forecast model)
- cost/COGS ❌
- gross profit ❌
- commission estimate ❌
- mockup status ⚠️ (stage text only; no dedicated object/state)
- sample status ❌
- invoice status ⚠️ (implied by stage)
- payment status ⚠️ (implied text)
- order status ⚠️ (limited subset)
- blocker reason ✅ (missingInfo + notes)
- vendor ✅
- missing info checklist ✅
- activity feed ✅

---

## Owner CSV import workflow spec (/organizations)

1. **Upload CSV**
   - drag/drop or file picker
   - show filename, rows detected, delimiter

2. **Preview + field mapping**
   - auto-map required fields:
     - organization_name
     - account_type
     - city
     - state
   - optional fields:
     - classification/enrollment
     - primary_contact_name
     - primary_contact_email
     - sport/program
     - assigned_rep
     - assigned_director
     - territory

3. **Validation pass**
   - required columns present
   - row-level required values
   - state normalization
   - account type membership validation

4. **Normalization pass**
   - title case organization names
   - normalize sport/program and assigned person name spacing

5. **Duplicate detection**
   - by `organization_name + state`
   - categorize as exact match / probable duplicate / new

6. **Assignment defaults**
   - fallback rep/director/territory from owner-selected defaults

7. **Import summary**
   - counts: created, updated, duplicates skipped, invalid

8. **Error report**
   - downloadable CSV of invalid rows + reason

9. **Mock behavior now**
   - no backend persistence required
   - imported rows can be stored in client state/session for demo

---

## Recommended implementation phases

## Phase 1 — Business constants + naming normalization
- Extend constants for territory and order full status list.
- Acceptance: all form dropdowns standardized; naming utility used across creation/import.

## Phase 2 — Organization CSV import UI mock flow
- Build upload → mapping → validate → summary wizard in `/organizations`.
- Acceptance: owner can run a full mock import cycle and see result counts + errors.

## Phase 3 — Opportunity creation workflow + structured naming
- Add assignment, close probability, expected close date, stage start.
- Acceptance: new opportunity form produces complete structured record preview.

## Phase 4 — Sales stage actions + mockup/invoice/sample placeholders
- Stage panels for request mockup, sample status, invoice sent, payment follow-up.
- Acceptance: reps can complete a full mock close path UI without backend.

## Phase 5 — Ops handoff + blocked order logic
- Introduce full order status enum and queue views.
- Acceptance: ops can move mock orders across statuses and capture blocker reasons.

## Phase 6 — Role-specific dashboards and reports
- Lock all role dashboards to mockup module set/sizing.
- Owner/Director report packs with downloadable placeholders.
- Acceptance: each role sees exact module scaffold from mockup with role-specific content.

---

## Recommended first implementation slice
**Phase 2 (CSV import UI mock flow)** should be first:
- Highest owner value
- Immediately increases data realism in beta
- Unblocks downstream territory/assignment workflows
- Can remain fully mock-backed without backend coupling
