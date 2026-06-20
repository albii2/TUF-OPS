# v0.9.0 Academy Certification Smoke Test

Use this checklist after production deploy/migration and before sending the official 72-hour certification email. Record pass/fail, tester, timestamp, and deployed commit SHA for each item.

## 1. Admin / Owner Test

- [ ] Owner/admin can log in.
- [ ] Owner/admin can open TUF Academy.
- [ ] Owner/admin can view rep certification status.
- [ ] Owner/admin can mark HR docs complete when appropriate.
- [ ] Owner/admin can mark practical exercise complete when appropriate.
- [ ] Owner/admin can complete director sign-off when appropriate.
- [ ] Data Health is not visible in the web navigation.

## 2. Primeau / Director Test

- [ ] Primeau can log in as Director.
- [ ] Primeau can open TUF Academy.
- [ ] Primeau can open Ecosystem Pipeline from the Director sidebar.
- [ ] Primeau Metro/North visibility: Organizations shows TUF Metro and TUF North schools assigned to Primeau or Primeau-managed reps.
- [ ] Primeau can see up to 100 organizations per page without losing assignment filters.
- [ ] Primeau can review a rep's Academy/practical completion state.
- [ ] Primeau can mark the practical exercise complete for a rep after review.
- [ ] Primeau can sign off only after modules/quizzes, HR docs, and practical exercise are complete.

## 3. Rep Academy Test

- [ ] Rep can log in.
- [ ] Uncertified rep lands in Academy/onboarding experience.
- [ ] Academy modules render full training content, not title-only cards.
- [ ] Required levels are visible: TUF Operator, Product Foundation, Territory Workflow, Sales Execution, TUF Ops CRM, Specialized Tracks.
- [ ] Rep can start a module.
- [ ] Rep can see the Certification Quiz in a quiz-backed module.

## 4. Quiz Pass / Fail Test

- [ ] Submit incorrect quiz answer and confirm the module does not complete.
- [ ] Confirm failed quiz attempt is saved in `training_assessments` with `passed = false`.
- [ ] Submit correct quiz answer and confirm the quiz passes.
- [ ] Confirm passed quiz attempt is saved in `training_assessments` with `passed = true`.
- [ ] Confirm a quiz-backed module counts toward completion only after progress is complete and the latest quiz is passed.

## 5. Locker Room Simulator / Practical Test

- [ ] Academy page links to Locker Room Simulator.
- [ ] `/training/simulator` opens for uncertified reps.
- [ ] Simulator scenarios render: AD intro, coach pitch, vendor objection, budget objection, team store, player pack, letterman jacket, feeder/youth referral, no-response follow-up, and mockup/sample close.
- [ ] Rep completes at least one practical simulator scenario.
- [ ] Director reviews the scenario live or asynchronously.
- [ ] Rep cannot mark practical exercise complete for themselves.
- [ ] Director/admin/owner/ops can mark practical exercise complete.

## 6. Certification Gate Test

- [ ] Rep is not certified when modules are incomplete.
- [ ] Rep is not certified when quiz-backed modules are complete but required quizzes are failed/missing.
- [ ] Rep is not certified when HR docs are missing.
- [ ] Rep is not certified when practical exercise is missing.
- [ ] Rep is not certified when director sign-off is missing.
- [ ] Rep becomes certified only after modules/quizzes, HR docs, practical exercise, and director sign-off are all complete.

## 7. CRM Unlock Test

- [ ] Uncertified rep can access Academy and locked dashboard/onboarding state.
- [ ] Uncertified rep is blocked or redirected away from Organizations, Opportunities, Orders, Territory, Earnings/Performance, and live-selling CRM routes.
- [ ] Certified rep can access assigned Organizations and Opportunities after the full certification gate passes.
- [ ] Certified rep sees only their assigned scope.

## 8. Lead / Territory Verification

- [ ] Production migrations completed before lead seed rerun.
- [ ] Lead seed populated `city`, `address_line1`, `postal_code`, and `tuf_zone` where CSV/address data exists.
- [ ] TUF Metro and TUF North organizations are assigned to Primeau when the Primeau user exists in production.
- [ ] Organizations page shows up to 100 rows per page.
- [ ] Opportunities page shows up to 100 rows per page.

## Go / No-Go

- [ ] GO: Send 72-hour certification email.
- [ ] NO-GO: Hold email and document blocker.

Signer: ______________________  Date/Time: ______________________
