export type UserRole = 'OWNER' | 'ADMIN' | 'DIRECTOR' | 'REP' | 'OPS';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type SafeUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  territory: string | null;
  assigned_director_id: number | null;
  status: UserStatus;
  must_change_credential: boolean;
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
  territory?: string;
  assigned_director_id?: number;
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
