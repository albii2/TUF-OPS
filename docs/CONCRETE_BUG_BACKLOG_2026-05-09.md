# Concrete Bug Backlog (May 9, 2026)

## P0 (Fix this sprint)

1. **Dashboard role-scope mismatch for DIRECTOR/REP cards**
   - **Problem:** "Team" and "My" cards/lists read unscoped `useOpportunities({})` data.
   - **User impact:** coaching/KPI trust breaks; personal KPIs show global numbers.
   - **Acceptance criteria:**
     - DIRECTOR cards only include director-owned/team-zone scope.
     - REP cards only include current rep scope.
     - "Team Next Actions" and "My Next Actions" follow same scope.

2. **Global search scope mismatch**
   - **Problem:** search message claims current role scope but code searches all orgs/opps/orders.
   - **User impact:** navigates into records outside intended scope, inconsistent with copy.
   - **Acceptance criteria:**
     - Search uses role-scoped datasets.
     - Message text aligns to actual behavior.

3. **Owner lead upload reliability/fit-for-purpose**
   - **Problem:** import UX had default rep/director/territory controls and partial semantics confusion.
   - **User impact:** unclear what gets imported and who gets assigned.
   - **Acceptance criteria:**
     - All valid CSV leads import to Organizations.
     - Only organization fields are parsed.
     - Imported records are left unassigned for rep/director.
     - Import UI clearly states behavior.

## P1 (Next sprint)

4. **Organizations bulk assignment needs explicit de-assignment**
   - **Problem:** no clear action to remove rep/director from accounts.
   - **User impact:** managers forced to reassign instead of clearing ownership.
   - **Acceptance criteria:**
     - Bulk actions include "Clear Rep" and "Clear Director".

5. **Team Opportunities data-level guardrails**
   - **Problem:** rows initialized via role predicate that can silently fail if routing changes.
   - **User impact:** fragile future regressions in scope behavior.
   - **Acceptance criteria:**
     - explicit role-scoped query/filter logic.
     - tests for OWNER/DIRECTOR allowed and others blocked.

## P2 (Polish / UX)

6. **App shell width too wide on large monitors**
   - **Problem:** main container feels abnormally stretched.
   - **User impact:** readability and scan efficiency drop.
   - **Acceptance criteria:**
     - reduced max-width with QA across desktop breakpoints.

7. **Sports scoreboard seasonal relevance**
   - **Problem:** off-season leagues shown by default.
   - **User impact:** noisy, low-signal header content.
   - **Acceptance criteria:**
     - prioritize active in-progress events.
     - fallback only when no active events exist.
