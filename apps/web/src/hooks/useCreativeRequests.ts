import { useMemo } from 'react';
import { createCreativeRequest, listCreativeRequestsByOpportunity, type CreativeRequest } from '../services/creativeRequestsService';

export function useCreativeRequests(opportunityId?: string, refreshKey = 0) {
  return useMemo(() => opportunityId ? listCreativeRequestsByOpportunity(opportunityId) : [], [opportunityId, refreshKey]);
}

export function submitCreativeRequest(payload: Omit<CreativeRequest,'id'|'createdAt'|'updatedAt'|'createdBy'|'status'> & {status?: CreativeRequest['status']}) {
  return createCreativeRequest(payload);
}
