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
  | 'settings';

export type AppUser = {
  name: string;
  role: Role;
};
