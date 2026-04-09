# TUF Ops Consultant Execution Checklist (Hydration + Mockup Flow Stabilization)

Date: 2026-04-07

## Goal

Restore deterministic runtime behavior and eliminate hydration/runtime errors by fixing contract drift, HTML semantics, and tooling contamination in a strict order.

---

## Phase 0 — Freeze and baseline

1. Create a dedicated branch for stabilization work.
2. Capture baseline evidence:
   - current branch + commit hash,
   - full browser console log on affected page,
   - server logs during page load and mockup form submit.

Commands:

```bash
git rev-parse --abbrev-ref HEAD
git rev-parse --short HEAD
git status --short --branch
```

---

## Phase 1 — Data contract integrity first (backend)

### Objective
Resolve server-side contract drift before touching hydration symptoms.

### Checkpoints

- Validate Prisma schema and generated client are in sync with route usage.
- In mockup flow, confirm whether models like `Mockup` / `RepActivity` exist in active schema.
- If missing:
  - Option A: Reintroduce models + migration + regenerate client.
  - Option B: Feature-flag/remove route paths that reference missing models.

Commands:

```bash
pnpm --filter frontend exec dotenv -e ../../.env -- prisma validate
pnpm --filter frontend exec dotenv -e ../../.env -- prisma generate
pnpm --filter frontend exec tsc --noEmit
```

Exit criteria:
- No Prisma validation errors.
- No TypeScript errors for missing Prisma model properties.

---

## Phase 2 — Hydration mismatch isolation

### Objective
Pinpoint exact server/client DOM divergence.

### Checklist

1. Reproduce on one page route only (the failing opportunity detail page).
2. Temporarily disable non-critical dynamic widgets in that page to isolate mismatch source.
3. Verify semantic HTML:
   - No block element nested inside `<p>`.
   - No conditionally rendered mismatched wrappers between server and client.
4. Ensure all client-only values are guarded (time/locale/random/window checks).

Commands:

```bash
pnpm --filter frontend dev
# Reproduce and capture browser + server logs
```

Exit criteria:
- No `Hydration failed because the initial UI does not match` errors.

---

## Phase 3 — Tooling contamination cleanup

### Objective
Remove non-Next runtime artifacts causing unexpected client requests.

### Checklist

- Search for and remove `@vite/client` injections/snippets.
- Verify only Next.js runtime scripts remain.

Commands:

```bash
rg -n "@vite/client|vite" apps/frontend/src apps/frontend
```

Exit criteria:
- No `GET /@vite/client 404` in browser console.

---

## Phase 4 — Dialog accessibility hardening

### Objective
Resolve Radix dialog warnings and prevent a11y regressions.

### Checklist

- Every `DialogContent` has either:
  - a `DialogDescription`, or
  - `aria-describedby={undefined}` intentionally.

Commands:

```bash
rg -n "DialogContent|DialogDescription|aria-describedby" apps/frontend/src
```

Exit criteria:
- No warning: `Missing Description or aria-describedby for DialogContent`.

---

## Phase 5 — Font asset sanity

### Objective
Fix font decode/OTS parsing warnings.

### Checklist

- Confirm custom font file exists and is valid format.
- Confirm correct `@font-face` declaration (`src`, `format`, path).
- Remove invalid preload declarations.

Commands:

```bash
rg -n "VCR_OSD_MONO|@font-face|fonts/" apps/frontend/src apps/frontend
# optionally validate local font file with system tooling
```

Exit criteria:
- No `Failed to decode downloaded font` / `OTS parsing error` warnings.

---

## Phase 6 — Final gate verification

Run all gates after fixes:

```bash
pnpm --filter frontend exec dotenv -e ../../.env -- prisma validate
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend lint
pnpm --filter frontend build
git status --short --branch
git log --oneline -n 10
```

GO criteria:
- All 4 gates pass.
- Runtime console clean of hydration, dialog description, vite-client, and font decode errors.
- Working tree clean on the audited commit.

---

## Deliverables for sign-off

1. Branch name + commit hash.
2. Before/after error matrix by category:
   - data contract,
   - hydration,
   - tooling contamination,
   - accessibility,
   - assets/fonts.
3. Raw command outputs for final gates.
4. PR description with explicit residual risks (if any).
