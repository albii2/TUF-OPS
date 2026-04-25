# V1 Canonicalization Status

## Active Runtime Components

- **Active frontend:** `apps/web` (Vite + React).
- **Active backend:** `apps/api` (Fastify).
- **Active DB source of truth:** `packages/database/migrations` (node-pg-migrate) with runtime access via `@packages/database`.

## Root Scripts (V1)

Added V1-canonical root scripts:

- `dev:web`
- `dev:api`
- `dev:v1`
- `build:v1`
- `typecheck:v1`

Removed root script references to the archived Next app (`apps/frontend`) for dev/build entrypoints.

## apps/web Route Map (Current)

Implemented routes:

- `/` → redirects to `/owner-dashboard`
- `/owner-dashboard`

Missing doctrine routes (not built yet):

- `/dashboard`
- `/organizations`
- `/organizations/:id`
- `/opportunities`
- `/opportunities/:id`
- `/orders`
- `/orders/:id`
- `/ops-workspace`
- `/reports`

## apps/api Route Map (Current)

Registered modules and effective paths:

- `POST /organizations`
- `GET /organizations`
- `PUT /organizations/:id`
- `DELETE /organizations/:id`
- `POST /opportunities`
- `GET /opportunities/organization/:organizationId`
- `PUT /opportunities/:id/stage`
- `GET /orders`
- `POST /orders`
- `GET /orders/:id`
- `POST /activities`
- `GET /activities/opportunity/:opportunityId`
- `GET /activities/organization/:organizationId`
- `PUT /activities/:id/complete`
- `GET /reporting/owner`
- `GET /reporting/director/:directorId`
- `GET /reporting/rep/:repId`
- `POST /production-requests`
- `PUT /production-requests/:id/status`
- `GET /production-requests/opportunity/:opportunityId`
- `GET /health`

## Archived apps/frontend Status

- `apps/frontend` remains in-repo for historical reference only.
- It is not used by V1 canonical root `dev:*v1`, `build:v1`, or `typecheck:v1` scripts.
- Next API routes and NextAuth files remain archived under `apps/frontend/src/app/api/*` and are out of V1 runtime path.

## Blockers / Follow-ups

1. `apps/web` currently implements only owner dashboard routes; doctrine route surface is largely missing and should be implemented in sequence after this canonicalization task.
2. A full monorepo typecheck remains noisy from pre-existing baseline issues outside this canonicalization change.

## Next Implementation Step

Stabilize canonical runtime contracts before page buildout:

1. Add typed API client functions in `apps/web/src/lib/api.ts` for each existing Fastify route.
2. Then implement doctrine pages in `apps/web` starting with `/dashboard` as the owner default command center.
