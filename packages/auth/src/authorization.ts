/**
 * TUF Ops 2.0 — authorization model (ADDITIVE).
 *
 * Founder ruling R6: KEEP the phone/PIN auth MECHANISM, REBUILD the
 * authorization model, and enforce a clean auth boundary (no auth coupling
 * into Markets / LETTERED / ISSUE / tasks / revenue).
 *
 * This module is that rebuilt model for the 2.0 surface. It is deliberately
 * ADDITIVE and does not touch the legacy 1.0 `permissions` map / role counts
 * (those remain governed by `permissions.ts` and its tests). The 2.0 model uses
 * four canonical operating roles:
 *
 *   rep | director | ops | admin
 *
 * and a small, explicit permission vocabulary for the 2.0 surfaces. Keeping the
 * two models separate means legacy route guards keep working unchanged while
 * the 2.0 routes get a first-class, auditable authorization layer.
 */

import { PermissionDenied } from './errors.js';
import { normalizeRole, roles } from './roles.js';

/** The four canonical 2.0 operating roles (R6). */
export const canonicalRoles = {
  REP: 'rep',
  DIRECTOR: 'director',
  OPS: 'ops',
  ADMIN: 'admin',
} as const;

export type CanonicalRole = (typeof canonicalRoles)[keyof typeof canonicalRoles];

export const CANONICAL_ROLES: readonly CanonicalRole[] = [
  canonicalRoles.REP,
  canonicalRoles.DIRECTOR,
  canonicalRoles.OPS,
  canonicalRoles.ADMIN,
];

/**
 * Map any legacy/database role string onto a canonical 2.0 role. Returns null
 * for unknown roles (which then fail every permission check — fail closed).
 */
export function toCanonicalRole(role: unknown): CanonicalRole | null {
  switch (normalizeRole(role)) {
    case roles.ADMIN:
      return canonicalRoles.ADMIN;
    case roles.REGIONAL_DIRECTOR:
    case roles.DIRECTOR:
      return canonicalRoles.DIRECTOR;
    case roles.OPERATIONS:
      return canonicalRoles.OPS;
    case roles.TAE:
      return canonicalRoles.REP;
    default:
      return null;
  }
}

/**
 * 2.0 permission vocabulary. Values are namespaced (`market:view`) so they can
 * never collide with the legacy flat permission strings.
 */
export const marketPermissions = {
  /** Read the operational Markets list / a Market. */
  VIEW_MARKETS: 'market:view',
  /** Edit a Market's operational fields (state, next action, owner, priority). */
  MANAGE_MARKET: 'market:manage',
  /** Perform ACTIVATE MARKET — the sole gateway that creates a Market. */
  ACTIVATE_MARKET: 'market:activate',
  /** Read the read-only Market Intelligence Universe (the 272 organizations). */
  VIEW_MARKET_UNIVERSE: 'market:universe:view',
} as const;

export type MarketPermission = (typeof marketPermissions)[keyof typeof marketPermissions];

export const MARKET_PERMISSIONS: readonly MarketPermission[] = [
  marketPermissions.VIEW_MARKETS,
  marketPermissions.MANAGE_MARKET,
  marketPermissions.ACTIVATE_MARKET,
  marketPermissions.VIEW_MARKET_UNIVERSE,
];

/**
 * Role → 2.0 permission grant.
 *
 *   rep      — read Markets only. Cannot manage or activate.
 *   director — read, manage and activate Markets; read the universe.
 *   ops      — read Markets (fulfillment context). Cannot manage or activate.
 *   admin    — everything.
 *
 * ACTIVATE is intentionally leadership-only (director/admin): activation is an
 * intentional allocation of TUF resources, not a rep self-serve action.
 */
export const roleMarketPermissions: Record<CanonicalRole, readonly MarketPermission[]> = {
  [canonicalRoles.REP]: [marketPermissions.VIEW_MARKETS],
  [canonicalRoles.DIRECTOR]: [
    marketPermissions.VIEW_MARKETS,
    marketPermissions.MANAGE_MARKET,
    marketPermissions.ACTIVATE_MARKET,
    marketPermissions.VIEW_MARKET_UNIVERSE,
  ],
  [canonicalRoles.OPS]: [marketPermissions.VIEW_MARKETS],
  [canonicalRoles.ADMIN]: MARKET_PERMISSIONS,
};

/** Resolve the 2.0 permission set for any role string (fail-closed on unknown). */
export function getMarketPermissions(role: unknown): Set<MarketPermission> {
  const canonical = toCanonicalRole(role);
  if (!canonical) return new Set();
  return new Set(roleMarketPermissions[canonical]);
}

/** Non-throwing check: does `role` hold `permission` in the 2.0 model? */
export function hasMarketPermission(role: unknown, permission: MarketPermission): boolean {
  return getMarketPermissions(role).has(permission);
}

/**
 * Throwing check used by the API auth boundary. Throws `PermissionDenied`
 * (HTTP 403) when the role does not hold the permission; unknown roles fail
 * closed with the same error.
 */
export function requireMarketPermission(role: unknown, permission: MarketPermission): void {
  if (hasMarketPermission(role, permission)) return;
  const canonical = toCanonicalRole(role) ?? 'anonymous';
  throw new PermissionDenied(
    `Permission '${permission}' required. Your role '${canonical}' does not have it.`,
  );
}
