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
  | 'data_health'
  | 'academy';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangeCredential: boolean;
  hrDocsCompleted?: boolean;
  directorSignedOff?: boolean;
  practicalExerciseCompleted?: boolean;
  isCertified?: boolean;
};
