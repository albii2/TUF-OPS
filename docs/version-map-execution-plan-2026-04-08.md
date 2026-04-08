# TUF Ops — v0.3.5 → v0.4.0 Execution Plan (Repository-Aligned)

_Date: 2026-04-08_

## 1) Current baseline (what is true in code now)

### Product surface is in place (Phase I mostly complete)
- Dashboard command center is live with actionable summary cards and owner/stage views.
- Table foundation exists for organizations and opportunities (search, sort, pagination scaffolding).
- Detail pages and form primitives are present and reusable.
- Empty-state components are present.

### CRM core is largely in place (Phase II late)
- Organizations and opportunities are modeled in Prisma and connected.
- Owner assignment and role-scoped visibility exist (`admin | director | rep`).
- Dashboard metrics are backed by Prisma aggregates and counts.

### Workflow engine is partial (Phase III in progress)
- `nextStep` and `nextStepDueDate` exist and are used by metrics.
- Mockup request flow exists via Trello route.
- Several legacy endpoints are intentionally deprecated (HTTP 410).

## 2) Key gap blocking v0.4.0 completion

## Gap A — Canonical stage model drift
The repository currently has two stage taxonomies:
1. **Persisted enum in Prisma** (`lead`, `contacted`, `mockup`, `sample`, `invoice`, `closed_won`, `closed_lost`)
2. **Workflow helper taxonomy** (`lead_identified`, `contacting`, `discovery`, `mockup_requested`, etc.)

This divergence creates product inconsistency and blocks disciplined state transitions.

### Decision required (non-negotiable)
Choose one authoritative taxonomy for the next production cycle:
- **Option 1 (recommended for velocity):** keep persisted enum for now, define canonical substate fields.
- **Option 2 (larger migration):** migrate Prisma enum to the new detailed lifecycle.

## 3) Recommended path: v0.4.0 in two controlled slices

### Slice 1 — v0.4.0a (1-2 PRs): state discipline without risky enum migration
1. Keep current Prisma `OpportunityStage` enum.
2. Add explicit workflow substate fields:
   - `workflow_step` (string enum-like)
   - `workflow_status` (`active|blocked|waiting|done`)
   - `workflow_reason` (nullable text)
3. Add server-side transition guards (single transition map).
4. Expose transition helper in API + server actions.
5. Show transition history event records in a lightweight activity table.

**Outcome:** disciplined transitions immediately, minimal migration risk.

### Slice 2 — v0.4.0b (later): optional enum expansion
1. Add new detailed enum values in Prisma.
2. Backfill from legacy values via migration script.
3. Cutover UI selectors/forms/APIs.
4. Remove compatibility mapping.

**Outcome:** full canonical stage model after safe hardening.

## 4) First implementation backlog (ordered)

### B1 — Transition map + validator
- Create `src/lib/workflow/transitions.ts` with allowed from→to edges.
- Enforce in:
  - `src/lib/opportunities/mutations.ts`
  - `src/app/api/opportunities/[id]/route.ts`

Acceptance:
- illegal transitions return 400/throw structured error.
- legal transitions update stage + timestamps.

### B2 — Workflow event log (foundation for v0.4.2)
- Add `OpportunityEvent` model:
  - `opportunityId`, `actorUserId`, `eventType`, `fromStage`, `toStage`, `metadata`, `createdAt`.
- Write event records on every stage transition and owner change.

Acceptance:
- stage changes appear in detail timeline (latest 20 events).

### B3 — Next-step discipline hardening (v0.4.1)
- Require non-empty `nextStep` for non-terminal active opportunities.
- Add due-date required rule for specified stages.
- Add overdue badge + stale badge in table rows.

Acceptance:
- create/update blocked when required next-step fields are missing.

### B4 — Replace 410 placeholders with thin vertical slices
- Prioritize one endpoint at a time with schema-backed minimal implementation:
  1. `/api/activities`
  2. `/api/samples`
  3. `/api/invoices`

Acceptance:
- each endpoint supports at least GET list + POST create with auth checks.

### B5 — Role ladder expansion prep (Phase IV readiness)
- Extend role enum/type to planned launch roles:
  - `national_director`, `regional_director`, `territory_manager`, `sales_rep`, `ops_user`, `finance_support`.
- Add compatibility map from current 3 roles.

Acceptance:
- no page breaks; fallback policy for unmapped roles.

## 5) Technical debt to close immediately

1. Remove commented “assuming” notes in workflow form and enforce active resolver.
2. Remove unused imports/vars in DataTable and related UI files.
3. Add test gate script for frontend checks and require in PR template.

## 6) Done definition for v0.4.0 milestone

A build is considered v0.4.0-complete when all are true:
- single authoritative stage transition policy enforced server-side.
- every stage mutation writes an immutable event record.
- next-step + due-date discipline enforced for active deals.
- dashboard "What should happen next" cards are sourced from transition-safe data.
- no contradictory stage taxonomies in user-facing flows.

## 7) Suggested PR sequence (safe rollout)

1. **PR-1:** transition map + server validation
2. **PR-2:** opportunity event model + writes
3. **PR-3:** timeline UI on opportunity detail
4. **PR-4:** next-step hard rules + badges
5. **PR-5:** `/api/activities` minimal replacement of 410

Each PR should run:
- `pnpm --filter frontend exec tsc --noEmit`
- `pnpm --filter frontend lint`
- `pnpm --filter frontend build`

