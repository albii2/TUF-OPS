import type { ChangeCredentialPayload, CreateUserPayload, CredentialAuditAction, LoginPayload, SafeUser } from './users.interface';
declare function getAuthTokenSecret(): string;
export declare function assertAuthTokenSecretConfigured(): void;
declare function getBootstrapOwnerCredential(): string;
export declare function createAuthToken(user: SafeUser): string;
export declare function verifyAuthToken(token?: string): Promise<SafeUser | null>;
declare function sanitizeUser(row: any): SafeUser;
declare function audit(action: CredentialAuditAction, targetUserId: number | null, actorUserId?: number | null, metadata?: Record<string, unknown>): Promise<void>;
export declare function getSafeUserById(id: number): Promise<SafeUser | null>;
export declare function listUsers(actor?: SafeUser | null): Promise<SafeUser[]>;
export declare function createUserWithTemporaryCredential(payload: CreateUserPayload, actor: SafeUser): Promise<{
    user: SafeUser;
    temporaryCredential: string;
}>;
export declare function resetUserCredential(targetUserId: number, actor: SafeUser, temporaryCredential?: string): Promise<{
    user: SafeUser;
    temporaryCredential: string;
}>;
export declare function loginWithCredential(payload: LoginPayload): Promise<{
    user: SafeUser;
    token: string;
} | null>;
export declare function changeOwnCredential(userId: number, payload: ChangeCredentialPayload): Promise<SafeUser>;
export declare function seedInitialOwnerIfEmpty(initialCredential?: string): Promise<void>;
export declare const __test: {
    sanitizeUser: typeof sanitizeUser;
    audit: typeof audit;
    createAuthToken: typeof createAuthToken;
    verifyAuthToken: typeof verifyAuthToken;
    getAuthTokenSecret: typeof getAuthTokenSecret;
    getBootstrapOwnerCredential: typeof getBootstrapOwnerCredential;
};
/**
 * Certify a user as having completed Academy training.
 * Only callable by users with INVITE_USER permission (Director+).
 */
export declare function certifyUser(userId: number, actor: SafeUser): Promise<SafeUser>;
export {};
//# sourceMappingURL=users.service.d.ts.map