import { useQuery } from '@tanstack/react-query';
import { getOrganizations, getOrganization, queryKeys, } from '../api';
export function useOrganizations(params) {
    return useQuery({
        queryKey: queryKeys.organizations.list(params),
        queryFn: () => getOrganizations(params),
    });
}
export function useOrganizationById(id) {
    return useQuery({
        queryKey: queryKeys.organizations.detail(id ?? ''),
        queryFn: () => getOrganization(id),
        enabled: Boolean(id),
    });
}
export function useUntouchedAccounts() {
    return useQuery({
        queryKey: queryKeys.organizations.untouched(),
        queryFn: async () => {
            const orgs = await getOrganizations({});
            return orgs.filter((o) => o.coverageStatus === 'UNTOUCHED');
        },
    });
}
export function useStaleAccounts() {
    return useQuery({
        queryKey: queryKeys.organizations.stale(),
        queryFn: async () => {
            const orgs = await getOrganizations({});
            const staleThreshold = new Date();
            staleThreshold.setDate(staleThreshold.getDate() - 14);
            return orgs.filter((o) => new Date(o.lastActivity) < staleThreshold);
        },
    });
}
export function useAccountsNeedingAction() {
    return useQuery({
        queryKey: queryKeys.organizations.needsAction(),
        queryFn: async () => {
            const orgs = await getOrganizations({});
            return orgs.filter((o) => o.coverageStatus !== 'CLOSED' && o.nextAction.trim().length > 0);
        },
    });
}
//# sourceMappingURL=useOrganizations.js.map