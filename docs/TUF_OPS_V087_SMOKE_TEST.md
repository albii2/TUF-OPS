# TUF Ops V0.8.7 Smoke Test — Opportunity Command Center

Purpose: verify the Opportunity Detail Page now behaves like a compact sales command center while preserving V0.8.5 role and permission rules.

## Rep smoke test

1. Login with PIN `1357`.
2. Open **Opportunities** or **My Opportunities**.
3. Open an assigned opportunity.
4. Confirm the compact Command Header is visible above the fold:
   - Opportunity title
   - Organization name
   - Human-readable stage
   - Value
   - Lane
   - Sport
   - Assigned rep
   - Due status
5. Confirm **Next Action** is visible above the fold and shows:
   - Next action text
   - Due value
   - Overdue warning when applicable
   - Primary **Advance Stage** CTA
   - Secondary **Log Activity** action
6. Confirm **Stage Progress** uses human labels such as `Lead Assigned`, `Mockup Requested`, and `Decision Pending` rather than raw enum labels.
7. Confirm no hardcoded fake contact links render:
   - No `tel:5550123` link.
   - No `mailto:coach@school.edu` link.
   - If stored contact data is placeholder/test data, the page shows **Add Contact Info** instead of Call/Email.
8. Click **Advance Stage** for an assigned opportunity.
9. Complete any required fields in the drawer.
10. Confirm advancement succeeds and success feedback appears.

## Director smoke test

1. Login with PIN `2468`.
2. Open a team or territory opportunity.
3. Confirm the stage advancement CTA is read-only/disabled or otherwise protected.
4. Confirm directors do not get a casual stage advancement path.
5. Confirm no exact rep commission or payout fields appear on the Opportunity Detail Page.
6. Confirm revenue, stage, activity, order count/pace-adjacent context remains visible where available.
7. Confirm **Relationship Intelligence** is visible and compact.

## Owner smoke test

1. Login with PIN `0000`.
2. Open any opportunity.
3. Confirm the Command Header, Stage Progress, Next Action, Quick Execution, Relationship Intelligence, Activity Timeline, and collapsed Strategy sections render.
4. Confirm owner can advance any opportunity.
5. Confirm the full operational view remains intact without rep-only financial restrictions.

## Regression smoke test

1. Confirm Dashboard loads.
2. Confirm Opportunities list still defaults to **Action Needed**.
3. Confirm Orders still load.
4. Confirm Earnings permissions remain correct:
   - Rep only sees their own earnings.
   - Director does not see exact rep commission/payout details where restricted.
   - Owner keeps full earnings view.
5. Refresh key routes directly and confirm clean routing:
   - `/dashboard`
   - `/opportunities`
   - `/opportunities/:id`
   - `/orders`
   - `/earnings`

## Responsive reality check

Test at standard laptop, smaller laptop, and tablet-width viewports. Confirm the priority information stays easy to understand without scanning long paragraphs:

- Opportunity title
- Stage
- Value
- Next action
- Advance CTA

## Pass criteria

V0.8.7 passes when the detail page is execution-first, contact buttons never use fake placeholders, playbook copy is collapsed by default, and V0.8.5 role permissions remain intact.
