# ADR-0001: Canonical V1 Frontend = `apps/frontend` (Next.js)

## Status
Accepted - April 23, 2026

## Decision
`apps/frontend` is the only active V1 frontend shell for beta flow delivery.

`apps/web` is frozen/deprecated for V1 execution and receives only critical break/fix changes.

## Why
- `apps/frontend` already has authenticated app-shell foundations using NextAuth.
- It already contains the V1 route surface (`/dashboard`, `/organizations`, `/opportunities`) with less lift than recreating everything in `apps/web`.
- Unifying here is the fastest path to one protected frontend surface with server-aware routing.

## Route Contract Freeze (V1)
- `/auth/signin`
- `/dashboard`
- `/organizations`
- `/organizations/[id]`
- `/opportunities`
- `/opportunities/[id]`
- `/orders`
- `/ops-workspace`

## Deprecation Policy (`apps/web`)
- No new feature work.
- No route additions.
- Critical fixes only, documented in commit message.
- Root scripts do not target `apps/web` for V1 dev/build flows.
