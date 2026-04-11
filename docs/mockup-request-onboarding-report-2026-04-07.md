# Mockup Request Stabilization + Onboarding Report (2026-04-07)

## What was implemented

### 1) Working mockup request -> Trello card flow
The `/api/mockups` POST route now follows the active repository contracts:
- Validates authenticated session before processing.
- Validates required request fields (`opportunity_id`, `teamName`).
- Loads the opportunity + program context from Prisma.
- Creates a Trello card in the configured mockup list.
- Updates the opportunity stage to `mockup` and saves the Trello URL in `nextStep`.

### 2) New feature: remove mockup request
The `/api/mockups` DELETE route now supports rollback/cancel behavior:
- Auth required.
- Accepts `opportunity_id` and optional `restore_stage`.
- Extracts Trello card URL from `opportunity.nextStep`.
- Archives the Trello card when a Trello card id is found.
- Clears `nextStep` and restores stage (default: `contacted`).

### 3) Trello service hardening
`src/lib/trello.ts` now includes:
- `createMockupTrelloCard` (create card)
- `archiveTrelloCard` (close/archive card)
- `getTrelloCardIdFromUrl` (safe URL parsing)
- shared request helper with explicit error text when Trello API fails.

---

## Required environment variables

These must be present in runtime env (`.env` used by frontend):

- `TRELLO_API_KEY`
- `TRELLO_API_TOKEN`
- `TRELLO_MOCKUP_LIST_ID`

If any are missing, mockup routes fail fast with explicit server errors.

---

## API usage contract for your AI worker

### Create mockup request
`POST /api/mockups`

Body:
```json
{
  "opportunity_id": 123,
  "teamName": "Northwood High",
  "jerseyNumber": "1",
  "primaryColor": "#000000",
  "secondaryColor": "#ffffff",
  "tertiaryColor": "#ff0000",
  "notes": "Need home/away variants"
}
```

Success response includes:
- `success: true`
- `card` (Trello card metadata including URL)
- `opportunityId`

### Remove mockup request
`DELETE /api/mockups`

Body:
```json
{
  "opportunity_id": 123,
  "restore_stage": "contacted"
}
```

- `restore_stage` optional.
- Allowed values: `lead`, `contacted`, `sample`, `invoice`, `closed_won`, `closed_lost`.
- If omitted, defaults to `contacted`.

Success response includes:
- `success: true`
- `opportunityId`
- `archivedCardId` (nullable)

---

## Onboarding steps for the AI worker

1. Confirm branch and pull latest.
2. Verify env vars are present.
3. Start app and authenticate with a valid user.
4. Run a POST `/api/mockups` request against an existing opportunity.
5. Verify:
   - Trello card exists in the configured list.
   - Opportunity stage is `mockup`.
   - Opportunity `nextStep` contains Trello URL.
6. Run DELETE `/api/mockups` for same opportunity.
7. Verify:
   - Trello card is archived.
   - Opportunity stage restored.
   - `nextStep` is cleared.

---

## Known constraints

- This implementation intentionally avoids non-existent Prisma models (`mockup`, `repActivity`) in current schema.
- If team later reintroduces dedicated `MockupRequest` DB model, this route should evolve to persist request records separately.

