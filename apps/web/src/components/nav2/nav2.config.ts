/**
 * TUF Ops 2.0 — approved navigation architecture (plan §2.4).
 *
 *   COMMAND        actionable operating surface (NOT a vanity dashboard)
 *   MARKETS        War Board + Pipeline first (map must NOT delay the MVP)
 *   SELL           Team Uniforms | LETTERED | ISSUE
 *   OPERATE        Orders | Production | Creative
 *   PEOPLE         Team | Recruiting | Academy (R7: Academy DEFERRED)
 *   INTELLIGENCE   Performance | Territory
 *   ADMIN
 *
 * This module is the single source of the 2.0 information architecture. It is
 * data only (no React), so the architecture can be asserted in a unit test
 * without rendering the shell.
 *
 * NOTE ON OWNERSHIP: the rebuild brief reserves "the nav config file" for the
 * backend agent. No such 2.0 nav config existed on `rebuild/2.0` at Wave 2B, so
 * this file is created beside the shell that consumes it
 * (components/nav2/*) to unblock the frontend spine. It is intentionally NOT
 * placed in `apps/web/src/config/` to avoid colliding with that file.
 */

export type Nav2Item = {
  /** Stable key, also the label when no children. */
  key: string;
  label: string;
  /** Route path for a leaf. Absent on a section parent. */
  path?: string;
  /** Child leaves for a section. */
  children?: Nav2Item[];
  /** Honest marker for a surface deliberately deferred by ruling (R7). */
  deferred?: boolean;
  /** Short description of the surface's job (used as a tooltip/subtitle). */
  purpose?: string;
};

/** The base path the 2.0 spine is mounted at (see App.tsx route tree). */
export const OPS2_BASE_PATH = '/ops';

export function ops2Path(relative: string): string {
  return `${OPS2_BASE_PATH}${relative.startsWith('/') ? relative : `/${relative}`}`;
}

/**
 * The approved 2.0 IA, in the exact order and grouping of plan §2.4.
 */
export const NAV2: readonly Nav2Item[] = [
  {
    key: 'command',
    label: 'Command',
    path: ops2Path('/command'),
    purpose: 'Actionable operating surface — what needs action today.',
  },
  {
    key: 'markets',
    label: 'Markets',
    path: ops2Path('/markets'),
    purpose: 'War Board / pipeline of activated Markets. Never universe records.',
  },
  {
    key: 'sell',
    label: 'Sell',
    purpose: 'The three revenue engines.',
    children: [
      { key: 'sell-team-uniforms', label: 'Team Uniforms', path: ops2Path('/sell/team-uniforms') },
      { key: 'sell-lettered', label: 'LETTERED', path: ops2Path('/sell/lettered') },
      { key: 'sell-issue', label: 'ISSUE', path: ops2Path('/sell/issue') },
    ],
  },
  {
    key: 'operate',
    label: 'Operate',
    purpose: 'Fulfilment and delivery.',
    children: [
      { key: 'operate-orders', label: 'Orders', path: ops2Path('/operate/orders') },
      { key: 'operate-production', label: 'Production', path: ops2Path('/operate/production') },
      { key: 'operate-creative', label: 'Creative', path: ops2Path('/operate/creative') },
    ],
  },
  {
    key: 'people',
    label: 'People',
    purpose: 'Team, recruiting and academy.',
    children: [
      { key: 'people-team', label: 'Team', path: ops2Path('/people/team') },
      { key: 'people-recruiting', label: 'Recruiting', path: ops2Path('/people/recruiting') },
      { key: 'people-academy', label: 'Academy', path: ops2Path('/people/academy'), deferred: true },
    ],
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    purpose: 'Performance and territory.',
    children: [
      { key: 'intelligence-performance', label: 'Performance', path: ops2Path('/intelligence/performance') },
      { key: 'intelligence-territory', label: 'Territory', path: ops2Path('/intelligence/territory') },
    ],
  },
  {
    key: 'admin',
    label: 'Admin',
    path: ops2Path('/admin'),
    purpose: 'Administration.',
  },
] as const;

/** Sections (items with children), in order. */
export function nav2Sections(): Nav2Item[] {
  return NAV2.filter((item) => Array.isArray(item.children) && item.children.length > 0);
}

/** Leaf routes, flattened — used to generate the route tree and its tests. */
export function nav2LeafRoutes(): string[] {
  const routes: string[] = [];
  for (const item of NAV2) {
    if (item.path) routes.push(item.path);
    for (const child of item.children ?? []) {
      if (child.path) routes.push(child.path);
    }
  }
  return routes;
}
