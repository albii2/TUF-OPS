# TUF Ops — Recruiting Pipeline Plan

> "CRM for people." Recruit → Certify → Deploy → Coach → Promote

---

## Entry Point

Candidates apply externally (Indeed, LinkedIn, referrals, website). A TUF team member receives the application + resume and creates the candidate record in TUF Ops manually. This is NOT a public-facing application form — it's an internal tracking system.

**New Candidate form:**
- First name, last name, email, phone
- Source dropdown (Indeed, LinkedIn, Referral, Website, Other)
- Resume upload (PDF)
- Notes (why they applied, any context from the external application)
- Stage auto-set to APPLIED

### New Table: `candidates`

```
candidates
├── id (SERIAL PK)
├── first_name, last_name, email, phone
├── stage: enum(APPLIED, SCREENING, INTERVIEW_SCHEDULED, INTERVIEW_COMPLETE,
│               OFFER_EXTENDED, OFFER_ACCEPTED, ACTIVATED, ACADEMY,
│               CERTIFIED, TERRITORY_ASSIGNED, ACTIVE_TAE, REJECTED)
├── source: string (referral, linkedin, website, etc.)
├── assigned_director_id → users.id
├── territory_id
├── resume_url
├── interview_date
├── interview_scorecard: JSONB
│   { communication, coachability, competitive_mindset,
│     availability, sales_experience, athletics_background }
├── offer_details: JSONB
│   { offer_letter_url, nda_url, commission_agreement_url, welcome_email_sent }
├── certification_progress: JSONB
│   { foundation_pct, sales_pct, certification_pct, director_approved }
├── user_id → users.id (linked after activation)
├── created_at, updated_at
```

### New Table: `candidate_activities`

```
candidate_activities
├── id (SERIAL PK)
├── candidate_id → candidates.id
├── type: enum(EMAIL_SENT, INTERVIEW_SCHEDULED, OFFER_SENT, etc.)
├── description
├── created_by → users.id
├── created_at
```

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/recruiting/candidates` | Submit application |
| GET | `/api/recruiting/candidates` | List candidates (filterable by stage, director) |
| GET | `/api/recruiting/candidates/:id` | Get candidate detail |
| PUT | `/api/recruiting/candidates/:id/stage` | Advance stage |
| PUT | `/api/recruiting/candidates/:id` | Update candidate (scorecard, notes) |
| GET | `/api/recruiting/dashboard` | Director dashboard (counts by stage, academy progress) |

### Automations (Phase 2)

| Trigger | Action |
|---------|--------|
| Candidate created (APPLIED) | Auto-reply email via SendGrid/Resend |
| Stage → INTERVIEW_SCHEDULED | Calendar invite |
| Stage → OFFER_ACCEPTED | Create TUF Ops user account + Academy enrollment |
| Stage → CERTIFIED | Unlock CRM permissions, notify director for territory assignment |
| 72h in ACADEMY without CERTIFIED | Warning email to candidate + director |
| REJECTED at any stage | Rejection email |

---

## Phase 2 — Frontend

### New Sidebar Entry: "Recruiting"

### New Page: `/recruiting` — Pipeline View

Kanban-style board with columns for each stage. Cards show candidate name, source, days in stage. Directors drag cards between stages. "Needs Attention" section highlights stalled candidates.

### New Page: `/recruiting/:id` — Candidate Detail

Full profile: application data, interview scorecard (editable during interview), offer documents (upload + track signing status), academy progress bar, territory assignment. Stage advancement buttons with confirmation.

### New Page: `/recruiting/dashboard` — Director Dashboard

Per-director metrics:
```
Minnesota
  Applicants: 12
  Interview Scheduled: 3
  Offers Out: 2
  Activated: 4
  Academy: Jason 67%, David 84%, Josh 91%, Shayla 42%
  Needs Attention: Shayla, Jason
```

---

## Phase 3 — Email + Document Automation

Integrate SendGrid or Resend for transactional emails:
- Application received
- Interview invitation
- Offer letter + NDA + Commission Agreement (DocuSign/PandaDoc integration)
- Welcome + credentials
- Certification overdue warnings
- Rejection

---

## Implementation Order

| Week | What | Effort |
|------|------|--------|
| 1 | Migration + backend (candidates table, API, routes) | 1 session |
| 2 | Frontend pipeline page + candidate detail | 1 session |
| 3 | Director dashboard + scorecards | 1 session |
| 4 | Automations (email, account creation, Academy enrollment) | 2 sessions |
| 5 | Document signing integration | 2 sessions |

---

## How It Connects to Existing TUF Ops

| Recruiting Stage | TUF Ops Action |
|-----------------|----------------|
| OFFER_ACCEPTED | Auto-create user in `users` table with role=REP, status=INACTIVE |
| ACTIVATED | Set user.status=ACTIVE, assign director_id, territory |
| ACADEMY | Link to existing Academy tracking (hr_docs_completed, practical_exercise_completed, director_signed_off) |
| CERTIFIED | Set is_certified=true, unlock CRM permissions via existing permission system |
| TERRITORY_ASSIGNED | Populate territory fields on user record |

No new tables needed for Academy/certification — the existing `users` table already has `is_certified`, `hr_docs_completed`, `director_signed_off`, `practical_exercise_completed`.
