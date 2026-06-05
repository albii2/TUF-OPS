# TUF Ops V0.8.5 Smoke Test

## Owner

- [ ] Login with owner PIN `0000`.
- [ ] Load Dashboard.
- [ ] Load Organizations.
- [ ] Load All Opportunities.
- [ ] Load Orders.
- [ ] Load Earnings.
- [ ] Load Reports.
- [ ] Load Users.
- [ ] Load Settings.
- [ ] Logout.

## Director

- [ ] Login with Test Director PIN `2468`.
- [ ] Load Director Dashboard.
- [ ] Load Organizations.
- [ ] Load All Opportunities.
- [ ] Load Territory.
- [ ] Load Earnings.
- [ ] Confirm no exact rep commission/payout amounts visible.
- [ ] Confirm stage advancement is read-only or requires director warning.
- [ ] Logout.

## Rep

- [ ] Login with Test Rep PIN `1357`.
- [ ] Load Rep Dashboard.
- [ ] Load My Opportunities.
- [ ] Create test opportunity.
- [ ] Advance opportunity one stage.
- [ ] Load Orders.
- [ ] Load Earnings.
- [ ] Confirm only own earnings visible.
- [ ] Logout.

## Routing

- [ ] Direct visit `/dashboard`.
- [ ] Direct visit `/orders`.
- [ ] Direct visit `/settings`.
- [ ] Direct visit `/organizations`.
- [ ] Direct visit `/opportunities`.
- [ ] Direct visit `/opportunities/opp-test-1`.
- [ ] Direct visit `/organizations/org-test-1`.
- [ ] Refresh each route.
- [ ] Confirm no 404/502.

## Production Domain

- [ ] Load `https://ops.tufsports.us/`.
- [ ] Confirm the app does not require switching to `http`.
- [ ] Confirm internal navigation keeps the same host.
- [ ] Confirm the PIN login flow works after direct-link refresh.
