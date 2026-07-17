import type { AppUser, Role } from '../types';
import type { TerritoryId } from '../data/mockSalesData';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ManagedUser = {
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
};
export type CredentialAuditAction = 'USER_CREATED' | 'TEMPORARY_CREDENTIAL_GENERATED' | 'CREDENTIAL_RESET' | 'CREDENTIAL_CHANGED' | 'FAILED_CREDENTIAL_ATTEMPT' | 'SUCCESSFUL_LOGIN';
export type CredentialAuditEntry = {
    id: string;
    action: CredentialAuditAction;
    targetUserId?: string;
    actorUserId?: string;
    createdAt: string;
    metadata: Record<string, unknown>;
};
export declare function listUsersAsync(): Promise<ManagedUser[]>;
export declare function listUsers(): ManagedUser[];
export declare function authenticateWithPin(pin: string): Promise<AppUser | null>;
export declare function authenticateWithCredential(_emailOrName: string, _credential: string): Promise<AppUser | null>;
export declare function getActiveUserByRole(role: Role): ManagedUser | undefined;
export declare function getManagedRepNamesForDirector(directorName: string): string[];
export declare function getManagedTerritoriesForDirector(directorName: string): TerritoryId[];
export declare function toggleUserHrDocs(id: string, hrDocsCompleted: boolean): Promise<void>;
export declare function toggleUserPracticalExercise(id: string, practicalExerciseCompleted: boolean): Promise<void>;
export declare function toggleUserDirectorSignoff(id: string, directorSignedOff: boolean): Promise<void>;
export declare function createUser(input: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    territory?: string;
    assignedDirectorId?: string;
    status?: string;
}, _actor?: AppUser | null): Promise<{
    user: ManagedUser;
    temporaryCredential: string;
}>;
export declare function updateUser(id: string, patch: any, _actor?: AppUser | null): Promise<any>;
export declare function resetUserCredential(id: string, _actor?: AppUser | null): Promise<{
    user: ManagedUser;
    temporaryCredential: string;
}>;
export declare function changeOwnCredential(userId: string, currentCredential: string, newCredential: string): Promise<{
    mustChangeCredential: boolean;
}>;
export declare function generateTemporaryCredential(): string;
export declare function avatarInitials(displayName: string): string;
export declare function formatUserDisplay(user: ManagedUser | AppUser): string;
export declare function seedBaselineUsers(): void;
//# sourceMappingURL=usersService.d.ts.map