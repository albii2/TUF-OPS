# AI Feature Rollout Plan for TUF Ops

## Current Baseline (from current web app + data model)

The current system already has the primitives needed to phase in AI safely:
- Opportunity stage, value, rep, and next-action fields in the pipeline views.
- Territory-level account and opportunity aggregation with untouched/stale coverage indicators.
- Role-aware dashboards (Owner/Director/Rep) and territory snapshots.

## Recommended Launch Strategy

## V1 (ship now, low-risk, high-value)

### 1) Pipeline Intelligence (Rules + Prompt Assist)
- Add deterministic scoring fields to opportunities:
  - `close_likelihood` (0-100)
  - `stalled_reason` (enum)
  - `recommended_next_action` (string)
- Start with transparent business rules (no black-box model dependency at launch):
  - no follow-up in N days
  - stage age > threshold
  - missing quote / missing activity
- Surface in Team Opportunities and Territory pages:
  - "closeable this week"
  - "stuck due to no follow-up"
  - "rep conversion risk"

### 2) AI-Assisted Territory Strategy (Priority Queue)
- Add weekly target queue generated from existing territory + activity signals:
  - season window weight
  - sport focus weight
  - recency/follow-up decay
  - engagement score
- Output a ranked "this week" school list by zone and sport.
- Keep all scoring explainable and editable by Ops in config.

### 3) Instant Proposal / Quote Generation (Template-first)
- Add proposal payload object from existing opportunity/order data.
- Generate quote docs from a controlled template engine first.
- Optional AI layer in V1: rewrite/formatting only (not pricing logic).

## V1.1 (2-6 weeks after launch)

- Introduce optional LLM summarization for:
  - win/loss explanations
  - next-best-action rationale
  - weekly territory briefings
- Add feedback loop:
  - rep accepts/edits recommendation
  - capture result to improve scoring weights.

## V1.2+ (model-driven forecasting)

- Train/fit statistical + ML forecasting from accumulated TUF Ops history:
  - probability-to-close calibration by lane/sport/season
  - rep-level coaching opportunity detection
  - territory saturation forecasting.

## Technical Guardrails

- AI never writes final pricing or commission values without deterministic validation.
- Every recommendation must show "why" with auditable inputs.
- Feature flags by role (Owner/Director first, then Rep rollout).
- Log all AI outputs for QA review during beta.

## Suggested Build Order

1. Opportunity scoring schema + API contracts.
2. Territory weekly-priority scoring job.
3. Proposal template service + export endpoint.
4. UI surfaces (dashboard cards, territory queue, pipeline tags).
5. Optional LLM explanation layer behind feature flags.

