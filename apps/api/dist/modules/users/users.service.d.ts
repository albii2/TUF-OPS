import type { ChangeCredentialPayload, CreateUserPayload, LoginPayload, SafeUser } from './users.interface';
declare function getAuthTokenSecret(): string;
export declare function assertAuthTokenSecretConfigured(): void;
/** Test-only access to internals (kept intentionally minimal). */
export declare const __test: {
    sanitizeUser: typeof sanitizeUser;
    getAuthTokenSecret: typeof getAuthTokenSecret;
};
export declare function createAuthToken(user: SafeUser): string;
export declare function verifyAuthToken(token?: string): Promise<SafeUser | null>;
declare function sanitizeUser(row: any): SafeUser;
export declare function getSafeUserById(id: number): Promise<SafeUser | null>;
export declare function listUsers(actor?: SafeUser | null): Promise<SafeUser[]>;
export declare function createUserWithTemporaryCredential(payload: CreateUserPayload, actor: SafeUser): Promise<{
    user: SafeUser;
    temporaryCredential: string;
}>;
export declare function resetUserCredential(targetUserId: number, actor: SafeUser): Promise<{
    user: SafeUser;
    temporaryCredential: string;
}>;
export declare function setUserStatus(targetUserId: number, status: 'ACTIVE' | 'INACTIVE', actor: SafeUser): Promise<any>;
export declare function updateUser(targetUserId: number, patch: Record<string, any>, actor: SafeUser): Promise<SafeUser | null>;
export declare function loginWithCredential(payload: LoginPayload): Promise<{
    user: SafeUser;
    token: string;
} | null>;
export declare function changeOwnCredential(userId: number, payload: ChangeCredentialPayload): Promise<SafeUser>;
export declare function seedInitialOwnerIfEmpty(initialCredential?: string): Promise<void>;
/**
 * Certify a user as having completed Academy training.
 * Only callable by users with INVITE_USER permission (Director+).
 */
export declare function certifyUser(userId: number, actor: SafeUser): Promise<SafeUser>;
export {};
//# sourceMappingURL=users.service.d.ts.map