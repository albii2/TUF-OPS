import type { OrderListParams } from '../services/ordersService';
export declare function useOrders(params: OrderListParams): import("@tanstack/react-query").UseQueryResult<NoInfer<Order[]>, Error>;
export declare function useOrderById(id?: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useOpsWorkspaceQueues(): import("@tanstack/react-query").UseQueryResult<unknown, Error>;
export declare function useOrderByOpportunityId(opportunityId?: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
//# sourceMappingURL=useOrders.d.ts.map