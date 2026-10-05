/**
 * TUF Ops 2.0 — canonical NAVIGATION configuration (Wave 2A).
 *
 * This is the SINGLE source of truth for the 2.0 information architecture. The
 * web shell renders it; the API/authorization layer reasons about the same role
 * vocabulary. It is deliberately DATA, not a component, so the frontend shell
 * and the backend authorization model cannot drift.
 *
 * The 2.0 IA (task brief, Wave 2A):
 *
 *   COMMAND · MARKETS · SELL [Team Uniforms | LETTERED | ISSUE] ·
 *   OPERATE [Orders | Production | Creative] ·
 *   PEOPLE  [Team | Recruiting | Academy] ·
 *   INTELLIGENCE [Performance | Territory] · ADMIN
 *
 * Role vocabulary — the four canonical 2.0 operating roles (founder ruling R6):
 *   rep | director | ops | admin
 * These are the 2.0 authorization vocabulary. Legacy database roles map onto
 * them in `@packages/auth` (`toCanonicalRole`); do not re-derive that mapping
 * here, and do not import auth into this pure package.
 *
 * Academy is included per the IA but flagged `deferred` (ruling R7: Academy is
 * DEFERRED, preserved but unwired from the primary runtime until re-commissioned).
 */

/** The four canonical 2.0 operating roles (R6). Keep in sync with @packages/auth. */
export type CanonicalRole = 'rep' | 'director' | 'ops' | 'admin';

export const CANONICAL_ROLES: readonly CanonicalRole[] = ['rep', 'director', 'ops', 'admin'];

/** A single navigable destination. */
export interface NavItem {
  /** Stable key (`lettered`, `orders`, …). Never a display string. */
  key: string;
  /** Display label. */
  label: string;
  /** 2.0 route the shell links to. */
  route: string;
  /**
   * Roles allowed to see this item. Omitted ⇒ visible to every role that can
   * see the containing section.
   */
  visibleTo?: readonly CanonicalRole[];
  /**
   * True when the destination is intentionally preserved-but-unwired in 2.0
   * (currently Academy, per R7). It is present in the config so it can be
   * re-commissioned without a config change, but a shell may render it as
   * unavailable.
   */
  deferred?: boolean;
}

/** A top-level navigation section. */
export interface NavSection {
  /** Stable section key (`command`, `markets`, `sell`, …). */
  key: string;
  /** Display label — the IA names sections in caps. */
  label: string;
  /** Roles allowed to see the section. Omitted ⇒ every role. */
  visibleTo?: readonly CanonicalRole[];
  /** Ordered children. */
  items: readonly NavItem[];
}

/**
 * The canonical 2.0 navigation, in display order.
 *
 * Visibility defaults are a product decision recorded here so the shell and the
 * API agree; `navigationForRole` is the only consumer contract.
 *   - rep      — command, markets (read), sell, intelligence.performance
 *   - director — everything except admin
 *   - ops      — command, markets (read), operate
 *   - admin    — everything
 */
export const NAVIGATION: readonly NavSection[] = [
  {
    key: 'command',
    label: 'COMMAND',
    visibleTo: ['rep', 'director', 'ops', 'admin'],
    items: [{ key: 'command-center', label: 'Command Center', route: '/command' }],
  },
  {
    key: 'markets',
    label: 'MARKETS',
    visibleTo: ['rep', 'director', 'ops', 'admin'],
    items: [{ key: 'markets', label: 'Markets', route: '/markets' }],
  },
  {
    key: 'sell',
    label: 'SELL',
    visibleTo: ['rep', 'director', 'admin'],
    items: [
      { key: 'team-uniforms', label: 'Team Uniforms', route: '/sell/team-uniforms' },
      { key: 'lettered', label: 'LETTERED', route: '/sell/lettered' },
      { key: 'issue', label: 'ISSUE', route: '/sell/issue' },
    ],
  },
  {
    key: 'operate',
    label: 'OPERATE',
    visibleTo: ['director', 'ops', 'admin'],
    items: [
      { key: 'orders', label: 'Orders', route: '/operate/orders' },
      { key: 'production', label: 'Production', route: '/operate/production' },
      { key: 'creative', label: 'Creative', route: '/operate/creative' },
    ],
  },
  {
    key: 'people',
    label: 'PEOPLE',
    visibleTo: ['director', 'admin'],
    items: [
      { key: 'team', label: 'Team', route: '/people/team' },
      { key: 'recruiting', label: 'Recruiting', route: '/people/recruiting' },
      // R7 — Academy is DEFERRED: preserved, but unwired from the primary runtime.
      { key: 'academy', label: 'Academy', route: '/people/academy', deferred: true },
    ],
  },
  {
    key: 'intelligence',
    label: 'INTELLIGENCE',
    visibleTo: ['rep', 'director', 'admin'],
    items: [
      { key: 'performance', label: 'Performance', route: '/intelligence/performance' },
      { key: 'territory', label: 'Territory', route: '/intelligence/territory', visibleTo: ['director', 'admin'] },
    ],
  },
  {
    key: 'admin',
    label: 'ADMIN',
    visibleTo: ['admin'],
    items: [
      { key: 'admin-home', label: 'Admin', route: '/admin' },
      { key: 'users', label: 'Users', route: '/admin/users' },
      { key: 'settings', label: 'Settings', route: '/admin/settings' },
    ],
  },
];

/** True when `role` may see an item gated by `visibleTo` (undefined ⇒ all). */
export function isVisibleTo(
  role: CanonicalRole | null | undefined,
  visibleTo: readonly CanonicalRole[] | undefined,
): boolean {
  if (!visibleTo) return true;
  if (!role) return false;
  return visibleTo.includes(role);
}

/**
 * The navigation a given canonical role should render — sections and items the
 * role cannot see are removed, and empty sections are dropped. Order is
 * preserved exactly as declared in `NAVIGATION`.
 */
export function navigationForRole(role: CanonicalRole | null | undefined): NavSection[] {
  const sections: NavSection[] = [];
  for (const section of NAVIGATION) {
    if (!isVisibleTo(role, section.visibleTo)) continue;
    const items = section.items.filter((item) => isVisibleTo(role, item.visibleTo));
    if (items.length === 0) continue;
    sections.push({ ...section, items });
  }
  return sections;
}

/** Flatten every route in the canonical navigation (useful for route guards). */
export function allNavigationRoutes(): string[] {
  const routes: string[] = [];
  for (const section of NAVIGATION) {
    for (const item of section.items) routes.push(item.route);
  }
  return routes;
}
