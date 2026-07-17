import { type CreativeRequest } from '../services/creativeRequestsService';
export declare function useCreativeRequests(opportunityId?: string, refreshKey?: number): any;
export declare function submitCreativeRequest(payload: Omit<CreativeRequest, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'status'> & {
    status?: CreativeRequest['status'];
}): any;
//# sourceMappingURL=useCreativeRequests.d.ts.map