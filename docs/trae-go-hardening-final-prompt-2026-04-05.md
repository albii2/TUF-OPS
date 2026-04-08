# Final Trae Prompt — Drive TUF-OPS to GO Status

Copy/paste the prompt below into Trae exactly as-is.

---

You are working in the `TUF-OPS` repository. Your only objective is to bring the repository to **GO** readiness with reproducible evidence.

## Non-negotiable constraints

- Do not add new product features.
- Do not perform broad refactors unrelated to readiness.
- Do not claim success without command output.
- Work only on branch: `stabilization/foundational-hardening`.
- Keep commits small and logically grouped.
- If branch does not exist locally, fetch it and create local tracking first.

## Phase 0 — branch setup and context capture

Run and show output:

1. `git fetch --all --prune`
2. `git checkout -B stabilization/foundational-hardening origin/stabilization/foundational-hardening || git checkout stabilization/foundational-hardening`
3. `git rev-parse --short HEAD`
4. `git status --short --branch`

If checkout fails, stop and report exact reason.

## Phase 1 — baseline gate run (before changes)

Run and show output:

1. `pnpm --filter frontend exec dotenv -e ../../.env -- prisma validate`
2. `pnpm --filter frontend exec tsc --noEmit`
3. `pnpm --filter frontend lint`
4. `pnpm --filter frontend build`

Create a short failure matrix grouped by category:
- role/session contract
- schema/API drift
- lint determinism
- build/env

## Phase 2 — mandatory fixes to reach GO

### A) Role/session contract unification

- Unify role taxonomy across Prisma, auth types, navigation, and guards.
- Ensure `session.user.id`, `session.user.role`, and `session.user.managerId` are strongly typed and populated consistently.
- Remove stale aliases (`regional_director`, `sales_rep`) unless intentionally mapped with a single canonical transform.

### B) Schema/API alignment

- For every route referencing missing Prisma models/fields, do one of:
  1) align route to active schema, or
  2) feature-flag/remove route from active surface.
- Eliminate unsupported payload fields (e.g., relation names not in schema).

### C) Seed determinism

- Update seed data to valid enums and existing schema fields.
- Ensure seed can run cleanly in configured environment.

### D) Lint determinism

- Make lint non-interactive and CI-safe.
- Ensure `pnpm --filter frontend lint` runs unattended.

### E) Build reliability

- Make build pass in CI-compatible mode.
- If external font/network dependency blocks CI, implement deterministic fallback and document it.

## Phase 3 — verification gates (after fixes)

Re-run and show full output:

1. `pnpm --filter frontend exec dotenv -e ../../.env -- prisma validate`
2. `pnpm --filter frontend exec tsc --noEmit`
3. `pnpm --filter frontend lint`
4. `pnpm --filter frontend build`

Then run:

5. `git status --short --branch`
6. `git log --oneline -n 15`

## Phase 4 — docs and evidence update

Update `docs/repo-foundational-readiness-report-2026-04-04.md` with:

- branch and exact commit hash verified,
- before/after gate matrix,
- exact command transcript summary,
- final decision: GO or NO-GO,
- residual risks (if any).

## Phase 5 — PR output format

Create one PR from `stabilization/foundational-hardening` with:

1. Title: `chore: foundational hardening to GO readiness`
2. Body sections:
   - Scope of hardening
   - Files/subsystems changed
   - Gate results (all four commands)
   - Risks and follow-ups

## Definition of Done (must all be true)

- Prisma validate passes.
- Typecheck passes.
- Lint passes non-interactively.
- Build passes.
- Readiness report updated with branch+commit proof.
- No speculative claims; all claims backed by command output.

If any DoD item fails, do not declare GO.

---

End of prompt.
