# Mobile QA Script (390px)

Date baseline: 2026-05-13.

## Viewport Setup
- Device width: **390px**
- Height: 844px (or closest)
- Zoom: 100%

## Route-by-route script
1. `/dashboard`
   - KPI tiles render in single-column or 2-up without horizontal scroll.
   - Sports ticker does not overlap page title/content.
2. `/my-opportunities`
   - Table/cards are readable without clipped CTA buttons.
   - Filter controls wrap and remain tappable.
3. `/organizations`
   - Import panel fits viewport and file input remains accessible.
   - Bulk assignment block wraps controls; no off-screen action buttons.
4. `/opportunities/:id`
   - Header, stage/status chips, and next action text wrap naturally.
   - Warning/action cards do not overflow.

## Acceptance checklist
- [ ] No horizontal page scroll on each route.
- [ ] Primary CTA remains visible without pinch-zoom.
- [ ] Text does not overlap adjacent components.
- [ ] Touch targets are at least ~36px high.
- [ ] No clipped data-table columns without fallback wrapping/truncation.

## Evidence capture
- Capture one screenshot per route at 390px after smoke pass.
- Record role used during QA (OWNER then REP minimum).
