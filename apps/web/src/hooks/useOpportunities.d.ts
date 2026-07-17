import type { OpportunityListParams } from '../services/opportunitiesService';
export declare function useOpportunities(params: OpportunityListParams): import("@tanstack/react-query").UseQueryResult<NoInfer<Opportunity[]>, Error>;
export declare function useOpportunityById(id?: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useOpportunityStages(): import("@tanstack/react-query").UseQueryResult<unknown, Error>;
export declare function useRevenueLanes(): import("@tanstack/react-query").UseQueryResult<unknown, Error>;
//# sourceMappingURL=useOpportunities.d.ts.map