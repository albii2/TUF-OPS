# TUF Ops Rebuild Blueprint (Ground-Up, Better)

## 1) Context + Hypothesis from Current Workspace

This blueprint is based on the current repository state and documented baseline scope (`v0.2.4`).

Observed signals from the workspace:
- Root repository appears to be a monorepo shell with active app code under `apps/frontend` and a legacy/parallel scaffold under `TUF/`.
- Current verified scope is: auth, dashboard shell, organizations, opportunities.
- Deferred or unstable capabilities include invoices, analytics/reporting depth, and broader E2E confidence.
- Data model and runtime stack are Next.js + TypeScript + Prisma + Postgres + NextAuth.

**Inference:** a major risk is architectural drift (multiple app roots/patterns), inconsistent boundaries, and feature-level coupling between UI/server/data layers. The rebuild should enforce strict module boundaries, explicit contracts, and staged rollout by capability.

---

## 2) Rebuild Goals (What “Better” Means)

1. **Reliability first**: deterministic environments, strong CI gates, safe schema migration process.
2. **Clear architecture**: feature modules with explicit interfaces, no hidden cross-imports.
3. **Faster delivery**: reusable domain services, standardized UI patterns, template-driven feature scaffolding.
4. **Operational readiness**: observability, audit trails, data safeguards, role-based permissions.
5. **Scalability**: app remains fast at larger org/opportunity/order datasets and team growth.

---

## 3) Recommended Stack (Best-Fit for Your Use Case)

### Core platform
- **Monorepo orchestration:** Turborepo + pnpm workspaces.
- **Frontend app:** Next.js (App Router, TypeScript, server actions where appropriate).
- **Backend API:** NestJS (or Fastify) in a dedicated service for strict domain boundaries and non-UI workloads.
- **Database:** PostgreSQL (managed; with read replicas later if needed).
- **ORM/query:** Prisma for mainstream CRUD + SQL/Drizzle for heavy analytics queries.
- **AuthN/AuthZ:** Auth.js (NextAuth successor) + centralized RBAC policy engine (CASL/Oso or custom policy layer).
- **Background jobs:** BullMQ + Redis for invoices, sync, notifications, and long-running workflows.
- **Caching/queue infra:** Redis (cache/session rate limits + queue backbone).

### Quality + operations
- **Testing:** Vitest/Jest (unit), Playwright (E2E), Pact/contract tests for API boundaries.
- **Schema + contracts:** OpenAPI + Zod validation at edge/service boundaries.
- **Observability:** OpenTelemetry + Sentry + structured logs (pino) + metrics dashboard (Grafana/Datadog).
- **Infrastructure:** Terraform + GitHub Actions + preview environments.
- **Feature delivery controls:** LaunchDarkly/Unleash feature flags.

### Why this stack
- Keeps your current strengths (Next/TS/Postgres/Prisma).
- Introduces proper service and module boundaries to reduce regressions.
- Adds job processing and observability early so “hard” features (invoices, automation, analytics) are first-class.

---

## 4) New Repository Structure (Proposed)

```text
tuf-ops/
  apps/
    web/                      # Next.js UI (operators, managers, sales)
    api/                      # NestJS/Fastify BFF + domain orchestration
    worker/                   # BullMQ processors (invoices, reminders, sync)
    admin/                    # optional internal admin console
  packages/
    ui/                       # design system (shadcn-derived, branded)
    config/                   # eslint, tsconfig, prettier, env schemas
    auth/                     # shared auth/session/policy primitives
    db/                       # prisma schema, migrations, seed, db utils
    domain/
      organizations/          # entities, services, DTOs, tests
      opportunities/
      activities/
      invoices/
      reporting/
      users/
      workflow/
    sdk/                      # typed API clients for apps
    observability/            # logger, tracing, metrics setup
    testing/                  # shared test utils, factories, mocks
  infra/
    terraform/
    docker/
    k8s/                      # optional if/when needed
  docs/
    architecture/
    adr/                      # Architecture Decision Records
    runbooks/
    product/
      version-map.md
      capability-maps/
  .github/
    workflows/
  turbo.json
  pnpm-workspace.yaml
```

