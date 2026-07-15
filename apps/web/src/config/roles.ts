import type { Role, SidebarKey } from '../types';

type RoleConfig = {
  sidebarItems: SidebarKey[];
  dashboardWidgets: string[];
  primaryActions: string[];
  visiblePages: string[];
};

export const allSidebarItems: Record<SidebarKey, { label: string; route: string }> = {
  dashboard: { label: 'Dashboard', route: '/dashboard' },
  pipeline: { label: 'Pipeline', route: '/my-opportunities' },
  organizations: { label: 'Organizations', route: '/organizations' },
  territory: { label: 'Territory', route: '/territory' },
  invoices: { label: 'Orders', route: '/orders' },
  daily_command: { label: 'Daily Command', route: '/daily-command' },
  recruiting: { label: 'Recruiting', route: '/recruiting' },
  users: { label: 'Users', route: '/users' },
  settings: { label: 'Settings', route: '/settings' },
  academy: { label: 'TUF Academy', route: '/academy' },
  // Hidden from sidebar but routes still accessible:
  ecosystem: { label: 'Ecosystem Pipeline', route: '/ecosystem-pipeline' },
  performance: { label: 'All Opportunities', route: '/team-opportunities' },
  messages: { label: 'Earnings', route: '/earnings' },
  programs: { label: 'Reports', route: '/reports' },
  ops_workspace: { label: 'Ops Workspace', route: '/ops-workspace' },
  certification_review: { label: 'Certifications', route: '/admin/certification' },
  documents: { label: 'Documents', route: '/documents' },
  production_requests: { label: 'Production', route: '/production-requests' },
  orders: { label: 'Orders', route: '/orders' },
};

export const roleConfig: Record<Role, RoleConfig> = {
  ADMIN: {
    sidebarItems: ['dashboard', 'pipeline', 'organizations', 'territory', 'invoices', 'daily_command', 'recruiting', 'users', 'settings'],
    dashboardWidgets: ['Revenue at Risk', 'Near Close Pipeline', 'Payments Pending', 'Lane Penetration'],
    primaryActions: ['Unblock Strategic Deals', 'Expand Lanes', 'Coach Directors'],
    visiblePages: ['/dashboard', '/my-opportunities', '/team-opportunities', '/organizations', '/opportunities', '/ecosystem-pipeline', '/orders', '/reports', '/settings', '/ops-workspace', '/territory', '/earnings', '/users', '/academy', '/admin/certification', '/documents', '/daily-command', '/recruiting'],
  },
  REGIONAL_DIRECTOR: {
    sidebarItems: ['dashboard', 'pipeline', 'organizations', 'territory', 'daily_command', 'recruiting'],
    dashboardWidgets: ['Stuck Deals', 'Reps Needing Coaching', 'Near Close', 'Territory Coverage'],
    primaryActions: ['Coach Reps', 'Escalate Risk', 'Reassign Territory'],
    visiblePages: ['/dashboard', '/my-opportunities', '/team-opportunities', '/organizations', '/opportunities', '/ecosystem-pipeline', '/reports', '/territory', '/earnings', '/academy', '/admin/certification', '/daily-command', '/recruiting'],
  },
  DIRECTOR: {
    sidebarItems: ['dashboard', 'pipeline', 'organizations', 'territory', 'invoices', 'daily_command', 'recruiting', 'settings'],
    dashboardWidgets: ['Stuck Deals', 'Reps Needing Coaching', 'Near Close', 'Territory Coverage'],
    primaryActions: ['Coach Reps', 'Escalate Risk', 'Reassign Territory'],
    visiblePages: ['/dashboard', '/my-opportunities', '/team-opportunities', '/organizations', '/opportunities', '/ecosystem-pipeline', '/reports', '/territory', '/earnings', '/academy', '/admin/certification', '/orders', '/settings', '/documents', '/daily-command', '/recruiting'],
  },
  REP: {
    sidebarItems: ['dashboard', 'pipeline', 'organizations', 'invoices', 'daily_command', 'territory', 'settings'],
    dashboardWidgets: ['Deals Need Action', 'Near Close', 'Payments Pending', 'This Month Progress'],
    primaryActions: ['Call', 'Text', 'Email', 'Close Deal'],
    visiblePages: ['/dashboard', '/my-opportunities', '/organizations', '/opportunities', '/orders', '/earnings', '/academy', '/territory', '/settings', '/daily-command'],
  },
  OPERATIONS: {
    sidebarItems: ['dashboard', 'invoices', 'production_requests', 'orders', 'settings'],
    dashboardWidgets: ['Orders in Production', 'Quality Control', 'Shipping Queue'],
    primaryActions: ['Process Order', 'Update Status', 'QC Check'],
    visiblePages: ['/dashboard', '/orders', '/production-requests', '/settings'],
  },
};
