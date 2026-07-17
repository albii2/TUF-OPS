import type { AppUser, Role } from '@tuf/shared';
export declare function getStoredToken(): string | null;
export declare function clearToken(): void;
export declare function getStoredUser(): AppUser | null;
export declare function fetchCurrentUser(): Promise<AppUser | null>;
export declare function loginWithPin(pin: string): Promise<AppUser | null>;
export declare function loginWithCredential(emailOrName: string, credential: string): Promise<AppUser | null>;
export declare function updateRole(role: Role): AppUser | null;
export declare function updateStoredUser(user: AppUser): AppUser;
export declare function logout(): void;
//# sourceMappingURL=auth.d.ts.map