### Structural rules
- No app imports directly from another app.
- Domain logic lives in `packages/domain/*`, not in page components.
- Prisma models and migrations are centralized in `packages/db`.
- API contracts/versioning are owned by `apps/api` + `packages/sdk`.

---

## 5) Core Function Map (Current → Target)

## Version map baseline (inferred from current repo)
- **v0.2.4 (Now):** auth, app shell/dashboard, organizations CRUD basics, opportunities create/list/detail basics.
- **Deferred in baseline:** invoices, richer analytics/reporting, robust E2E strategy, advanced workflow automation.

## Capability map for rebuilt system

### A. Identity, Access, Security
**Scope**
- Email/password + SSO-ready architecture.
- Session management, role hierarchy, org-scoped permissions.
- Audit log of security-sensitive events.

**Design**
- Auth.js for sessions.
- Policy checks at API route and service layers.
- `AuditEvent` entity populated by middleware + domain events.

**Roadblocks to avoid**
- Auth checks only in UI (must also be server-enforced).
- Permission sprawl in components (centralize policy functions).

### B. Organizations (CRM foundation)
**Scope**
- Create/edit/view organizations.
- Ownership, statuses, tags, lifecycle stage.
- Data quality constraints (required fields, duplicate detection).

**Design**
- Domain module with repository + service pattern.
- Idempotent create endpoints with duplicate key strategy.
- Fuzzy-match duplicate checker in background worker.

**Roadblocks to avoid**
- Direct DB writes from route handlers.
- Missing unique constraints for business identity fields.

### C. Opportunities (pipeline engine)
**Scope**
- Opportunity lifecycle, stage transitions, owner, value, expected close date.
- Mandatory relation to organization.
- Stage-based validation and SLA triggers.

**Design**
- Workflow engine module with explicit transition rules.
- Immutable stage transition history table.
- Domain events: `OpportunityCreated`, `StageChanged`, `Won/Lost`.

**Roadblocks to avoid**
- “Freeform” stage updates without guardrails.
- Derived metrics calculated in UI instead of backend.

### D. Activities + Timeline
**Scope**
- Logged calls/emails/notes/tasks tied to orgs/opportunities.
- Unified chronological timeline.

**Design**
- Polymorphic activity schema with strict enums.
- Read-optimized timeline query endpoint.

**Roadblocks to avoid**
- Fragmented activity types with inconsistent filters.

### E. Invoices + Order Processing
**Scope**
- Invoice creation, draft/finalized states, PDF generation, delivery status.
- Link invoices to opportunities/orders.
- Payment-status ingestion (manual initially, integration-ready later).

**Design**
- Separate invoice bounded context.
- Job queue for PDF generation + async delivery.
- Immutable finalized invoice snapshots.

**Roadblocks to avoid**
- Synchronous PDF generation in request cycle.
- Mutable finalized invoices without event records.

### F. Dashboard + Reporting
**Scope**
- Pipeline snapshot, near-close, owner leaderboard, revenue trend.
- Executive vs contributor views.

**Design**
- Read models/materialized views for key metrics.
- Metric definitions documented and versioned.

**Roadblocks to avoid**
- Live expensive joins per request.
- KPI definition drift between teams.

### G. Notifications + Automation
**Scope**
- Follow-up reminders, stale opportunity nudges, invoice overdue alerts.

**Design**
- Domain-event-driven triggers via queue.
- Notification preferences and digest cadence.

### H. Admin + Settings
**Scope**
- User management, role assignment, reference data (stages, statuses, templates).
- Tenant/org-level config.

**Design**
- Admin-only routes, config tables with audit trails.

### I. Integrations
**Scope**
- CRM exports, accounting integrations, webhooks.

**Design**
- Outbox pattern for reliable external event delivery.
- Retry policy + dead letter queue.

---

## 6) Data Architecture Blueprint

### Modeling principles
- Strong foreign keys and cascading rules intentionally defined.
- Soft-delete where needed + `deleted_at` indexing.
- `created_by`, `updated_by`, and audit correlation IDs for compliance.

### Essential tables (high-level)
- `users`, `roles`, `user_roles`
- `organizations`, `organization_contacts`, `organization_tags`
- `opportunities`, `opportunity_stage_history`, `opportunity_forecasts`
- `activities`, `tasks`
- `invoices`, `invoice_line_items`, `invoice_events`
- `audit_events`, `outbox_events`, `job_runs`

