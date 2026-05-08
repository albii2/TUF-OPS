# Web Product and Organizational Improvement Advice

Date: May 8, 2026

Scope: `apps/web` after beta readiness hardening.

## Executive Point of View

TUF Ops is strongest when it behaves like a command center, not a database. The product should keep every role focused on the two operating standards that matter most right now: 4 orders per month and lane penetration. Everything else should either help a user move a school, deal, or order forward, or stay out of the way.

## Highest-Leverage Product Moves

1. Make the dashboard the daily operating surface.
   - The first screen should stay focused on next actions, near-close deals, payment follow-up, pipeline, revenue, 4-order pace, and lane penetration.
   - Avoid turning the dashboard into a report archive. Reports belong in `/reports`; dashboard belongs to today.

2. Treat opportunity stage progression as the core workflow.
   - Each stage should have a clear next action, required fields, and a reason to advance.
   - Closed Won should create or expose the order handoff immediately.
   - Blockers should flow back to the responsible sales user with missing information, not just sit in Ops.

3. Make Territory a coaching view.
   - The first module should remain the map/zone command view.
   - Director usage should emphasize rep workload, untouched accounts, near-close deals, stuck accounts, and lane depth.
   - Territory health should be measured by coverage and lane penetration, not just total pipeline.

4. Make Earnings motivational, not just financial.
   - Reps should instantly see what they made, what they can make, and how many orders remain to hit 4.
   - Directors should see team pace, override, and who needs coaching.
   - Keep commission logic documented and eventually move it behind a tested shared selector/service.

5. Keep Ops tightly connected to handoff quality.
   - Orders should always show production status, blocked reason, missing info, source opportunity, and next production step.
   - Ops should have a direct way to mark a blocker resolved once backend persistence exists.

## Organizational Operating Advice

1. Run the company around one weekly scorecard.
   - 4 orders/month per rep pace.
   - Lane penetration by sport and school.
   - Untouched accounts.
   - Near-close deals.
   - Blocked orders and missing info owner.

2. Define stage exit criteria.
   - Lead Assigned: owner/contact identified.
   - Contacted: contact attempt logged and next meeting/follow-up set.
   - Discovery: sport, lane, season, quantity, buyer, and timeline known.
   - Mockup Requested: creative brief complete.
   - Mockup Delivered: customer has visual and package.
   - Invoice Sent: payment/follow-up date set.
   - Decision Pending: objection and decision owner known.
   - Closed Won: order handoff complete.

3. Make directors accountable for coaching rhythm.
   - Daily: stuck and near-close review.
   - Weekly: territory/lane coverage review.
   - Monthly: 4-order pace and earnings review.

4. Create one owner for each source of truth.
   - Sales owns organization, opportunity, next action, and contact/account status.
   - Ops owns production status, blocker reason, vendor step, and missing info checklist.
   - Leadership owns settings, territories, roles, and reporting definitions.

## Engineering Recommendations

1. Formalize shared business selectors.
   - Move KPI math for 4-order pace, lane penetration, commission, near-close, blocked value, and territory health into tested selectors.
   - Keep pages thin so beta changes do not duplicate logic.

2. Add route-level smoke tests before backend cutover.
   - Login.
   - Role switch.
   - Dashboard.
   - Organizations import and bulk assignment.
   - Opportunity stage progression.
   - Order detail and blocker display.
   - Territory map selection.
   - Earnings pace.

3. Establish data contracts before replacing mock mode.
   - Each page should know exactly which service shape it needs.
   - Backend routes should match the app’s role scoping expectations, not force the UI to re-invent permission filtering.

4. Keep the design system small and strict.
   - Use command cards, KPI tiles, data tables, progress bars, and compact forms.
   - Avoid long explanatory copy inside workflow screens.
   - Every button should either perform a mock action, navigate, or be clearly marked post-beta.

5. Split future feature work by business flow.
   - Lead import and assignment.
   - Opportunity progression and creative request.
   - Order handoff and blocker resolution.
   - Territory coaching and lane penetration.
   - Reporting and earnings.

## Suggested Next Roadmap

1. Backend persistence for imported accounts, created opportunities, opportunity stages, creative requests, and bulk assignment.
2. Order status mutation and blocker resolution flow for Ops.
3. Shared KPI selector tests.
4. Director coaching notes and rep accountability snapshots.
5. Real report exports once the reporting definitions are stable.
6. Production auth/role enforcement and removal of beta role switching.
