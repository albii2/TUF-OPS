import type { Role, SidebarKey } from '../types';

type RoleConfig = {
  sidebarItems: SidebarKey[];
  dashboardWidgets: string[];
  primaryActions: string[];
  visiblePages: string[];
};

export const allSidebarItems: Record<SidebarKey, { label: string; route: string }> = {
  command: { label: 'Command Center', route: '/command' },
  organizations: { label: 'Organizations', route: '/organizations' },
  pipeline: { label: 'Pipeline', route: '/opportunities' },
  academy: { label: 'TUF Academy', route: '/academy' },
  orders: { label: 'Orders', route: '/orders' },
  people: { label: 'People', route: '/people' },
  recruiting: { label: 'Recruiting', route: '/recruiting' },
  settings: { label: 'Settings', route: '/settings' },
  // Legacy — kept for route existence but hidden from sidebar:
  dashboard: { label: 'Dashboard', route: '/dashboard' },
  territory: { label: 'Territory', route: '/territory' },
  invoices: { label: 'Orders', route: '/orders' },
  daily_command: { label: 'Daily Command', route: '/daily-command' },
  users: { label: 'Users', route: '/users' },
  ecosystem: { label: 'Ecosystem Pipeline', route: '/ecosystem-pipeline' },
  performance: { label: 'All Opportunities', route: '/team-opportunities' },
  messages: { label: 'Earnings', route: '/earnings' },
  programs: { label: 'Reports', route: '/reports' },
  ops_workspace: { label: 'Ops Workspace', route: '/ops-workspace' },
  certification_review: { label: 'Certifications', route: '/admin/certification' },
  documents: { label: 'Documents', route: '/documents' },
  production_requests: { label: 'Production', route: '/production-requests' },
};

export const roleConfig: Record<Role, RoleConfig> = {
  ADMIN: {
    sidebarItems: ['command', 'organizations', 'pipeline', 'orders', 'academy', 'people', 'recruiting', 'settings'],
    dashboardWidgets: ["Today's Priorities", 'Who Needs You', 'Territory Snapshot'],
    primaryActions: ['Create Status Check', 'Review Pipeline', 'Coach Directors'],
    visiblePages: ['/command', '/organizations', '/opportunities', '/my-opportunities', '/team-opportunities', '/orders', '/academy', '/people', '/recruiting', '/intake', '/comms', '/settings', '/territory', '/users', '/admin/certification', '/daily-command', '/forge'],
  },
  REGIONAL_DIRECTOR: {
    sidebarItems: ['command', 'organizations', 'pipeline', 'orders', 'academy', 'people', 'recruiting'],
    dashboardWidgets: ["Today's Priorities", 'Team Status', 'Territory Snapshot'],
    primaryActions: ['Coach Reps', 'Review Pipeline', 'Assign Accounts'],
    visiblePages: ['/command', '/organizations', '/opportunities', '/team-opportunities', '/orders', '/academy', '/people', '/recruiting', '/territory', '/admin/certification'],
  },
  DIRECTOR: {
    sidebarItems: ['command', 'organizations', 'pipeline', 'orders', 'academy', 'people', 'recruiting'],
    dashboardWidgets: ["Today's Priorities", 'Team Status', 'Territory Snapshot'],
    primaryActions: ['Coach Reps', 'Review Pipeline', 'Assign Accounts'],
    visiblePages: ['/command', '/organizations', '/opportunities', '/team-opportunities', '/orders', '/academy', '/people', '/recruiting', '/territory', '/admin/certification'],
  },
  REP: {
    sidebarItems: ['command', 'organizations', 'pipeline', 'orders', 'academy', 'settings'],
    dashboardWidgets: ["Today's Priorities", 'Who to Contact', 'Pipeline Progress'],
    primaryActions: ['Create Opportunity', 'Contact School', 'Advance Deal'],
    visiblePages: ['/command', '/organizations', '/my-opportunities', '/opportunities/new', '/organizations/new', '/orders', '/academy', '/settings', '/territory'],
  },
  OPERATIONS: {
    sidebarItems: ['dashboard', 'invoices', 'production_requests', 'orders', 'settings'],
    dashboardWidgets: ['Orders in Production', 'Quality Control', 'Shipping Queue'],
    primaryActions: ['Process Order', 'Update Status', 'QC Check'],
    visiblePages: ['/dashboard', '/orders', '/production-requests', '/settings'],
  },
};