### Performance strategy
- Composite indexes on `(org_id, status)`, `(owner_id, stage)`, `(close_date, stage)`.
- Materialized views for reporting-heavy dashboards.
- Pagination by cursor, not offset, on large timelines/pipelines.

---

## 7) Delivery Plan (Rebuild Sequence)

## Phase 0 — Foundations (2–3 weeks)
- Bootstrap monorepo, lint/type/test standards, CI pipeline.
- Set up auth skeleton, environment management, observability baseline.
- Define ADRs for architecture, RBAC, data migration, and API style.

**Exit criteria:** local dev in <15 mins, CI deterministic, tracing/logging visible.

## Phase 1 — Core CRM Vertical Slice (3–4 weeks)
- Implement organizations + opportunities end-to-end in new architecture.
- Add workflow transitions and stage history.
- Add unit/integration/E2E smoke for these flows.

**Exit criteria:** parity with current v0.2.4 core flow and better test confidence.

## Phase 2 — Activities + Dashboard Read Models (2–3 weeks)
- Add activities timeline and normalized engagement model.
- Build reporting read models and KPI definitions.

**Exit criteria:** dashboards run from read models, no heavy request-time joins.

## Phase 3 — Invoicing + Async Processing (3–4 weeks)
- Implement invoice lifecycle, PDF generation jobs, status tracking.
- Add retry/dead-letter handling and operational runbooks.

**Exit criteria:** invoice workflows are asynchronous, observable, and recoverable.

## Phase 4 — Hardening + Migration Cutover (2–3 weeks)
- Parallel run strategy, data migration verification, rollback drills.
- Performance tuning + security review + incident rehearsal.

**Exit criteria:** production cutover with agreed SLOs and rollback confidence.

---

## 8) Testing + Quality Gates (Non-Negotiable)

- **Unit tests** for domain services: >85% on business-critical modules.
- **Integration tests** for DB + API contracts.
- **E2E tests** for core money/user-impacting paths.
- **Migration tests** against anonymized production-like snapshots.
- **Performance tests** for dashboard and list endpoints at realistic scale.

CI gates:
1. typecheck
2. lint
3. unit + integration
4. contract tests
5. E2E smoke
6. migration drift check

---

## 9) Risk Register + Mitigations

1. **Scope creep during rebuild**
   - Mitigation: capability-based milestones, strict change control, ADR process.
2. **Data migration mismatches**
   - Mitigation: repeatable dry runs + validation scripts + rollback plan.
3. **Auth/permissions regressions**
   - Mitigation: policy test matrix + audit event assertions.
4. **Slow dashboards at scale**
   - Mitigation: read models/materialized views + precompute jobs.
5. **Operational blind spots**
   - Mitigation: tracing, alerting, runbooks before feature completion.

---

## 10) Team Workflow + Governance

- Product/tech lead maintains version map and acceptance criteria per capability.
- Every capability has:
  - ADR reference
  - API contract
  - migration plan
  - observability checklist
  - test matrix
- PR template requires: risk level, rollout plan, rollback plan.

---

## 11) “Build It Better” Implementation Rules

1. No feature merges without tests at the right layer.
2. No schema changes without backward-compatible migration path.
3. No new dashboard metric without documented source-of-truth definition.
4. No hidden business logic in UI components.
5. No external integration without retry/idempotency strategy.

---

## 12) First 30-Day Execution Plan

### Week 1
- Finalize architecture decisions + repo bootstrap + CI skeleton.
- Define domain models for orgs/opportunities and migration strategy.

### Week 2
- Implement auth/RBAC baseline + organizations module + tests.

### Week 3
- Implement opportunities workflow + stage history + events.

### Week 4
- Build initial dashboards from read models, harden E2E, prep pilot rollout.

**Day-30 target:** fully functional and tested replacement for v0.2.4 core flow with stronger architecture and release confidence.

---

## 13) What to Keep from Current Build

Keep:
- Next.js + TypeScript + Postgres + Prisma foundation.
- Existing domain understanding and UI lessons.
- Existing core relationship between organizations and opportunities.

Change aggressively:
- Module boundaries and architectural consistency.
- Observability/testing discipline.
- Async processing and reporting strategy.
- Repo structure and domain ownership model.

