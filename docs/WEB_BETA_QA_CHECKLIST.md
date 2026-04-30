# TUF Ops Web Beta Manual QA Checklist

**Date:** April 28, 2026  
**Scope:** `apps/web` only (mock-data mode)

## Test Environment
- Start app: `cd apps/web && pnpm dev`
- Default login PIN: `0000`
- Browser console must remain free of blocking runtime errors during each flow.

## Global Checks (All Routes)
- [ ] Page route loads without crash.
- [ ] Primary content for the route is visible.
- [ ] Top navigation/search/shell remains usable.
- [ ] Sidebar navigation works to/from route.
- [ ] No blocking runtime error in browser console.

---

## Route: `/login`
- [ ] Login page renders with PIN input and submit button.
- [ ] PIN `0000` logs in and redirects to `/dashboard`.
- [ ] Invalid PIN shows non-blocking error feedback.
- [ ] No email/password UI appears.

## Route: `/dashboard`
- [ ] Dashboard loads after login.
- [ ] Role-aware dashboard content appears.
- [ ] Search bar and user/profile controls render.
- [ ] Sidebar navigation to all main sections works.
- [ ] No runtime errors in console.

## Route: `/organizations`
- [ ] Organizations table renders with expected columns.
- [ ] Search input filters rows.
- [ ] Status filter updates results.
- [ ] Rep filter updates results.
- [ ] Pagination controls change pages correctly.
- [ ] Reset filters restores full list.
- [ ] Empty state appears when filters return no results.
- [ ] Row click opens `/organizations/:id`.

## Route: `/organizations/:id`
- [ ] Account header and pipeline value are visible.
- [ ] Four lane cards render: UNIFORM/TRAVEL_GEAR/TEAM_STORE/LETTERMAN.
- [ ] Active opportunities section links to opportunity detail.
- [ ] Orders summary and expansion recommendation render.
- [ ] Activity feed renders or shows empty-state messaging.

## Route: `/opportunities`
- [ ] Opportunities table renders with expected columns.
- [ ] Search filter works.
- [ ] Stage filter works.
- [ ] Lane filter works.
- [ ] Rep filter works.
- [ ] Sport filter works.
- [ ] Pagination and reset filters work.
- [ ] Empty state appears when no matches.
- [ ] Row click opens `/opportunities/:id`.

## Route: `/opportunities/:id`
- [ ] Deal header renders organization link, lane/sport/season, value, assigned rep.
- [ ] Stage progress is visible.
- [ ] Stage-specific CTA renders based on stage.
- [ ] Next action panel is visible.
- [ ] Activity feed renders or shows empty message.
- [ ] Files/invoice/payment placeholders render.
- [ ] Closed Won / Closed Lost controls render.

## Route: `/orders`
- [ ] Orders table renders with expected columns.
- [ ] Search filter works.
- [ ] Production status filter works.
- [ ] Pagination and reset filters work.
- [ ] Empty state appears when no matches.
- [ ] Row click opens `/orders/:id`.

## Route: `/orders/:id`
- [ ] Order header renders with linked organization and value.
- [ ] Linked opportunity section renders link when available.
- [ ] Production status, vendor notes, and missing-info checklist render.
- [ ] Activity feed renders or empty message shown.

## Route: `/ops-workspace`
- [ ] Queue columns render: Needs Review / Ready for Vendor / In Production / Blocked / Completed.
- [ ] Order cards render in correct queue.
- [ ] Empty queue columns show empty state.

## Route: `/reports`
- [ ] Weekly summary metrics render.
- [ ] Monthly summary metrics render.
- [ ] Lane performance cards render.
- [ ] Rep performance cards render.
- [ ] Export placeholder buttons render.

## Route: `/settings`
- [ ] Profile placeholder panel renders.
- [ ] Role selector placeholder renders.
- [ ] Accent color placeholder renders.
- [ ] PIN auth placeholder renders.
- [ ] System preferences placeholder renders.

---

## Seed-Data Scenario Checklist
Run route checks above under each seeded data mode:

- [ ] Empty pipeline scenario
- [ ] Large organization list scenario
- [ ] Large opportunity list scenario
- [ ] Mixed lane statuses scenario
- [ ] Blocked orders scenario
- [ ] Near-close deals scenario
- [ ] Missing-information orders scenario
- [ ] Closed-won orders scenario

For each scenario, verify:
- [ ] No blocking runtime errors
- [ ] Table filters/pagination remain stable
- [ ] Empty-state messaging remains accurate
- [ ] Detail routes still resolve correctly
