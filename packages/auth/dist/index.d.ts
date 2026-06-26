import { type Permission } from './permissions.js';
import { type Role } from './roles.js';
export * from './roles.js';
export * from './permissions.js';
export * from './stages.js';
export interface User {
    id: string | number;
    role?: Role | string;
    roles?: Array<Role | string>;
}
export declare class PermissionDenied extends Error {
    statusCode: number;
    constructor(message: string);
}
export declare function hasPermission(userOrRole: User | Role | string | null | undefined, permission: Permission): boolean;
export declare function requirePermission(userOrRole: User | Role | string | null | undefined, permission: Permission): void;
export declare function requireRole(userOrRole: User | Role | string | null | undefined, role: Role): void;
//# sourceMappingURL=index.d.ts.map