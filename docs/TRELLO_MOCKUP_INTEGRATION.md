# Trello Mockup Request Integration

TUF Ops can create Trello cards when a rep submits a creative/mockup request from an opportunity.

## Required Trello setup

Create or choose a Trello board/list that interns use for the mockup queue, then configure the web app with:

```text
VITE_TRELLO_KEY=your_trello_api_key
VITE_TRELLO_TOKEN=your_trello_api_token
VITE_TRELLO_MOCKUP_LIST_ID=trello_list_id_for_intern_mockups
```

Optional routing helpers:

```text
VITE_TRELLO_MOCKUP_MEMBER_IDS=comma,separated,trello,member,ids
VITE_TRELLO_MOCKUP_LABEL_IDS=comma,separated,trello,label,ids
```

## What gets sent

When a rep submits a creative request, TUF Ops creates the request locally first, then posts a Trello card into the configured mockup list. The Trello card includes:

- request type and priority
- design team
- submitting rep
- opportunity and organization IDs
- sport and season
- needed items
- due date
- design notes
- inspiration/reference notes
- asset links
- internal notes
- TUF Ops creative request ID

## Trello card status in TUF Ops

Each creative request tracks its Trello dispatch status:

- `SENT` — card was created and linked in Trello
- `FAILED` — request was saved locally, but Trello card creation failed
- `NOT_CONFIGURED` — required `VITE_TRELLO_*` variables are missing
- `PENDING` — Trello dispatch is in progress

If Trello is not configured or unavailable, the rep's creative request is still saved locally so the team does not lose the work.

## Notes

The current frontend uses Vite `VITE_*` variables, which are exposed to the browser. This is acceptable for the current mock/static app, but production should proxy Trello card creation through a server endpoint so Trello tokens are not exposed client-side.
