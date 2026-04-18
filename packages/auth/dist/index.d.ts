import { Role, Permission } from './roles.js';
export * from './roles.js';
export interface User {
    id: string;
    roles: Role[];
}
export declare function hasPermission(user: User, permission: Permission): boolean;
//# sourceMappingURL=index.d.ts.map