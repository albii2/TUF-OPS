# Beta Launch Readiness Report

Date: May 8, 2026

Scope: `apps/web` organizational beta readiness for Owner, Director, Rep, and Ops.

## Executive Summary

`apps/web` is ready for internal organizational beta in mock mode after a focused hardening pass. The app now has proportional TUF Ops branding, an authenticated-page footer watermark, mobile navigation, working mock creation/import/stage actions, safer role scoping, OPS order visibility, and beta documentation for role journeys and business logic coverage.

## Current Beta Readiness Status

Release recommendation: **READY FOR INTERNAL BETA**

This recommendation assumes beta users understand the app is running in mock/client mode and that local mock-created records live in browser localStorage.

## Completed Checks

- Inspected `apps/web/src/App.tsx`, `main.tsx`, `auth.ts`, `types.ts`, `styles.css`.
- Inspected `apps/web/src/config/*`, `data/*`, `services/*`, `hooks/*`, `utils/*`, `components/*`, `pages/*`.
- Inspected requested docs that exist; confirmed `TERRITORY_MAP_FUNCTION.md` and `WEB_FINAL_THEME_SPEC.md` are absent.
- Verified route inventory and role visibility configuration.
- Fixed top-left logo sizing and placement with the uploaded white TUF logo at `apps/web/public/tuf-logo.svg`.
- Added subtle authenticated footer watermark using the same approved TUF logo asset.
- Added mobile navigation for authenticated routes.
- Added global search routing for scoped accounts, opportunities, and orders.
- Made lead import create local mock organizations.
- Made new organization and new opportunity flows persist local mock records.
- Made opportunity stage/action controls respond in local mock state.
- Made organization bulk assignment controls update selected local mock rows.
- Fixed OPS order visibility and OPS dashboard content.
- Made OPS workspace cards open order detail.
- Replaced unfinished copy such as preview-only, next slice, and pending integration wording.
- Added mock feedback for report export and order creation controls.

## Remaining Non-Blocking Gaps

- Dedicated sample tracking is not a full state machine yet; creative/mockup tracking covers the beta-critical mockup flow.
- Report export does not generate files; buttons provide beta-safe mock feedback.
- Standalone order creation is not implemented; beta handoff is represented through seeded closed-won/order data.
- Imported and newly created mock records persist in browser localStorage, not backend storage.
- API cutover loading/error states remain part of the existing data adapter plan.

## Known Risks

- Because mock data lives locally, beta testers using different browsers/devices will not share imported or created records.
- Role switching is intentionally visible for beta QA; production role switching should be governed by real auth.
- The large legacy `apps/web/src/pages/TUF MN.svg` asset remains unused and should be moved or removed in a later cleanup.

## Recommended Manual QA Checklist

- Login with PIN `0000`; verify invalid PIN error.
- Switch through OWNER, DIRECTOR, REP, OPS beta role contexts.
- For OWNER, import a CSV from the lead schema, confirm rows appear in `/organizations`, then bulk assign selected rows.
- For DIRECTOR, verify `/my-opportunities`, `/team-opportunities`, `/territory`, and `/reports`.
- For REP, create an opportunity, advance stages, submit a creative request, and close won/lost in mock mode.
- For OPS, open `/dashboard`, `/ops-workspace`, `/orders`, and several `/orders/:id` details.
- Verify `/territory/map` has Metro, North, West, South only.
- Check desktop, tablet, and mobile widths for navigation, tables, dashboard cards, details, and login.
- Confirm no generated `.js`, `.d.ts`, `.map` files exist under `apps/web/src`.
- Run `pnpm -C apps/web build`.

## Verification Status

- `pnpm install`: completed for fresh clone dependency setup.
- `pnpm -C apps/web build`: passed.
- `find apps/web/src -name '*.js' -o -name '*.d.ts' -o -name '*.js.map' -o -name '*.d.ts.map'`: passed with no output.
- `pnpm -C apps/web lint`: attempted; blocked because `eslint` is not installed in the package/workspace.
- Browser smoke check: login, Owner dashboard, OPS workspace to order detail, mobile/tablet nav, and brand asset visibility passed.
