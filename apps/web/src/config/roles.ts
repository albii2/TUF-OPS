import type { Role, SidebarKey } from '../types';

type RoleConfig = {
  sidebarItems: SidebarKey[];
  dashboardWidgets: string[];
  primaryActions: string[];
  visiblePages: string[];
};

export const allSidebarItems: Record<SidebarKey, { label: string; route: string }> = {
  dashboard: { label: 'Dashboard', route: '/dashboard' },
  pipeline: { label: 'Pipeline', route: '/opportunities' },
  organizations: { label: 'Organizations', route: '/organizations' },
  programs: { label: 'Programs', route: '/reports' },
  territory: { label: 'Territory', route: '/reports' },
  invoices: { label: 'Invoices', route: '/orders' },
  performance: { label: 'Performance', route: '/reports' },
  messages: { label: 'Messages', route: '/reports' },
  settings: { label: 'Settings', route: '/settings' },
};

export const roleConfig: Record<Role, RoleConfig> = {
  OWNER: {
    sidebarItems: ['dashboard', 'pipeline', 'organizations', 'programs', 'territory', 'invoices', 'performance', 'messages', 'settings'],
    dashboardWidgets: ['Total Pipeline', 'Closed Won MTD', 'Lane Penetration', 'Stuck Deals', 'Top Opportunities', 'Rep/Director Performance'],
    primaryActions: ['Assign Deals', 'Review Revenue', 'Unblock Stuck Deals'],
    visiblePages: ['/dashboard', '/organizations', '/opportunities', '/orders', '/reports', '/settings', '/ops-workspace'],
  },
  DIRECTOR: {
    sidebarItems: ['dashboard', 'pipeline', 'organizations', 'territory', 'performance', 'messages', 'settings'],
    dashboardWidgets: ['Territory Pipeline', 'Rep Performance', 'Team Action Issues', 'Near-Close by Rep', 'Territory Map'],
    primaryActions: ['Coach Rep', 'Escalate Blocker', 'Rebalance Territory'],
    visiblePages: ['/dashboard', '/organizations', '/opportunities', '/reports', '/settings'],
  },
  REP: {
    sidebarItems: ['dashboard', 'pipeline', 'organizations', 'programs', 'invoices', 'messages', 'settings'],
    dashboardWidgets: ['Today Focus', 'Next Actions', 'Near Close', 'Pipeline Snapshot', 'Revenue', 'Recent Activity', 'This Month'],
    primaryActions: ['Call', 'Text', 'Email', 'Mark Done'],
    visiblePages: ['/dashboard', '/organizations', '/opportunities', '/orders', '/settings'],
  },
  OPS: {
    sidebarItems: ['dashboard', 'organizations', 'programs', 'invoices', 'performance', 'settings'],
    dashboardWidgets: ['New Orders', 'Needs Review', 'Ready for Vendor', 'In Production', 'Blocked', 'Completed'],
    primaryActions: ['Review Order', 'Route Vendor', 'Resolve Blocked'],
    visiblePages: ['/dashboard', '/organizations', '/orders', '/ops-workspace', '/settings'],
  },
};
