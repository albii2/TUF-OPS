# TUF Ops Software Quickstart Guide

TUF Ops is the operating system for TUF Sports Apparel. It replaces spreadsheets, emails, and manual invoice tracking with an execution-focused pipeline dashboard.

---

## 1. Navigating Your Dashboard

When you log in, your primary view is the **Action Needed** queue:
- **Opportunities default**: Shows deals that are stalled (no activity in 14 days), have overdue next actions, or are payment-pending.
- **Orders default**: Shows fulfillment items that require review, lack sizing rosters, or are waiting to be sent to vendors.
- **Data Health page**: Provides real-time views on backup metrics and database integrity indicators (restricted to Owner).

---

## 2. The Mockup Workflow

Custom mockups are our strongest conversion tool. To submit a mockup request in TUF Ops:
1. Open the Opportunity and advance it to `Mockup Requested`.
2. Complete the required fields in the drawer:
   - **Sport** (e.g. Football)
   - **Revenue Lane** (e.g. Uniforms)
   - **Design Notes** (colors, logo placement, specific requirements)
   - **Needed Items** (e.g. jersey, pants)
   - **Urgency / Due Date**
3. Our design team is notified. Once completed, they upload the files and advance the stage to `Mockup Delivered`.

---

## 3. Order Handoff & Fulfillment

When an opportunity reaches `Closed Won` (payment is confirmed), you must immediately trigger the order handoff:
1. Open the Opportunity Detail Page.
2. Under the **Order Handoff** panel, click **Create Order Handoff**.
3. The system pulls the organization name, sport, value, and rep details to create a new order in `Orders` with a status of `NEEDS_REVIEW` (renders as **Order Created**).
4. Operations reviews the sizing rosters and design assets, then advances the order:
   - **Order Created** $\rightarrow$ **Vendor Ready** (assigned to Pakistani vendor).
   - **Vendor Ready** $\rightarrow$ **In Production** (production started).
   - **In Production** $\rightarrow$ **Completed** (shipped to school).
   - If a blocker arises (e.g. roster mismatch), mark the order as **Blocked / On Hold** to highlight it on the Director/Ops dashboard.
