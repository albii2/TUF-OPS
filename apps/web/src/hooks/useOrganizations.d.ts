import type { OrganizationListParams } from '../services/organizationsService';
export declare function useOrganizations(params: OrganizationListParams): import("@tanstack/react-query").UseQueryResult<NoInfer<Organization[]>, Error>;
export declare function useOrganizationById(id?: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useUntouchedAccounts(): import("@tanstack/react-query").UseQueryResult<NoInfer<Organization[]>, Error>;
export declare function useStaleAccounts(): import("@tanstack/react-query").UseQueryResult<NoInfer<Organization[]>, Error>;
export declare function useAccountsNeedingAction(): import("@tanstack/react-query").UseQueryResult<NoInfer<Organization[]>, Error>;
//# sourceMappingURL=useOrganizations.d.ts.map