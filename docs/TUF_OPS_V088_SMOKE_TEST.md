# TUF Ops V0.8.8 Smoke Test — Order Workflow Simplification

## Scope
Validate that the Orders workflow now behaves like an execution queue and that each order detail page works as a command center with guided stage advancement.

## Opportunity Creation P0 Regression
1. Log in as Rep with `1357`.
2. Open **My Opportunities** and confirm the default view is **Action Needed**.
3. Click **+ New Opportunity**.
4. Complete required fields and submit.
5. Confirm success feedback appears: **Opportunity created.**
6. Confirm the app navigates directly to `/opportunities/:id` for the new opportunity.
7. Refresh the Opportunity Detail route and confirm the opportunity still loads.
8. Confirm the opportunity is assigned to the logged-in rep and can be advanced by that rep.
9. Return to **My Opportunities** and confirm the new Lead Assigned opportunity appears in **Action Needed** until first contact is logged.
10. Advance or prepare a controlled test opportunity to **Closed Won** and confirm the Closed Won → Order Created handoff path remains testable.

## Closed Won → Order Handoff Persistence

### Owner
1. Login with `0000`.
2. Open a Closed Won opportunity.
3. Click **Create Order Handoff**.
4. Confirm success feedback appears.
5. Confirm the button changes to **Open Linked Order**.
6. Open **Orders**.
7. Confirm the new **Order Created** order appears in **Action Needed**.
8. Open the order detail page.
9. Confirm the order links back to the opportunity.

### Director
1. Login with `2468`.
2. Open a team Closed Won opportunity.
3. Click **Create Order Handoff** if allowed.
4. Confirm the director warning appears: “You are confirming payment / creating order handoff as a director. This action will be logged.”
5. Confirm the order appears in Director Orders.
6. Confirm no commission/payout fields are visible.

### Rep
1. Login with `1357`.
2. Open **Orders**.
3. Confirm the order created from the rep’s assigned opportunity is visible.
4. Open the order.
5. Confirm no restricted financial or payout fields are visible.

### Duplicate
1. Try creating the handoff again.
2. Confirm the system does not create a duplicate.
3. Confirm the handoff panel shows **Open Linked Order** and a calm “Order already created for this opportunity.” message.

### Filter
1. Open **Orders** and confirm it defaults to **Action Needed**.
2. Confirm **Order Created** appears in **Action Needed**.
3. Switch to **All Orders**.
4. Confirm the same order appears.

### Refresh
1. Refresh Opportunity Detail.
2. Confirm the linked order still exists.
3. Refresh Orders.
4. Confirm the order is still visible.

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
