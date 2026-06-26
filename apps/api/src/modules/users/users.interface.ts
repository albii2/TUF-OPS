export type UserRole = 'ADMIN' | 'REGIONAL_DIRECTOR' | 'DIRECTOR' | 'REP' | 'sales_rep' | 'OPS' | 'OWNER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type SafeUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
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
  status: UserStatus;
  must_change_credential: boolean;
  is_certified: boolean;
  hr_docs_completed: boolean;
  director_signed_off: boolean;
  practical_exercise_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type CredentialAuditAction =
  | 'USER_CREATED'
  | 'TEMPORARY_CREDENTIAL_GENERATED'
  | 'CREDENTIAL_RESET'
  | 'CREDENTIAL_CHANGED'
  | 'FAILED_CREDENTIAL_ATTEMPT'
  | 'SUCCESSFUL_LOGIN';

export type CreateUserPayload = {
  name: string;
  email: string;
  role: UserRole;
  rank?: string;
  tier?: string;
  region?: string;
  state_market?: string;
  division?: string;
  territory?: string;
  subterritory?: string;
  sport_focus?: string;
  assigned_director_id?: number;
  reports_to_user_id?: number;
  temporary_credential?: string;
};

export type LoginPayload = {
  email: string;
  credential: string;
};

export type ChangeCredentialPayload = {
  current_credential: string;
  new_credential: string;
};

export type AuthSession = {
  userId: number;
  expiresAt: number;
};
