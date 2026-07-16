# DEPLOYMENT.md — TUF Ops Deployment Guide

## Hosting Platform

**Railway** — service name: `terrific-patience`

The entire application (API server + frontend) is served from a single Railway service.  
There is no separate Vercel or Render deployment.

## Database

**Railway PostgreSQL** — provisioned via Railway's built-in PostgreSQL plugin.  
Connection string provided to the service via the `DATABASE_URL` environment variable.

## Architecture

The **Fastify API server** (in `apps/api`) serves double duty:
- **API routes** at `/api/v1/*` (and `/api/auth/*` for legacy identity endpoints)
- **Static frontend files** from `dist/public/` — the Vite-built web app (`apps/web/dist`) is
  copied into `apps/api/dist/public/` during the build step
- **SPA fallback** — any non-API GET request returns `index.html` for client-side routing

## Build & Start

### Build Command (Railway)
```bash
pnpm --filter @apps/api build && pnpm --filter web build && mkdir -p apps/api/dist/public && cp -r apps/web/dist/* apps/api/dist/public/
```

1. Compiles the Fastify API TypeScript → `apps/api/dist/`
2. Builds the Vite web app → `apps/web/dist/`
3. Copies the web dist into `apps/api/dist/public/` so Fastify can serve it

### Start Command (Railway)
```bash
cd apps/api && node dist/index.js
```

The API server:
- Listens on `0.0.0.0:$PORT` (default 4000)
- In production (`NODE_ENV=production`), serves static files from `dist/public/`
- For local development, set `WEB_DIST_PATH=../../web/dist` to serve from the web source

### Pre-Deploy (Railway)
```bash
pnpm db:migrate:railway:prod
```

Runs database migrations against the Railway PostgreSQL instance.

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Railway PostgreSQL connection string |
| `PORT` | Server port (Railway sets this automatically) |
| `NODE_ENV` | Set to `production` on Railway |
| `AUTH_TOKEN_SECRET` | JWT signing secret |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `WEB_DIST_PATH` | Override static file path (default: `public/` in prod) |

## Deprecated Configurations

- `vercel.json` (root) — **deprecated**, no longer used
- `apps/web/vercel.json` — **deprecated**, no longer used
- `apps/frontend/vercel.json` — **deprecated**, no longer used
- `render.yaml` — **deprecated**, no longer used

These files are kept for historical reference only.

## API Routes

All API routes are now consolidated under `/api/v1/*`:

```
/api/v1/organizations
/api/v1/opportunities
/api/v1/activities
/api/v1/reporting
/api/v1/production-requests
/api/v1/orders
/api/v1/creative-requests  (sub-routes of /api/v1)
/api/v1/training
/api/v1/announcements      (sub-routes of /api/v1)
/api/v1/daily-activities
/api/v1/recruiting
/api/v1/intake
/api/v1/people
/api/v1/dashboard
/api/v1/comms
/api/v1/vendors
/api/v1/work-items
/api/v1/auth/*             (login, me, user management)
/api/v1/users/*            (frontend-compat alias for user routes)
```

### Legacy compat

- `/api/auth/login` and `/api/auth/me` remain at `/api/auth` (not under `/api/v1`)
  pending the identity refactor.
- Any requests to `/api/*` that are NOT under `/api/v1/*` or `/api/auth/*` are
  logged with a deprecation warning.

## Health Checks

- `GET /health` — basic service health
- `GET /api/v1/health` — same as above
- `GET /health/data` — database-backed health with row counts
