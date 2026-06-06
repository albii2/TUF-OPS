# TUF Ops V0.8.8 Smoke Test — Order Workflow Simplification

## Scope
Validate that the Orders workflow now behaves like an execution queue and that each order detail page works as a command center with guided stage advancement.

## Rep — PIN 1357
1. Log in with `1357`.
2. Open **Orders**.
3. Confirm the default queue chip is **Action Needed**.
4. Confirm order rows/cards show:
   - Organization
   - Order title or lane/product
   - Current human-readable stage
   - Next action
   - Owner of next step
   - Due date
   - Risk status
   - Open button
5. Open an assigned order.
6. Confirm the command header is visible above the fold.
7. Confirm stage progress uses human-readable stages such as **Payment Confirmed**, **Vendor Ready**, and **In Production**.
8. Use **Advance Order** if enabled for the assigned order.
9. Confirm the drawer only asks for fields needed for that transition.
10. Save the advancement and confirm success feedback appears.
11. Confirm unassigned orders are not visible.
12. Confirm no other rep commission or payout amounts are visible.

## Director — PIN 2468
1. Log in with `2468`.
2. Open **Orders**.
3. Confirm team/territory orders are visible.
4. Confirm blocked/risky orders are obvious in **Action Needed** and **Blocked**.
5. Confirm exact rep commission/payout amounts are not shown.
6. Open an order detail page.
7. Confirm the next action, owner, due date, and risk warning are clear.
8. If advancing an order is allowed, confirm this warning appears before saving: “You are updating this order as a director. This action will be logged.”
9. Confirm activity/timeline entries are created when the current mock activity architecture records the update.

## Owner — PIN 0000
1. Log in with `0000`.
2. Open **Orders**.
3. Confirm all visible mock orders are available across **Action Needed**, **In Production**, **Blocked**, **Completed**, and **All Orders**.
4. Open an order detail page.
5. Confirm full operational status and order value are visible.
6. Advance any order one stage.
7. Confirm success feedback appears.
8. Confirm the timeline shows order activity when local activity storage is available.

## Opportunity Handoff
1. Open a **Closed Won** opportunity.
2. Confirm the **Order Handoff** panel appears.
3. Create the linked order if one does not already exist.
4. Confirm success feedback appears.
5. Open the linked order from the opportunity.
6. Confirm the order command header links back to the opportunity.
7. Try creating the same handoff again and confirm duplicate order creation is prevented with a warning/error.
8. Confirm the order appears in **Orders**.

## Regression
1. Confirm **Dashboard** still loads.
2. Confirm **Opportunities** still defaults to its Action Needed workflow.
3. Confirm **Opportunity Detail** still loads and advances stages for permitted users.
4. Confirm **Earnings** permissions remain correct:
   - Rep sees own earnings/progress only.
   - Director does not see exact rep payouts/commissions.
   - Owner retains full visibility.
5. Refresh `/orders`, `/orders/:id`, `/opportunities`, and `/opportunities/:id` routes directly.
6. Confirm no 404 or 502 appears.

## Stage Mapping Acceptance
- Legacy `NEEDS_REVIEW` renders as **Order Created**.
- Legacy `READY_FOR_VENDOR` renders as **Vendor Ready**.
- Legacy `IN_PRODUCTION` renders as **In Production**.
- Legacy `BLOCKED` renders as **Blocked / On Hold**.
- Legacy `COMPLETED` renders as **Completed**.
- New guided stages render as human-readable labels.
