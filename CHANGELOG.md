# Meridian OS v1.0 — Change Log

**Deployed: July 21, 2026**  
**Scope: TUF Ops (ops.tufsports.us)**

---

## What Changed

TUF Ops now runs on the Meridian Operating System — a unified architecture where every
operational event is tracked, scored, and surfaced before it becomes a problem.

---

## New Engines

### 1. Classification Engine

Every intake item is now auto-classified into one of 17 types and assigned an
Attention Score (0–100) based on:

- Priority level
- How long it's been open
- Whether it's past its deadline
- Whether it's a revenue blocker, vendor delay, or inactive rep (urgent types)

**Where to see it:** Every intake item shows its score and classification type.

---

### 2. Lighthouse — Organizational Awareness

Lighthouse asks: "What requires attention RIGHT NOW?"

It scans all open intake items, recomputes scores in real time, and surfaces the
highest-attention items first. Grouped by classification type so leadership can
see patterns (e.g., "3 recruiting issues, 2 revenue blockers, 1 vendor delay").

**Route:** `GET /api/v1/intake/lighthouse`

---

### 3. Pulse — Health Scores

Four health scores updated on every Command Center load:

| Score | What it measures |
|-------|-----------------|
| Coverage | % of territory accounts contacted |
| Pipeline | Active opportunities × 10 |
| Executive | 100 minus (high-attention items × 10) |
| Operations | Active orders in production |

Scores are color-coded: green (70+), yellow (40-69), red (below 40).

---

### 4. Forge — Execution View

Shows what's actively being executed right now:

- Active pipeline count and total value
- Near-close deals (Mockup Delivered, Invoice Sent, Decision Pending)
- Orders currently in production
- Quick links to Accounts, Pipeline, Orders

---

### 5. Executive Command Center

**URL: `/command`**  
**Access: ADMIN, DIRECTOR, REGIONAL_DIRECTOR**

One page that combines everything:

```
┌─────────────────────────────────────────┐
│  📡 Pulse — Health Scores              │
│  [Coverage] [Pipeline] [Exec] [Ops]    │
├────────────────────┬────────────────────┤
│ 🔦 Lighthouse      │ 🗺️ Territory Health│
│ What needs attention│ Coverage %         │
│ (scored, classified)│ Pipeline $         │
│                    │ Revenue $          │
│ ⚒️ Forge           │ Attention Level    │
│ Pipeline stats     │                    │
│ Near-close deals   │ 📊 Intake by Type  │
│ Production orders  │ Breakdown chart    │
│                    │                    │
│ 📋 Status Checks   │ ⏰ Overdue Items   │
│ Response tracking  │ Past-deadline list │
└────────────────────┴────────────────────┘
```

---

## New Feature: Leadership Status Check Tracking

**Problem:** HR sends a status check to directors. Only 1 of 3 responds. No one
knows who hasn't responded. Falls through the cracks. Happened multiple times.

**Solution:** Now a system-enforced workflow:

1. HR opens Command Center → clicks "+ New Check"
2. System creates one tracked intake item per director with a deadline
3. Each item gets an attention score that **automatically escalates** as the
   deadline approaches (+25 when overdue)
4. Non-respondents surface in:
   - The Status Check panel (shows response %, red OVERDUE flags)
   - The Lighthouse view (at top of "What Requires Attention")
5. Directors or admin can "Mark Responded" with one click

**No human has to remember who hasn't responded. The system knows.**

---

## Bug Fix: William Denzer Organization Display

**Problem:** William Denzer's Organizations tab showed only 15 of 119 assigned
organizations under his name. The rest appeared under stale rep names (Jason
Mulder, David Lundberg, Shayla Hilliard).

**Root cause:** The `assigned_rep_name` text column was out of sync with the
`assigned_rep_id` foreign key. When organizations were reassigned to William
(user ID 58), the name column wasn't updated.

**Fix:** All 119 organizations now show `assigned_rep_name = 'William Denzer'`.
PIN set to 7188.

---

## Database Changes

**Table:** `executive_intake`
**New columns:**
- `attention_score` INTEGER — 0–100, computed from priority + staleness + urgency
- `classification_type` TEXT — one of 17 types (see list below)
- `due_date` TIMESTAMPTZ — deadline for time-sensitive items
- `related_person_id` INTEGER — reference to users table
- `related_organization_id` INTEGER — reference to organizations table

**New indexes:**
- `idx_intake_attention` — on attention_score DESC where status='open'
- `idx_intake_classification` — on classification_type where status='open'

---

## Classification Types

| Type | Auto-triggered by |
|------|------------------|
| `recruiting_application` | "applicant", "candidate", "hire" |
| `recruiting_offer_accepted` | "offer accepted", "acceptance" |
| `rep_inactive` | "inactive", "attrition", "not active" |
| `coach_reply` | "coach reply", "responded" |
| `order_paid` | "order paid", "payment" |
| `mockup_requested` | "mockup", "design", "creative" |
| `vendor_delayed` | "vendor delayed", "production delay" |
| `email_received` | source="email" |
| `meeting_completed` | "meeting", "call", "appointment" |
| `territory_assigned` | "territory assigned", "reassign" |
| `executive_decision` | "decision", "approval", "executive" |
| `hr_onboarding` | "onboarding", "hr", "personnel" |
| `academy_certification` | "certification", "academy", "training" |
| `revenue_blocker` | "revenue blocker", "bottleneck", "stuck" |
| `pipeline_update` | "pipeline", "forecast", "opportunity" |
| `status_check_response` | "status check", "check-in", "leadership status" |
| `other` | Fallback — doesn't match any keyword |

---

## New API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/intake/lighthouse?recalculate=1` | Scored, classified open items |
| POST | `/api/v1/intake/status-check` | Create batch status check items |
| GET | `/api/v1/intake/status-check` | Response summary (pending vs responded) |

---

## Files Changed

```
apps/api/src/modules/intake/intake.service.ts       (+250 lines — Classification Engine, Status Check)
apps/api/src/modules/intake/intake.controller.ts     (+50 lines — 3 new handlers)
apps/api/src/modules/intake/intake.routes.ts         (+4 lines — 3 new routes)
apps/api/src/index.ts                                (+1 line — /command route pattern)
apps/web/src/pages/ExecutiveCommandCenter.tsx        (new, 500 lines)
apps/web/src/App.tsx                                 (+2 lines — route + import)
apps/web/src/config/roles.ts                         (+2 lines — sidebar item)
apps/web/src/types.ts                                (+1 line — SidebarKey)
packages/database/migrations/1900000050000_*.js      (new — classification columns)
```

---

## How to Use

1. **See what needs attention:** Go to `/command` — Lighthouse shows scored items
2. **Create a status check:** Click "+ New Check" in the Status Check panel (ADMIN only)
3. **Mark a response:** Click "Mark Responded" on any pending item
4. **View intake:** Go to `/intake` — items are now sorted by attention score
5. **Recalculate scores:** Click "Recalculate Scores" or "🔄 Refresh" on Command Center

---

## Principles Enforced

1. Every event enters once (Executive Intake)
2. Every event has one owner
3. Every event remains visible until resolved (Lighthouse)
4. Awareness always precedes execution (Pulse → Forge)
5. Non-respondents can no longer hide — the system knows
