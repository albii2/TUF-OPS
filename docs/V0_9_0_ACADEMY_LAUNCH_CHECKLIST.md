# v0.9.0 TUF Academy Launch Checklist

Use this checklist before sending the official 72-hour certification launch email.

## Curriculum content

- [ ] Level 1 TUF Operator modules contain real launch guidance: TUF purpose, revenue model, four orders/month, 72-hour standard, and CRM unlock rules.
- [ ] Level 2 Product Foundation modules cover uniforms, player packs, travel gear, team stores, letterman jackets, price confidence, and margin basics.
- [ ] Level 3 Territory Workflow modules cover assigned schools, AD/coach workflow, feeder/youth extraction, travel/club opportunities, and auditable school touches.
- [ ] Level 4 Sales Execution modules cover discovery, first contact, vendor objection, mockup/sample close, follow-up discipline, and Closed Won standards.
- [ ] Level 5 TUF Ops CRM modules cover dashboard, organizations/contacts, opportunities/stages, orders after Closed Won, and payment-gated commissions.
- [ ] Specialized Tracks contain field-ready sport/market prompts for football, basketball, baseball, volleyball, women’s sports, 7v7/flag, youth programs, and letterman campaigns.
- [ ] Director content is sufficient for Primeau/directors to review practical exercises and authorize sign-off.

## App behavior

- [ ] Academy page loads from the database in production; local fallback is disabled for production certification.
- [ ] Module detail renders non-empty training content, rep actions, field language, done criteria, and practical checkpoints.
- [ ] Module progress save works against the training API.
- [ ] Uncertified reps can access Academy and locked dashboard state only.
- [ ] Uncertified reps remain gated from CRM/sales pages until certification is complete.

## Locker Room Simulator

- [ ] Academy shows the “Locker Room Simulator” section.
- [ ] `/training/simulator` opens inside TUF Ops.
- [ ] Reps can access the simulator before and after certification.
- [ ] Directors/admins can use the simulator for coaching review where their role has Academy access.
- [ ] Scenarios are visible for AD intro, football uniform pitch, existing vendor, budget objection, team store, player pack, letterman campaign, feeder/youth ask, no-response follow-up, and closing for mockup/sample.

## Practical certification

- [ ] Certification checklist shows modules, HR docs, practical exercise, director sign-off, and CRM unlock.
- [ ] Rep completes at least one simulator/practical scenario.
- [ ] Director reviews rep performance using the coaching prompt.
- [ ] Director/admin marks practical exercise complete via backend route.
- [ ] Director signs off only after modules + HR docs + practical exercise are complete.

## Go/no-go

- [ ] Academy is safe to open tonight.
- [ ] CRM/live selling remains gated until production smoke tests pass.
- [ ] Primeau/director understands manual practical review and sign-off responsibility.
