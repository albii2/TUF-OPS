# Vercel preview + data restore runbook

This project deploys as two pieces:

1. **Vercel** serves the Vite web app from `apps/web/dist`.
2. **Railway** serves the Fastify API and owns the Postgres connection.

Do **not** deploy `apps/api` as the Vercel project. If Vercel runs the API serverless entrypoint it will try to connect to `127.0.0.1:5432` when `DATABASE_URL` is missing, which is the failure shown in the preview logs.

## Fix the Vercel project

In Vercel Project Settings for `tuf-ops-true`:

1. Go to **Settings → General**.
2. Set **Root Directory** to the repository root. Leave it blank if the repo root is the default.
3. Keep the project framework as **Other** (or Vite). The root `vercel.json` controls the build.
4. Redeploy the latest preview branch.

The root `vercel.json` builds only `web`, outputs `apps/web/dist`, and rewrites `/api/*` to the Railway API.

## Preview vs production workflow

- Open a PR or push to a non-`main` branch → Vercel creates a **Preview** deployment.
- Merge to `main` → Vercel creates the **Production** deployment.
- If a preview says **Ready**, open that preview URL first and smoke-test login, organizations, opportunities, orders, and `/data-health`.
- Only merge after preview is healthy.

## Restore bundled lead data into Postgres

The bundled lead file is committed at `apps/web/src/assets/tuf_leads_final_enriched.csv`.

After migrations are applied to the target Railway database, run:

```bash
DATABASE_URL="postgresql://..." pnpm db:seed:leads
```

The seed is idempotent. It will:

- create missing organizations from the bundled lead CSV;
- attach Athletic Director contacts when the `contacts` table exists;
- create the four default opportunity lanes for every seeded organization;
- skip organizations/opportunities that already exist.

## Restore bundled lead data in the browser preview

The Vite app now bootstraps bundled leads by default when browser-local organization storage is empty. Set `VITE_ENABLE_LEAD_BOOTSTRAP=false` only if you deliberately want an empty smoke-test dataset.
