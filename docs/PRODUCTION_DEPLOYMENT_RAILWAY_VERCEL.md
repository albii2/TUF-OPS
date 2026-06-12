# TUF Ops Production Deployment (Vercel + Railway)

## Architecture

- Frontend: `apps/web` (Vite React) deployed by Vercel from the **repo root** using root `vercel.json`.
- API: `apps/api` (Fastify) deployed on Railway.
- Database: Railway Postgres.
- Frontend API strategy: Vercel rewrites `/api/*` to the Railway API domain for health/auth/API calls.

Vercel must not deploy `apps/api`. If it does, preview requests can crash while trying to connect to `127.0.0.1:5432` because Vercel does not provide the Railway Postgres socket.

## Vercel web project

Project settings:

- Root Directory: repo root (blank/default in Vercel).
- Framework Preset: Other / Vite.
- Build Command: controlled by root `vercel.json` (`VITE_ENABLE_LEAD_BOOTSTRAP=true pnpm --filter web build`).
- Output Directory: controlled by root `vercel.json` (`apps/web/dist`).

Root `vercel.json` rewrites:

- `/api/:path*` -> `https://tuf-ops-api-production.up.railway.app/:path*`
- all other paths -> `/index.html` for React Router.

If the Railway API domain changes, update root `vercel.json` and redeploy.

### Vercel env vars

- Do not set `DATABASE_URL` on the Vercel web project. Railway owns the API/database connection.
- Leave `VITE_DATA_MODE` unset unless API-backed web adapters have been finished. The current deployable web UI uses bundled lead data/mock-mode storage.
- Optional: `VITE_ENABLE_LEAD_BOOTSTRAP=false` only when you intentionally want an empty browser-local lead dataset.

## Railway API (`apps/api`)

Build command:

```bash
pnpm --filter @apps/api build
```

Start command:

```bash
pnpm --filter @apps/api start
```

Required env vars:

- `PORT` (Railway injects this automatically)
- `DATABASE_URL` (Railway Postgres connection string)
- `CORS_ORIGINS=https://ops.tufsports.us,https://tuf-ops-true.vercel.app,http://localhost:5173,http://localhost:5174`
- `AUTH_TOKEN_SECRET`
- `INITIAL_OWNER_CREDENTIAL` for first secure bootstrap/migration in production-like runtimes

Health endpoints:

- `GET /health`
- `GET /health/data`

## Database / migrations / bundled lead restore

Use repo root commands against the Railway DB:

```bash
DATABASE_URL="postgresql://..." pnpm -w db:migrate
DATABASE_URL="postgresql://..." pnpm db:seed:leads
```

Notes:

- `db:migrate` and `db:seed:leads` use `DATABASE_URL`.
- `db:seed:leads` restores committed lead data from `apps/web/src/assets/tuf_leads_final_enriched.csv` and is idempotent.
- `TEST_DATABASE_URL` is only for tests/local test overrides and should not be used in production.

## Preview → production workflow

1. Push a branch or open a PR.
2. Vercel creates a Preview deployment.
3. Open the Preview URL and smoke-test login, organizations, opportunities, orders, and `/data-health`.
4. Fix any preview failure before merge.
5. Merge to `main` only when preview is healthy; Vercel then creates the Production deployment.

## Verification checklist

1. `https://ops.tufsports.us` loads the Vite app.
2. The latest Vercel preview URL loads the same app and does not show Fastify/serverless DB errors.
3. `https://<railway-api-domain>/health` returns `status: ok`.
4. Browser network calls to `/api/*` return through the Vercel rewrite.
5. `GET /data-health` in the app can reach `/api/health/data`.
6. Railway API can read/write Railway Postgres with `DATABASE_URL`.
