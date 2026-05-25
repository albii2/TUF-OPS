# TUF Ops Production Deployment (Vercel + Railway)

## Architecture
- Frontend: `apps/web` (Vite React) on Vercel (`ops.tufsports.us`)
- API: `apps/api` (Fastify) on Railway
- Database: Railway Postgres
- Frontend API strategy: **Vercel rewrite** from `/api/*` to Railway API domain.

## Vercel (apps/web)
Project settings:
- Root Directory: `apps/web`
- Build Command: `pnpm --filter web build`
- Output Directory: `dist`

`apps/web/vercel.json` rewrites:
- `/api/:path*` -> `https://tuf-ops-api-production.up.railway.app/:path*`

If Railway API domain changes, update `apps/web/vercel.json` destination and redeploy.

### Vercel Env Vars (apps/web)
- `VITE_DATA_MODE=api`
- `VITE_API_BASE_URL=/api` (optional; default already `/api`)

## Railway API (apps/api)
Build command:
- `pnpm --filter @apps/api build`

Start command:
- `pnpm --filter @apps/api start`

Required env vars:
- `PORT` (Railway injects this automatically)
- `DATABASE_URL` (Railway Postgres connection string)
- `CORS_ORIGINS=https://ops.tufsports.us,http://localhost:5173,http://localhost:5174`

Health endpoint:
- `GET /health`

## Database / Migrations
Use repo root commands against Railway DB:
- `pnpm -w db:migrate`

Notes:
- `db:migrate` uses `DATABASE_URL`.
- `TEST_DATABASE_URL` is only for tests/local test overrides and should not be used in production.

## Verification checklist
1. `https://ops.tufsports.us` loads.
2. `https://<railway-api-domain>/health` returns status ok.
3. Browser network calls to `/api/*` return 2xx through Vercel rewrite.
4. CORS preflight from `ops.tufsports.us` succeeds.
5. API can read/write Railway Postgres with `DATABASE_URL`.
