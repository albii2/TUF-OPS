export type Role = 'ADMIN' | 'REGIONAL_DIRECTOR' | 'DIRECTOR' | 'REP' | 'OPERATIONS';

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
  | 'academy'
  | 'certification_review'
  | 'documents'
  | 'daily_command'
  | 'recruiting';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  rank: string | null;
  tier: string | null;
  region: string | null;
  state_market: string | null;
  division: string | null;
  territory: string | null;
  subterritory: string | null;
  sport_focus: string | null;
  assigned_director_id: number | null;
  reports_to_user_id: number | null;
  mustChangeCredential: boolean;
  hrDocsCompleted?: boolean;
  directorSignedOff?: boolean;
  practicalExerciseCompleted?: boolean;
  isCertified?: boolean;
}

export interface ManagedUser {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  role: Role;
  rank?: string | null;
  tier?: string | null;
  region?: string | null;
  state_market?: string | null;
  division?: string | null;
  territory: string;
  subterritory?: string | null;
  sport_focus?: string | null;
  assignedDirectorId?: string;
  reports_to_user_id?: string | null;
  status: UserStatus;
  avatarColor: string;
  mustChangeCredential: boolean;
  lastLoginAt?: string;
  lastCredentialAttemptAt?: string;
  lastActivityAt?: string;
  loginCount?: number;
  failedCredentialAttempts?: number;
  lockedUntil?: string | null;
  hrDocsCompleted?: boolean;
  directorSignedOff?: boolean;
  practicalExerciseCompleted?: boolean;
  isCertified?: boolean;
}
