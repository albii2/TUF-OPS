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

## Railway migration troubleshooting from your terminal

### Error: `Not run migration ... is preceding already run migration ...`

This means Railway already has a newer migration recorded in its migration table, but your checkout also contains an older-timestamp migration that still needs to be marked/applied. The current known case is:

- pending older migration: `1776804365915_-name-add-channel-type-to-opportunities`
- already-run newer migration: `1800000000000_create-users-table`

For this legacy Railway database shape, run the Railway-safe migration script once:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME"
pnpm -w run db:migrate:railway
```

`db:migrate:railway` disables only the node-pg-migrate ordering guard. It still runs the pending migration files and records them normally. Use it only for an existing Railway database that reports the out-of-order migration error; new local/test databases should keep using `pnpm -w db:migrate`.

### Error: `Command "db:seed:leads" not found`

Run the seed script through `pnpm run` from the repository root so pnpm resolves the root workspace script explicitly:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME"
pnpm -w run db:seed:leads
```

If either `db:migrate:railway` or `db:seed:leads` says the script is missing, you are not on a checkout that contains the data-restore scripts. Pull the latest branch/PR first, then rerun the command from the folder that contains `package.json` and `pnpm-workspace.yaml`.

If you need to unblock yourself before your local checkout has those scripts, run the underlying commands directly from the repository root:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME"
./node_modules/.bin/node-pg-migrate --no-check-order -m packages/database/migrations up
node packages/database/seed_leads_from_csv.js
```

The direct commands do the same work as the scripts: the first applies pending migrations while bypassing the legacy ordering guard, and the second imports the bundled CSV leads.
