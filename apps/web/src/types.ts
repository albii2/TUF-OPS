export type Role = 'OWNER' | 'DIRECTOR' | 'REP' | 'OPS';

export type SidebarKey =
  | 'dashboard'
  | 'pipeline'
  | 'organizations'
  | 'programs'
  | 'territory'
  | 'invoices'
  | 'performance'
  | 'messages'
  | 'ops_workspace'
  | 'training'
  | 'settings'
  | 'users';

export type AppUser = {
  name: string;
  role: Role;
};
