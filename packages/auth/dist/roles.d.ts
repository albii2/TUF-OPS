export declare const roles: {
    readonly ADMIN: "admin";
    readonly REGIONAL_DIRECTOR: "regional_director";
    readonly DIRECTOR: "director";
    readonly TAE: "tae";
    readonly OPERATIONS: "operations";
};
type ObjectValues<T> = T[keyof T];
export type Role = ObjectValues<typeof roles>;
export type RawRole = Role | 'ADMIN' | 'REGIONAL_DIRECTOR' | 'DIRECTOR' | 'REP' | 'sales_rep' | 'OPS' | 'OWNER' | 'OPERATIONS' | string;
export declare function normalizeRole(role: unknown): Role | null;
export declare function isAdmin(role: unknown): boolean;
export declare function isRegionalDirector(role: unknown): boolean;
export declare function isDirector(role: unknown): boolean;
export declare function isTae(role: unknown): boolean;
export declare function isOperations(role: unknown): boolean;
export {};
//# sourceMappingURL=roles.d.ts.map