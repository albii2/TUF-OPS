export declare const roles: {
    readonly ADMIN: "admin";
    readonly USER: "user";
};
export declare const permissions: {
    readonly ORGANIZATIONS_READ: "organizations:read";
    readonly ORGANIZATIONS_WRITE: "organizations:write";
    readonly OPPORTUNITIES_READ: "opportunities:read";
    readonly OPPORTUNITIES_WRITE: "opportunities:write";
};
export declare const rolePermissions: {
    admin: ("organizations:read" | "organizations:write" | "opportunities:read" | "opportunities:write")[];
    user: ("organizations:read" | "opportunities:read")[];
};
type ObjectValues<T> = T[keyof T];
export type Role = ObjectValues<typeof roles>;
export type Permission = ObjectValues<typeof permissions>;
export {};
//# sourceMappingURL=roles.d.ts.map