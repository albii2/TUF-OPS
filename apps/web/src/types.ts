export type Role = 'OWNER' | 'DIRECTOR' | 'REP' | 'OPS';

export type SidebarKey =
  | 'dashboard'
  | 'pipeline'
  | 'organizations'
  | 'ecosystem'
  | 'programs'
  | 'territory'
  | 'invoices'
  | 'performance'
  | 'messages'
  | 'ops_workspace'
  | 'settings'
  | 'users'
  | 'data_health';

export type AppUser = {
  name: string;
  role: Role;
};
