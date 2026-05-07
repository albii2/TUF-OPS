# TUF Ops UI/UX + Behavioral Psychology Audit (Desktop + Mobile)

## Executive Summary
The product has strong operational data depth, but usability friction appears when field reps use smaller screens under time pressure. Current priority should be **cognitive load reduction**, **action hierarchy clarity**, and **mobile thumb-zone ergonomics**.

## Functional Analysis
- **Owner:** strategy + coverage governance + import workflows.
- **Director:** coaching + risk clearing + close acceleration.
- **Rep:** daily execution (follow-up, stage progression, creative/asset requests).

## UX Psychology Findings
1. **Decision Fatigue Risk**
   - Too many equally weighted cards can hide the “next best action.”
   - Fix pattern: primary CTA + short checklist + warning states.

2. **Information Scent**
   - Users should instantly infer where to go for “move deal now.”
   - Fix pattern: labels like "Best Next Move", "Today Checklist", "Follow-up Warning".

3. **Progress Motivation**
   - Visible stage progression cues increase completion behavior.
   - Fix pattern: one-click “Advance to next stage” helper and weekly role scorecards.

4. **Error Prevention Under Mobility**
   - Small-screen forms fail when fields are dense.
   - Fix pattern: single-column-first forms and larger touch targets.

## Mobile Audit (iPhone-focused)
### Issues observed
- Dashboard key numbers and card density were too compressed on narrow widths.
- Opportunity form sections had high visual density, increasing mis-taps.
- Deal-summary alignment favored desktop scanning over mobile readability.

### Improvements applied
- Responsive KPI typography and 2-column mobile metric layout.
- Better small-screen stack behavior in Opportunity Summary.
- Stage grid and needed-items grid tuned for narrow screens.
- Full-width primary submit action on mobile.

## Industry-Standard Heuristics Applied
- **Nielsen:** visibility of system status, recognition over recall, consistency.
- **Fitts’s Law:** larger, reachable targets for high-frequency actions.
- **Hick’s Law:** fewer top-level choices per viewport; checklist-driven action focus.
- **Jakob’s Law:** preserve familiar admin shell/navigation while improving affordances.

## Next High-Impact Steps
1. Sticky bottom mobile action bar for Rep in Opportunity Detail.
2. Role-based default landing blocks (Rep opens to My Next Actions first).
3. Touch-friendly segmented controls for stage/action transitions.
4. Mobile usability pass with 5-task script (create request, log follow-up, advance stage, open org, find near-close deal).
