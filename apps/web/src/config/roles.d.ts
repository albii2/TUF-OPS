import type { Role, SidebarKey } from '../types';
type RoleConfig = {
    sidebarItems: SidebarKey[];
    dashboardWidgets: string[];
    primaryActions: string[];
    visiblePages: string[];
};
export declare const allSidebarItems: Record<SidebarKey, {
    label: string;
    route: string;
}>;
export declare const roleConfig: Record<Role, RoleConfig>;
export {};
//# sourceMappingURL=roles.d.ts.map