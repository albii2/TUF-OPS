# TUF Ops Version Governance & Release Roadmap

This document defines the official priority stack, release pipeline, database protection plans, and organizational structure as TUF Ops scales toward the v1.0 Midwest Launch.

---

## 1. Phased Version Governance Map

### v0.8.6 (Current Baseline)
- Multi-environment Vercel preview and production split stabilized.
- Primary Opportunity Command Center and Order Handoff features implemented.

### v0.9.0 (Foundation Hardening — Active Phase)
- **Hardening of Core Functions (Priority 1 — Data Integrity)**:
  - Perform validation audits on the six core modules:
    - **Organizations**: Validate unique naming/state constraints, clean up duplicate or orphaned records.
    - **Contacts**: Assert relationship integrity with organizations, ensuring emails/phones are standardized.
    - **Opportunities**: Audit pipeline states, ensuring next actions are mapped and timestamps are consistent.
    - **Orders**: Tighten validations between opportunities, orders, and order items.
    - **Commissions**: Audit calculations and association logic.
    - **Activities**: Harden notes, contact logs, and history tracking.
- **Permission & Security Audits**:
  - Apply standard user role checks (`OWNER`, `ADMIN`, `DIRECTOR`, `REP`, `OPS`).
  - Establish the secure cryptographic PIN login framework (scrypt).
- **Deployment Hardening**:
  - Implement single-branch preview/production pipeline flow (`develop` -> Preview, `main` -> Production).
- **Backup Strategy**:
  - Implement automated daily backups and weekly snapshot verification procedures.

### v0.9.1 (TUF Academy v0.1 Onboarding & Content Generation)
Deliver a streamlined training system using a centralized Google Drive folder structure:
*   **01 - Welcome**: Welcome Letter, Mission & Culture.
*   **02 - Leadership**: Minnesota State Director Briefing, Midwest Expansion Overview, Territory Model.
*   **03 - Product Training**: Product Guide, Pricing Guide, Revenue Lanes.
*   **04 - Sales Training**: Sales Process, Lane Penetration, Ecosystem Referrals, Qualified Opportunities.
*   **05 - TUF Ops**: Quickstart Guide, Screenshots, Workflow.
*   **06 - Certifications**: Simple checklist.

**Content Generation (Using Antigravity / AI)**:
- Generate missing core guides: Product Guide, TUF Ops Quickstart, Sales Playbook, Certification Checklist.
- Prepare Onboarding Packets for Primeau (State Director) and clear directions/communications for Reps (like Braydon).

### v0.9.2 (Order Operations & Director Portals)
- Payment confirmation workflows.
- Artwork approval tracking.
- Pakistani vendor routing and order readiness states.
- State Director dashboard reporting features.

### v1.0 (Midwest Launch Requirements)
- **Infrastructure**: Production & Staging environments, automatic backups, operational monitoring dashboards.
- **Data**: Verified relationship integrity, database audit complete, duplicate protection.
- **Operations**: End-to-end order flow, RBAC permissions, pipeline reports.
- **Training**: Academy 101–105 completed, Director certifications verified.
- **Scale Capability**: 10 TAEs, 3 Directors, and Ownership operating for 90 days without data loss or database intervention.

---

## 2. Organization Structure & Dashboard Targets

### Hierarchy Mappings
```text
VP Sales (Executive Leadership)
       ↓
State Directors (Minnesota, Wisconsin, Dakotas, Women's)
       ↓
Senior TAEs
       ↓
TAEs (Reps)
       ↓
Interns
```

### Authentication PIN Structure
Authentication PIN ranges align strictly with role hierarchies:
- **8XXX (Executive Leadership & Special Accounts)**:
  - Auqueith Bradshaw (Owner): `8188`
  - Jennifer Schmitz (Director - Inactive): `8173`
- **7XXX (State Directors)**:
  - Primeau Hill (Director): `7428`
  - Travis Collins (Director - Inactive): `7184`
- **6XXX (Senior TAEs)**:
  - Jason Mulder: `6187`
  - David Lundberg: `6243`
  - Kalynn Guffey: `6378`
- **5XXX (TAEs / Reps)**:
  - Cole Hinz: `5532`
  - Braydon Ruprecht: `5874`
  - Shayla Hilliard: `5219`
- **4XXX (Interns)**:
  - Narena Anderson: `4184`
  - Ava Stratton: `4268`
  - Juan Guevara: `4372`
  - Robyn Henking: `4429`
  - Michelle Chamberlin: `4638`
  - Emiliano Clavel: `4742`
  - Jeff Skinner: `4891`

### Future Dashboard Vision (Post-v0.9.0 Hardening)
- **State Director / Regional Director Dashboards**:
  - **Team Health**: Assigned reps, active reps, onboarding state, certification count.
  - **Territory Health**: Schools assigned, schools contacted, active opportunities, closed-won totals.
  - **Rep Scorecard**: Opportunities counts per assigned representative.
  - **Recruiting Funnel**: Applicants, interviews scheduled, offers extended.
  - **Training Progression**: Academy completion %, certification statuses.

---

## 3. Database Protection Plan

- **Daily Backups**: Production database snapshotted every day, retained for 30 days.
- **Weekly Snapshot**: Retained for 90 days.
- **Monthly Snapshot**: Retained for 1 year.
- **Pre-Release Snapshot**: Automated database backups triggered before any migration runs. Failures must trigger immediate rollbacks.
