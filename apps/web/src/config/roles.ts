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
  ecosystem: { label: 'Ecosystem Pipeline', route: '/ecosystem-pipeline' },
  programs: { label: 'Reports', route: '/reports' },
  territory: { label: 'Territory', route: '/territory' },
  invoices: { label: 'Orders', route: '/orders' },
  performance: { label: 'All Opportunities', route: '/team-opportunities' },
  messages: { label: 'Earnings', route: '/earnings' },
  ops_workspace: { label: 'Ops Workspace', route: '/ops-workspace' },
  settings: { label: 'Settings', route: '/settings' },
  users: { label: 'Users', route: '/users' },
  academy: { label: 'TUF Academy', route: '/academy' },
  certification_review: { label: 'Certifications', route: '/admin/certification' },
  documents: { label: 'Documents', route: '/documents' },
  vendor_ops: { label: 'Vendor Ops', route: '/vendor-ops' },
};

export const roleConfig: Record<Role, RoleConfig> = {
  ADMIN: {
    sidebarItems: ['dashboard', 'organizations', 'ecosystem', 'pipeline', 'invoices', 'ops_workspace', 'vendor_ops', 'performance', 'territory', 'messages', 'programs', 'users', 'academy', 'certification_review', 'settings'],
    dashboardWidgets: ['Revenue at Risk', 'Near Close Pipeline', 'Payments Pending', 'Lane Penetration'],
    primaryActions: ['Unblock Strategic Deals', 'Expand Lanes', 'Coach Directors'],
    visiblePages: ['/dashboard', '/organizations', '/opportunities', '/ecosystem-pipeline', '/orders', '/reports', '/settings', '/ops-workspace', '/territory', '/my-opportunities', '/team-opportunities', '/team-performance', '/earnings', '/users', '/academy', '/admin/certification', '/documents', '/vendor-ops', '/vendors'],
  },
  REGIONAL_DIRECTOR: {
    sidebarItems: ['dashboard', 'pipeline', 'performance', 'organizations', 'ecosystem', 'territory', 'messages', 'programs', 'academy'],
    dashboardWidgets: ['Stuck Deals', 'Reps Needing Coaching', 'Near Close', 'Territory Coverage'],
    primaryActions: ['Coach Reps', 'Escalate Risk', 'Reassign Territory'],
    visiblePages: ['/dashboard', '/organizations', '/opportunities', '/ecosystem-pipeline', '/reports', '/territory', '/my-opportunities', '/team-opportunities', '/team-performance', '/earnings', '/academy', '/admin/certification'],
  },
  DIRECTOR: {
    sidebarItems: ['dashboard', 'pipeline', 'performance', 'organizations', 'ecosystem', 'territory', 'invoices', 'messages', 'programs', 'academy', 'settings', 'certification_review', 'documents'],
    dashboardWidgets: ['Stuck Deals', 'Reps Needing Coaching', 'Near Close', 'Territory Coverage'],
    primaryActions: ['Coach Reps', 'Escalate Risk', 'Reassign Territory'],
    visiblePages: ['/dashboard', '/organizations', '/opportunities', '/ecosystem-pipeline', '/reports', '/territory', '/my-opportunities', '/team-opportunities', '/team-performance', '/earnings', '/academy', '/admin/certification', '/orders', '/settings', '/documents'],
  },
  REP: {
    sidebarItems: ['dashboard', 'pipeline', 'organizations', 'invoices', 'messages', 'academy', 'territory', 'settings'],
    dashboardWidgets: ['Deals Need Action', 'Near Close', 'Payments Pending', 'This Month Progress'],
    primaryActions: ['Call', 'Text', 'Email', 'Close Deal'],
    visiblePages: ['/dashboard', '/organizations', '/opportunities', '/orders', '/my-opportunities', '/earnings', '/academy', '/territory', '/settings'],
  },
  OPS: {
    sidebarItems: ['dashboard', 'vendor_ops', 'invoices', 'ops_workspace'],
    dashboardWidgets: ['Active Vendors', 'Orders In Production', 'Pending Assignment', 'Completed This Week'],
    primaryActions: ['Assign Vendor', 'Review Production', 'Process Payment'],
    visiblePages: ['/dashboard', '/vendor-ops', '/vendors', '/orders', '/ops-workspace'],
  },
};
