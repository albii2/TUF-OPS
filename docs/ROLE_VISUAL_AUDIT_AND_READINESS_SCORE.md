# Role Visual Audit + Readiness Score (Owner / Director / Rep)

## Visual Audit Method
This audit compares what each role visually sees on:
- Dashboard
- Opportunities list/detail
- Organizations
- Territory

Scoring rubric (0-100):
- **Navigation Fit (25)**
- **Role-Specific Signals (25)**
- **Actionability (25)**
- **Workflow Completion (25)**

## Current Visual Differentiation

| Surface | Owner | Director | Rep | Gap |
|---|---|---|---|---|
| Dashboard KPIs | Shared base cards | Shared base cards | Shared base cards | Base looks similar across roles |
| Dashboard role card | Territory overview | Director focus | Rep focus | Previously too lightweight for Rep execution |
| Opportunities | Full list | Team-scoped list | Assigned-only list | Rep close-path needed stronger prompts |
| Opportunity Detail | Stage + next move | Same + team context | Same | Needed a clearer “do this now” path |
| Territory | Full footprint | Team footprint | Limited usage | Rep often operates from opportunities first |

## Readiness Score

### Owner — **84 / 100**
- Navigation Fit: 24/25
- Role-Specific Signals: 20/25
- Actionability: 19/25
- Workflow Completion: 21/25

### Director — **80 / 100**
- Navigation Fit: 22/25
- Role-Specific Signals: 20/25
- Actionability: 19/25
- Workflow Completion: 19/25

### Rep — **72 / 100**
- Navigation Fit: 20/25
- Role-Specific Signals: 15/25
- Actionability: 18/25
- Workflow Completion: 19/25

## Why Rep Score Is Lower
- Rep dashboard had only summary text for focus.
- Limited explicit “move this deal today” checklist behavior on dashboard.
- Opportunity detail had stage context but not enough role-guided execution messaging.

## Immediate Improvements Applied
- Added a **REP TODAY CHECKLIST** visual card with concrete move-deal actions.
- Added a **DIRECTOR EXECUTION CHECKLIST** visual card with coaching/clearance priorities.
- Kept current nav, stage model, and workflow schema intact.

## Recommended Next Iteration
1. Add one-click stage progression helpers for Rep on opportunity detail.
2. Add role-specific empty states and warnings (e.g., “No follow-up in 7+ days”).
3. Add weekly role scorecards (Owner/Director/Rep) from existing data.
