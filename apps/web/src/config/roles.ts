import type { Role, SidebarKey } from '../types';

type RoleConfig = {
  sidebarItems: SidebarKey[];
  dashboardWidgets: string[];
  primaryActions: string[];
  visiblePages: string[];
};

export const allSidebarItems: Record<SidebarKey, { label: string; route: string }> = {
  dashboard: { label: 'Dashboard', route: '/dashboard' },
  pipeline: { label: 'My Opportunities', route: '/my-opportunities' },
  organizations: { label: 'Organizations', route: '/organizations' },
  programs: { label: 'Reports', route: '/reports' },
  territory: { label: 'Territory', route: '/territory' },
  invoices: { label: 'Orders', route: '/orders' },
  performance: { label: 'All Opportunities', route: '/team-opportunities' },
  messages: { label: 'Earnings', route: '/earnings' },
  ops_workspace: { label: 'Ops Workspace', route: '/ops-workspace' },
  settings: { label: 'Settings', route: '/settings' },
  users: { label: 'Users', route: '/users' },
};

export const roleConfig: Record<Role, RoleConfig> = {
  OWNER: {
    sidebarItems: ['dashboard', 'organizations', 'pipeline', 'invoices', 'ops_workspace', 'performance', 'territory', 'messages', 'programs', 'users', 'settings'],
    dashboardWidgets: ['Revenue at Risk', 'Near Close Pipeline', 'Payments Pending', 'Lane Penetration'],
    primaryActions: ['Unblock Strategic Deals', 'Expand Lanes', 'Coach Directors'],
    visiblePages: ['/dashboard', '/organizations', '/opportunities', '/orders', '/reports', '/settings', '/ops-workspace', '/territory', '/my-opportunities', '/team-opportunities', '/team-performance', '/earnings', '/users'],
  },
  DIRECTOR: {
    sidebarItems: ['dashboard', 'pipeline', 'performance', 'organizations', 'territory', 'messages', 'programs', 'users', 'settings'],
    dashboardWidgets: ['Stuck Deals', 'Reps Needing Coaching', 'Near Close', 'Territory Coverage'],
    primaryActions: ['Coach Reps', 'Escalate Risk', 'Reassign Territory'],
    visiblePages: ['/dashboard', '/organizations', '/opportunities', '/reports', '/settings', '/territory', '/my-opportunities', '/team-opportunities', '/team-performance', '/earnings', '/users'],
  },
  REP: {
    sidebarItems: ['dashboard', 'pipeline', 'organizations', 'invoices', 'messages', 'settings'],
    dashboardWidgets: ['Deals Need Action', 'Near Close', 'Payments Pending', 'This Month Progress'],
    primaryActions: ['Call', 'Text', 'Email', 'Close Deal'],
    visiblePages: ['/dashboard', '/organizations', '/opportunities', '/orders', '/settings', '/my-opportunities', '/earnings'],
  },
  OPS: {
    sidebarItems: ['dashboard', 'ops_workspace', 'invoices', 'programs', 'settings'],
    dashboardWidgets: ['New Orders', 'Missing Info', 'Blocked Orders', 'Ready for Vendor'],
    primaryActions: ['Resolve Missing Info', 'Route Vendor', 'Clear Blockers'],
    visiblePages: ['/dashboard', '/organizations', '/orders', '/ops-workspace', '/settings', '/reports'],
  },
};
