# Release Readiness Checklist

This document must be completed and signed off before any version is promoted to the next environment.

## Version: `vX.X.X`

## Review Date: `YYYY-MM-DD`

## Participants

- [ ] Lead Engineer: 
- [ ] Product Manager: 
- [ ] QA Engineer: 

---

## I. Standard Definition of Done (DoD)

This section ensures that all work included in the release meets the baseline quality standards.

- [ ] **Product Acceptance:** All product acceptance criteria for the included features have been met and signed off by the Product Manager.
- [ ] **Test Coverage:** Unit, integration, and E2E test coverage is complete for the changed scope and meets the required thresholds.
- [ ] **Observability:** New critical paths have appropriate logging, tracing, and monitoring hooks.
- [ ] **Security:** The security checklist has been completed for any new surface area (APIs, packages, etc.).
- [ ] **Runbook:** Deployment, rollback, and failure triage procedures have been updated in the operational runbook.
- [ ] **ADRs:** Any architectural decisions made during the development of this version have been documented in an ADR.
- [ ] **Feature Flags:** All new features are controlled by feature flags, and the rollout strategy is documented.

---

## II. Phase Gate Verification

This section verifies that the specific exit gates for the current development phase have been met.

### Gate G1 — Architectural Integrity
- [ ] **Module Boundaries:** CI checks for module boundary violations are passing.
- [ ] **Forbidden Imports:** No new forbidden cross-import violations have been introduced.
- [ ] **ADR Approval:** All new ADRs have been reviewed and approved.

### Gate G2 — Environment Reliability
- [ ] **Bootstrap Verification:** The fresh-machine bootstrap process has been documented and verified.
- [ ] **Env Schema Validation:** The environment schema validation correctly blocks application startup on invalid or missing variables.
- [ ] **Preview Environments:** Preview environments are auto-provisioning correctly for pull requests.

### Gate G3 — Data Safety
- [ ] **Migration Testing:** All new database migrations have been tested up and down on a production-like snapshot.
- [ ] **Drift Detection:** The database drift detection check is green in CI.
- [ ] **Seed Scripts:** Seed scripts are reproducible and idempotent.

### Gate G4 — Security & Access Control
- [ ] **RBAC Policy:** The RBAC matrix and authorization policy tests are passing.
- [ ] **Audit Events:** All privileged actions correctly generate audit events.
- [ ] **Session Hardening:** The session and authentication hardening checklist is complete.

### Gate G5 — Observability Readiness
- [ ] **Critical Traces:** Traces are visible for all new critical API flows.
- [ ] **Alert Routing:** Error alerts are correctly routed to the designated owner channel.
- [ ] **SLO Dashboards:** SLO dashboards for API latency and error rates have been created or updated.

### Gate G6 — Quality Pipeline
- [ ] **CI Time Budget:** The CI pipeline completes within the target time budget.
- [ ] **E2E Stability:** E2E smoke tests are stable across multiple consecutive runs.
- [ ] **Test Thresholds:** All required test coverage thresholds have been met or exceeded.

---

## Sign-off

We, the undersigned, confirm that this release has met all the criteria outlined in this checklist and is ready for promotion.

- **Lead Engineer:** ________________________
- **Product Manager:** ________________________
- **QA Engineer:** ________________________
