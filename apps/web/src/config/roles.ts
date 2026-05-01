import type { Role, SidebarKey } from '../types';

type RoleConfig = {
  sidebarItems: SidebarKey[];
  dashboardWidgets: string[];
  primaryActions: string[];
  visiblePages: string[];
};

export const allSidebarItems: Record<SidebarKey, { label: string; route: string }> = {
  dashboard: { label: 'Dashboard', route: '/dashboard' },
  pipeline: { label: 'Opportunities', route: '/opportunities' },
  organizations: { label: 'Organizations', route: '/organizations' },
  programs: { label: 'Programs', route: '/reports' },
  territory: { label: 'Territory', route: '/territory' },
  invoices: { label: 'Orders', route: '/orders' },
  performance: { label: 'Team', route: '/reports' },
  messages: { label: 'Earnings', route: '/reports' },
  ops_workspace: { label: 'Ops Workspace', route: '/ops-workspace' },
  settings: { label: 'Settings', route: '/settings' },
};

export const roleConfig: Record<Role, RoleConfig> = {
  OWNER: {
    sidebarItems: ['dashboard', 'organizations', 'pipeline', 'invoices', 'ops_workspace', 'programs', 'settings'],
    dashboardWidgets: ['Revenue at Risk', 'Near Close Pipeline', 'Payments Pending', 'Lane Penetration'],
    primaryActions: ['Unblock Strategic Deals', 'Expand Lanes', 'Coach Directors'],
    visiblePages: ['/dashboard', '/organizations', '/opportunities', '/orders', '/reports', '/settings', '/ops-workspace', '/territory', '/my-opportunities', '/team-opportunities', '/team-performance'],
  },
  DIRECTOR: {
    sidebarItems: ['dashboard', 'pipeline', 'organizations', 'territory', 'performance', 'programs', 'settings'],
    dashboardWidgets: ['Stuck Deals', 'Reps Needing Coaching', 'Near Close', 'Territory Coverage'],
    primaryActions: ['Coach Reps', 'Escalate Risk', 'Reassign Territory'],
    visiblePages: ['/dashboard', '/organizations', '/opportunities', '/reports', '/settings', '/territory', '/my-opportunities', '/team-opportunities', '/team-performance'],
  },
  REP: {
    sidebarItems: ['dashboard', 'organizations', 'pipeline', 'invoices', 'messages', 'settings'],
    dashboardWidgets: ['Deals Need Action', 'Near Close', 'Payments Pending', 'This Month Progress'],
    primaryActions: ['Call', 'Text', 'Email', 'Close Deal'],
    visiblePages: ['/dashboard', '/organizations', '/opportunities', '/orders', '/settings', '/my-opportunities'],
  },
  OPS: {
    sidebarItems: ['ops_workspace', 'invoices', 'territory', 'programs', 'settings'],
    dashboardWidgets: ['New Orders', 'Missing Info', 'Blocked Orders', 'Ready for Vendor'],
    primaryActions: ['Resolve Missing Info', 'Route Vendor', 'Clear Blockers'],
    visiblePages: ['/dashboard', '/organizations', '/orders', '/ops-workspace', '/settings', '/reports'],
  },
};
