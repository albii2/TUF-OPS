import { useMemo } from 'react';
import { createCreativeRequest, listCreativeRequestsByOpportunity } from '../services/creativeRequestsService';
export function useCreativeRequests(opportunityId, refreshKey = 0) {
    return useMemo(() => opportunityId ? listCreativeRequestsByOpportunity(opportunityId) : [], [opportunityId, refreshKey]);
}
export function submitCreativeRequest(payload) {
    return createCreativeRequest(payload);
}
//# sourceMappingURL=useCreativeRequests.js.map