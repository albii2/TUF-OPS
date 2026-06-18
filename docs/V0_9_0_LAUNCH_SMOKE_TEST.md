# v0.9.0 Launch Smoke Test Checklist

Run against production or the final production-connected preview after migrations.

- [ ] Admin login succeeds.
- [ ] Director login succeeds.
- [ ] Rep login succeeds.
- [ ] Academy enrollment exists for rep.
- [ ] Academy progress save persists after refresh.
- [ ] Certification status is database-backed and shows module, practical exercise, and director sign-off requirements.
- [ ] Uncertified rep can access Academy/onboarding only and cannot access CRM/sales pages.
- [ ] Certified + practical-complete + director-signed rep can access CRM/sales pages.
- [ ] School coverage counts prove assignment alone is untouched.
- [ ] A call/email/text/meeting/note/opportunity activity/logged contact changes a school from untouched to touched.
- [ ] Rep can create an opportunity only for assigned scope.
- [ ] Stage advancement works and is audited.
- [ ] Closed Won opportunity creates one linked order.
- [ ] Linked order is visible to owning rep, assigned director, and admin/owner.
- [ ] Unpaid/draft/not-fulfilled order does not create payable commission totals.
- [ ] Delivered/completed paid order appears in commission totals.
- [ ] Rep cannot see other reps' commission details or director override amounts.
- [ ] Director can see team/territory rollups but not rep-only payout detail lines.
- [ ] Dashboard totals match backend reporting endpoints for rep/director/admin.
